const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'creategroup',
  description: "this command creates random private class groups, args: .creategroup membersNum(int), assignStudents(bool) // options: -m (no auto-assign members to groups), -n (create n groups, no assignation), -o (only assign online students)",
  async execute(message, args, db) {

    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    let serverDB;
    
    await db.get("server").then(async servers_db => {
      serverDB = servers_db.find(guild => guild.id == message.guild.id);
    });

    if (serverDB == null || !serverDB.init) {
        updateOutput(output, embed,"**Error**: El servidor no está inicializado. Utiliza el comando .startclass para poder inicializarlo. Puedes obtener más información introduciendo el comando .help startclass");
    }
    
    //gestión de errores
    else if (!message.member.roles.cache.some(role => role.name == "Teachers")) {
      updateOutput(output, embed,"**Error**: Este comando solo puede ser ejecutado por miembros con el rol 'Teachers'.");
    }
    else if (args.length < 1) updateOutput(output, embed,"**Error**: No has indicado el número de integrantes por grupo, ejem: .creategroup 4");
      
    else {
      if (args.some(arg => arg == "-n")) { //create n groups
        if (args[0] < 1) updateOutput(output, embed,"**Error**: El número de grupos ha de ser mayor que 0, ejem: .creategroup 1 -n");
        else if (args[0] > 50) updateOutput(output, embed,"**Error**: El número de grupos ha de ser menor o igual a 50, ejem: .creategroup 50 -n");
        else if (!isNumeric(args[0])) updateOutput(output, embed,"**Error**: No has indicado el número de grupos a crear, ejem: .creategroup 2 -n");
        else {
          let numGroups = args[0];
          await createNGroups(message.guild, numGroups);
          updateOutput(output, embed, "Se han creado " + numGroups + " grupos sin asignación");
        }
        
      }

      else { //create groups with membersNum members
        if (args[0] < 1) updateOutput(output, embed,"**Error**: El número de integrantes ha de ser mayor que 0, ejem: .creategroup 2");
        else if (!isNumeric(args[0])) updateOutput(output, embed,"**Error**: No has indicado el número de integrantes por grupo, ejem: .creategroup 4");

        else {

        let numMembers = args[0];
        let autoAssign = true;
        let online = false;
          
        if (args.some(arg => arg == "-m")) autoAssign = false;
        if (args.some(arg => arg == "-o")) online = true;
        
        await createRandomGroups(message.guild, output, embed, numMembers, autoAssign, online);
        }
      }
    }
  }
}


async function createNGroups(server, numGroups) {
  await createChannelsRoles(server, "", "", numGroups, -1, [], false);
}

async function createRandomGroups(server, output, embed, numMembers, autoAssign, online) {
  let members = await server.members.fetch();
  let students = getStudents(members, online);
  let numStudents = students.length;
  let numGroups = Math.ceil(numStudents/numMembers);

  if (numGroups <= 0) {
    updateOutput(output, embed,"**Error**: No hay usuarios con rol 'Student' en el servidor para poder crear los grupos. Prueba con la opción -n para crear servidores sin asignación.");
  }

  else {
    await createChannelsRoles(server, output, embed, numGroups, numMembers, students, autoAssign);
    if (autoAssign) updateOutput(output, embed, "Se han creado grupos aleatorios de " + numMembers + " integrantes.");
    else updateOutput(output, embed, "Se han creado grupos de " + numMembers + " integrantes."); 
  }
  
}

async function createChannelsRoles(server, output, embed, numGroups, numMembers, students, autoAssign) {

  let teacherRole = server.roles.cache.find(role => role.name == "Teachers");

  let num = getHigherGroupNum(server) + 1;

  for (let i = 0; i< numGroups; i++) {
    let groupCategoryId = 0;
    let groupRole = "";

    if (autoAssign) {

      await server.roles.create({
      name: 'CB Group ' + (num + i),
      color: 'GREEN',
      reason: 'role for group ' + (num + i),
    })
      .then(role => {
        groupRole = role;
        students = assignRoles(output, embed, numMembers, students, role);
      })
      .catch(console.error);
    }
      
    let category = await server.channels.create('CB Group ' + (num + i), {
    type: "GUILD_CATEGORY",
    })
    .catch(console.error);

    groupCategoryId = category.id;
    if (autoAssign) {
      await category.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false })
      await category.permissionOverwrites.create(groupRole, { VIEW_CHANNEL: true });
      await category.permissionOverwrites.create(teacherRole, { VIEW_CHANNEL: true });
    }
    
    server.channels.create("CB Chat Grupo " + (num + i), {
    type: "GUILD_TEXT",
    }).then(channel => {
      channel.setParent(groupCategoryId);
    });

    server.channels.create("CB Grupo " + (num + i) + " - Voz", {
    type: "GUILD_VOICE",
    }).then(channel => {
    channel.setParent(groupCategoryId);
    });
  }

}

function getStudents(members, online) {
  let studentMembers = [];
  let validStatus = ["online", "idle", "dnd"];
  members.forEach(member => {
    if (member.roles.cache.some(role => role.name == "Students")) {
      if ((online && validStatus.includes(member.presence?.status)) || !online) studentMembers.push(member);
    }
  });
  return studentMembers;
}

function assignRoles(output, embed, numMembers, students, role) {
  let groupMembers = [];
  
  for (let i = 0; i<numMembers && students.length > 0; i++) {
    randomIndex = getRandomInt(0, students.length-1);
    students[randomIndex].roles.add(role);
    groupMembers.push(students.splice(randomIndex, 1)[0]);
  }
  
  addEmbedField(output, embed, role.name, groupMembers);
  return students;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getHigherGroupNum(server) {
  let groups = server.channels.cache.filter(channel => isGroupChannel(channel));

  let aux = 0;

  if (groups != null) {
    let name = "CB Group ";
    let pad = name.length;
    groups.forEach(channel => {
      var num = parseInt(channel.name.substr(pad));
      if (num > aux) aux = num;
    });
  }

  return aux;
}

function isGroupChannel(channel) {
  return (channel.name.startsWith("CB Group"));
}

function isNumeric(num){
  return !isNaN(num)
}

function updateOutput(output, embed, text) {
  embed.setDescription(text);
  output.edit({embeds: [embed]});
}

async function addEmbedField(output, embed, group, members) {
  let stringNames = "";
  if (members != null) {
    members.forEach(member => {
      aux = "\n" + member.toString();
      stringNames += aux;
    })
  }
  
  embed.addField(group, stringNames, true);
  output.edit({embeds: [embed]});
}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Create Group')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Creando grupos...')
  
  return embedMessage;
}
    