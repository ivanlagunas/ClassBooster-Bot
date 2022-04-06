const Server = require("../servers")

module.exports = {
  name: 'startclass',
  description: "this command initialize the server with the default channels and roles",
  execute(message, args, db) {
    var server = message.guild;
    deleteChannelsRoles(server);
    createChannelsRoles(server, message.member);
  }



    
    /*var aux = new Server(message.guild.name, db);
    db.get("server").then(result => {
    if (!result || result.length < 1) {
      aux.id = 1
      result = [aux];
    }
    else {
      aux.id = result.length + 1;
      result.push(aux);
    }
    db.set("server", result);*/
}

function deleteChannelsRoles(server){
  server.channels.cache.forEach((channel) => {
    channel.delete();
  });

  server.roles.cache.forEach((role) => {
    if (role.name != "@everyone" && role.name != "ClassBooster") role.delete();
  });
}

function createChannelsRoles(server, member){ //create default categories and channels

  //general category
  var generalCategoryId;

  server.channels.create('Clase', {
    type: "GUILD_CATEGORY",
    permissionsOverwrites: [{
      id: server.roles.everyone,
      allow: ['VIEW_CHANNEL'],
      deny: ['SEND MESSAGES']
    }]
  }).then(category => {
      generalCategoryId = category.id;
      console.log;
    })
    .catch(console.error);

  
  server.channels.create("General", {
    type: "text",
  }).then(channel => {
    channel.setParent(generalCategoryId);
  });

  server.channels.create("Dudas", {
    type: "text", //This create a text channel, you can make a voice one too, by changing "text" to "voice"
  }).then(channel => {
    channel.setParent(generalCategoryId);
  });

  
  //teachers category
  var teachersCategoryId;

  server.channels.create('Sala de profesores', {
    type: "GUILD_CATEGORY",
    permissionsOverwrites: [{
      id: server.roles.everyone,
      allow: ['VIEW_CHANNEL'],
      deny: ['SEND MESSAGES']
    }]
  }).then(category => {
      teachersCategoryId = category.id;
      console.log;
    })
    .catch(console.error);

  
  server.channels.create("Chat privado", {
    type: "text",
  }).then(channel => {
    channel.setParent(teachersCategoryId);
  });

  //students category

  var studentsCategoryId;

  server.channels.create('Sala de estudio', {
    type: "GUILD_CATEGORY",
    permissionsOverwrites: [{
      id: server.roles.everyone,
      allow: ['VIEW_CHANNEL'],
      deny: ['SEND MESSAGES']
    }]
  }).then(category => {
      studentsCategoryId = category.id;
      console.log;
    })
    .catch(console.error);

  
  server.channels.create("General alumnos", {
    type: "text",
  }).then(channel => {
    channel.setParent(studentsCategoryId);
  });


  //roles


  server.roles.create({
    name: 'Teachers',
    color: 'BLUE',
    reason: 'role for teachers',
  })
    .then(role => {
      member.roles.add(role);
      console.log})
    .catch(console.error);

  server.roles.create({
    name: 'Students',
    color: 'RED',
    reason: 'role for students',
  })
    .then(console.log)
    .catch(console.error);
}