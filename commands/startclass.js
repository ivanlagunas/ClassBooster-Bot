const Server = require("../servers")
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'startclass',
  description: "this command initialize the server with the default channels and roles",
  async execute(message, args, db) {
    let server = message.guild;
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    
    deleteChannels(server, message);
    deleteRoles(server);

    embed.setDescription("Creando canales...");
    output.edit({embeds: [embed]});
    
    let channels = await createChannelsRoles(server, message.member);

    embed.setDescription("Creando links de invitación...");
    output.edit({embeds: [embed]});
    
    let invite_links = await createInvitationLinks(channels.s_channel, channels.t_channel);

    embed.setDescription(`Clase creada con éxito!`);
    embed.addField("Link para estudiantes", invite_links.s_url);
    embed.addField("Link para profesores", invite_links.t_url);
    output.edit({embeds: [embed]});
    console.log(`Students link: ${invite_links.s_url}\nTeachers link: ${invite_links.t_url}`);
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

function deleteChannels(server, message){
  server.channels.cache.forEach((channel) => {
      if (channel.id != message.channel.id) {
        console.log("delete channel:" + channel.name);
        channel.delete();
      }
  });
}

function deleteRoles(server) {
  server.roles.cache.forEach((role) => {
    if (role.name != "@everyone" && role.name != "ClassBooster") {
      role.delete();
      console.log("delete role:" + role.name);
    }
  });
}

async function createChannelsRoles(server, member){ //create default categories and channels

  //roles
  var studentRole, teacherRole;
  var studentMainChannel, teacherMainChannel;

  await server.roles.create({
    name: 'Teachers',
    color: 'BLUE',
    reason: 'role for teachers',
  })
    .then(role => {
      member.roles.add(role);
      teacherRole = role;
      console.log("create role" + role.name);})
    .catch(console.error);

  await server.roles.create({
    name: 'Students',
    color: 'RED',
    reason: 'role for students',
  })
    .then(role => {
      studentRole = role;
      console.log("create role" + role.name);})
    .catch(console.error);


  //general category
  var generalCategoryId;

  await server.channels.create('Clase', {
    type: "GUILD_CATEGORY",
  }).then(category => {
      generalCategoryId = category.id;
      console.log("create category" + category.name);
    })
    .catch(console.error);

  
  await server.channels.create("Chat General", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(generalCategoryId);
    console.log("create channel" + channel.name);
  });

  await server.channels.create("Dudas", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(generalCategoryId);
    console.log("create channel" + channel.name);
  });

  await server.channels.create("Aula General", {
    type: "GUILD_VOICE",
  }).then(channel => {
    channel.setParent(generalCategoryId);
    console.log("create channel" + channel.name);
  });

  
  //teachers category
  var teachersCategoryId;

  await server.channels.create('Sala de profesores', {
    type: "GUILD_CATEGORY",
  }).then(category => {
      teachersCategoryId = category.id;
      category.permissionOverwrites.create(studentRole, { VIEW_CHANNEL: false });
      console.log("create category" + category.name);
    })
    .catch(console.error);

  
  done = await server.channels.create("Chat Profesores", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(teachersCategoryId);
    teacherMainChannel = channel;
    console.log("create channel" + channel.name);
  });

  done = await server.channels.create("Profesores - Voz", {
    type: "GUILD_VOICE",
  }).then(channel => {
    channel.setParent(teachersCategoryId);
    console.log("create channel" + channel.name);
  });

  //students category

  var studentsCategoryId;

  await server.channels.create('Sala de estudio', {
    type: "GUILD_CATEGORY",
  }).then(category => {
      studentsCategoryId = category.id;
      category.permissionOverwrites.create(teacherRole, { VIEW_CHANNEL: false });
      console.log("create category" + category.name);
    })
    .catch(console.error);

  
  await server.channels.create("Chat Alumnos", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(studentsCategoryId);
    studentMainChannel = channel;
    console.log("create channel" + channel.name);
  });

  await server.channels.create("Alumnos - Voz", {
    type: "GUILD_VOICE",
  }).then(channel => {
    channel.setParent(studentsCategoryId);
    console.log("create channel" + channel.name);
  });

  return {"s_channel": studentMainChannel, "t_channel": teacherMainChannel};

}

async function createInvitationLinks(s_channel, t_channel) {

  var s_url, t_url;

  await s_channel.createInvite({ maxAge: 0, maxUses: 0 })
    .then(inv => { 
      console.log(`${inv.channel.name} Invite Link: ${s_channel.guild.name} ${inv.url}`);
      s_url = inv.url;
    });

  await t_channel.createInvite({ maxAge: 0, maxUses: 0 })
    .then(inv => { 
      console.log(`${inv.channel.name} Invite Link: ${t_channel.guild.name} ${inv.url}`);
      t_url = inv.url;            
    });

  return {"s_url": s_url, "t_url": t_url};

}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Start Class')
  	.setDescription('Inicializando clase...')
  
  return embedMessage;
}
