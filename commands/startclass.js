const Server = require("../interfaces/servers")
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'startclass',
  description: "this command initialize the server with the default channels and roles",
  async execute(message, args, db, invites) {
    let server = message.guild;
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});

    db.get("server").then(async servers_db => {
      let serverDB = servers_db.find(guild => guild.id == server.id);
      if (serverDB != null && args[0] != "-reboot") {
        embed.setDescription("**Warning:** Este comando borrará todos los canales/roles del servidor y creará nuevos enlaces de invitación. Si aún así quieres ejecutar este comando, prueba con la opción '-reboot'. Ejemplo: .startclass -reboot");
        output.edit({embeds: [embed]});
      }
      else {  

        if (message.member.roles.cache.some(role => role.name == "Teachers")) {
          deleteChannels(server, message);
          deleteRoles(server);
      
          embed.setDescription("Creando canales...");
          output.edit({embeds: [embed]});
          
          let channels = await createChannelsRoles(server, message.member);
      
          embed.setDescription("Creando links de invitación...");
          output.edit({embeds: [embed]});
          
          let invite_links = await createInvitationLinks(channels.s_channel, channels.t_channel, invites);
      
          saveServer(db, server, invite_links);
          
          embed.setDescription(`Clase creada con éxito!`);
          embed.addField("Link para estudiantes", invite_links.s_inv.url);
          embed.addField("Link para profesores", invite_links.t_inv.url);
          output.edit({embeds: [embed]});
          console.log(`Students link: ${invite_links.s_inv.url}\nTeachers link: ${invite_links.t_inv.url}`);
        }
        else {
          embed.setDescription("**Error:** Este comando solo puede ser ejecutado por miembros con el rol 'Teachers'.");
          output.edit({embeds: [embed]});
        }
      }
    });
  }
}

function saveServer(db, server, invite_links) {
  let new_server = new Server(server.id, invite_links.s_inv.channelId, invite_links.t_inv.channelId);
  db.get("server").then(servers_db => {
    let server_index= servers_db.findIndex(guild => guild.id == server.id);
    if (server_index != -1) {
      servers_db.splice(server_index, 1);
    }

    servers_db.push(new_server);
    db.set("server", servers_db);
    console.log(servers_db);
  });
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
  }).then(async category => {
      teachersCategoryId = category.id;
      await category.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false })
      await category.permissionOverwrites.create(teacherRole, { VIEW_CHANNEL: true });
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
  }).then(async category => {
      studentsCategoryId = category.id;
      await category.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false })
      await category.permissionOverwrites.create(studentRole, { VIEW_CHANNEL: true });
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

async function createInvitationLinks(s_channel, t_channel, invites) {

  var s_inv, t_inv;
  invites[s_channel.guild.id] = [];

  await s_channel.createInvite({ maxAge: 0, maxUses: 0 })
    .then(inv => { 
      console.log(`${inv.channel.name} Invite Link: ${s_channel.guild.name} ${inv.url}`);
      s_inv = inv;
      invites[s_channel.guild.id].push({"code": inv.code, "uses": inv.uses});
    });

  await t_channel.createInvite({ maxAge: 0, maxUses: 0 })
    .then(inv => { 
      console.log(`${inv.channel.name} Invite Link: ${t_channel.guild.name} ${inv.url}`);
      t_inv = inv;
      invites[t_channel.guild.id].push({"code": inv.code, "uses": inv.uses});
    });

  return {"s_inv": s_inv, "t_inv": t_inv};

}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Start Class')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Inicializando clase...')
  
  return embedMessage;
}
