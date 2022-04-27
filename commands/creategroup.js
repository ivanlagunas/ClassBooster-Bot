module.exports = {
  name: 'creategroup',
  description: "this command creates class groups, args: .creategroup membersNum(int), assignStudents(bool)",
  execute(message, args) {
    
    //gestión de errores
    if (args.length < 1) message.channel.send("Error: No has indicado el número de integrantes por grupo, ejem: .creategroup 4");
    else if (args[0] < 1) message.channel.send("Error: El número de integrantes ha de ser mayor que 0, ejem: .creategroup 2");
    else if (!isNumeric(args[0])) message.channel.send("Error: No has indicado el número de integrantes por grupo, ejem: .creategroup 4");

    let numMembers = args[0];
    createGroups(message.guild, numMembers);
  }
    
}

async function createGroups(server, numMembers) {
  let members = await server.members.fetch();
  let students = getStudents(members);
  let numStudents = students.length;
  let numGroups = Math.ceil(numStudents/numMembers);
  //let numGroups = 5;
  
  console.log(numStudents + " " + numGroups);

  createChannelsRoles(server, numGroups, numMembers, students);
  
  
  
}

async function createChannelsRoles(server, numGroups, numMembers, students) {

  let createdChannels = [];

  for (let i = 0; i< numGroups; i++) {
    let groupCategoryId = 0;
    let groupRole = "";

    await server.roles.create({
    name: 'Group ' + i,
    color: 'GREEN',
    reason: 'role for group ' + i,
  })
    .then(role => {
      groupRole = role;
      console.log("create role " + role.name);
      students = assignRoles(numMembers, students, role);
    })
    .catch(console.error);
    
    server.channels.create('Grupo ' + i, {
    type: "GUILD_CATEGORY",
    }).then(category => {
      groupCategoryId = category.id;
      category.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false });
      category.permissionOverwrites.create(groupRole, { VIEW_CHANNEL: true });
      console.log("create category " + category.name);
    })
    .catch(console.error);
    
    server.channels.create("Chat Grupo " + i, {
    type: "GUILD_TEXT",
    }).then(channel => {
      channel.setParent(groupCategoryId);
      channel.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false });
      channel.permissionOverwrites.create(groupRole, { VIEW_CHANNEL: true });
      console.log("create channel " + channel.name);
    });

    server.channels.create("Grupo " + i + " - Voz", {
    type: "GUILD_VOICE",
    }).then(channel => {
    channel.setParent(groupCategoryId);
      channel.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false });
      channel.permissionOverwrites.create(groupRole, { VIEW_CHANNEL: true });
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
    students[randomIndex].roles.add(role);
    students = students.splice(randomIndex, 1);
  }
  return students;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



function isNumeric(num){
  return !isNaN(num)
}
    