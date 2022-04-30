module.exports = {
  name: 'creategroup',
  description: "this command creates random private class groups, args: .creategroup membersNum(int), assignStudents(bool) // options: -m (no auto-assign members to groups), -n (create n groups, no assignation)",
  execute(message, args) {
    
    //gestión de errores
    if (args.length < 1) message.channel.send("Error: No has indicado el número de integrantes por grupo, ejem: .creategroup 4");
    else {
      if (args.some(arg => arg == "-n")) { //create n groups
        if (args[0] < 1) message.channel.send("Error: El número de grupos ha de ser mayor que 0, ejem: .creategroup 1 -n");
        else if (!isNumeric(args[0])) message.channel.send("Error: No has indicado el número de grupos a crear, ejem: .creategroup 2 -n");
        else {
          let numGroups = args[0];
          createNGroups(message.guild, message, numGroups);
        }
        
      }

      else { //create groups with membersNum members
        if (args[0] < 1) message.channel.send("Error: El número de integrantes ha de ser mayor que 0, ejem: .creategroup 2");
        else if (!isNumeric(args[0])) message.channel.send("Error: No has indicado el número de integrantes por grupo, ejem: .creategroup 4");

        else {

        let numMembers = args[0];
        let autoAssign = true;
        if (args.some(arg => arg == "-m")) autoAssign = false;
        
        createRandomGroups(message.guild, message, numMembers, autoAssign);
        }
      }
    }
  }
}


async function createNGroups(server, message, numGroups) {
  createChannelsRoles(server, numGroups, -1, [], false);
  
}

async function createRandomGroups(server, message, numMembers, autoAssign) {
  let members = await server.members.fetch();
  let students = getStudents(members);
  let numStudents = students.length;
  let numGroups = Math.ceil(numStudents/numMembers);
  //let numGroups = 5;
  
  console.log(numStudents + " " + numGroups);

  if (numGroups <= 0) {
    message.channel.send("Error: No hay usuarios con rol 'Student' en el servidor para poder crear los grupos. Prueba con la opción -n para crear servidores sin asignación");
  }

  else {
    createChannelsRoles(server, numGroups, numMembers, students, autoAssign);
  }
  
}

async function createChannelsRoles(server, numGroups, numMembers, students, autoAssign) {

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
        console.log("create role " + role.name);
        students = assignRoles(numMembers, students, role);
      })
      .catch(console.error);
    }
      
    server.channels.create('CB Group ' + (num + i), {
    type: "GUILD_CATEGORY",
    }).then(category => {
      groupCategoryId = category.id;
      if (autoAssign) {
        category.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false }).catch(err => console.log(err));
        category.permissionOverwrites.create(groupRole, { VIEW_CHANNEL: true });
        category.permissionOverwrites.create(teacherRole, { VIEW_CHANNEL: true });
      }
      console.log("create category " + category.name);
    })
    .catch(console.error);
    
    server.channels.create("CB Chat Grupo " + (num + i), {
    type: "GUILD_TEXT",
    }).then(channel => {
      channel.setParent(groupCategoryId);
      if (autoAssign) {
        channel.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false }).catch(err => console.log(err));
        channel.permissionOverwrites.create(groupRole, { VIEW_CHANNEL: true });
        channel.permissionOverwrites.create(teacherRole, { VIEW_CHANNEL: true });
      }
      console.log("create channel " + channel.name);
    });

    server.channels.create("CB Grupo " + (num + i) + " - Voz", {
    type: "GUILD_VOICE",
    }).then(channel => {
    channel.setParent(groupCategoryId);
      if (autoAssign) {
        channel.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false }).catch(err => console.log(err));
        channel.permissionOverwrites.create(groupRole, { VIEW_CHANNEL: true });
        channel.permissionOverwrites.create(teacherRole, { VIEW_CHANNEL: true });
      }
    console.log("create channel" + channel.name);
    });
  }

}

function getStudents(members) {
  studentMembers = [];
  members.forEach(member => {
    if (member.roles.cache.some(role => role.name == "Students")) studentMembers.push(member);
    })
  return studentMembers;
}

function assignRoles(numMembers, students, role) {
  for (let i = 0; i<numMembers; i++) {
    randomIndex = getRandomInt(0, students.length-1);
    console.log("random int: " +  randomIndex)
    students[randomIndex].roles.add(role);
    students.splice(randomIndex, 1);
  }
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
    groups.forEach(channel => {
      var num = parseInt(channel.name.substr(channel.name.length - 1));
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
    