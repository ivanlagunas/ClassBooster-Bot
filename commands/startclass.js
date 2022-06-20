const Server = require("../interfaces/servers")
const { MessageEmbed } = require('discord.js');
const { Permissions } = require('discord.js');

module.exports = {
  name: 'startclass',
  description: "this command initialize the server with the default channels and roles",
  async execute(message, args, db, invites) {
    let server = message.guild;
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    let init = false;

    await db.get("server").then(async servers_db => {
      let serverDB = servers_db.find(guild => guild.id == server.id);
      init = (serverDB != null);
      if (serverDB != null && args[0] != "-reboot") {
        embed.setDescription("**Warning:** Este comando borrará todos los canales/roles del servidor y creará nuevos enlaces de invitación. Si aún así quieres ejecutar este comando, prueba con la opción '-reboot'. Ejemplo: .startclass -reboot");
        output.edit({embeds: [embed]});
      }
      else {  

        if (!init || message.member.roles.cache.some(role => role.name == "Teachers")) {
          deleteChannels(server, message);
          deleteRoles(server);
      
          embed.setDescription("Creando canales...");
          output.edit({embeds: [embed]});
          
          let channels = await createChannelsRoles(server, message.member);
      
          embed.setDescription("Creando links de invitación...");
          output.edit({embeds: [embed]});
          
          let invite_links = await createInvitationLinks(channels.s_channel, channels.t_channel, invites);
      
          saveServer(db, server, invite_links);
          
          embed.setDescription(`**Clase creada con éxito!**\n\nSe han enviado los enlaces de invitación para profesores y alumnos por mensaje privado. Si no te aparecen, ejecuta el comando .sendlinks.`);
          embed.setFooter({ text: "Si modificas los roles 'Students' o 'Teachers' puede que algunos comandos y funciones dejen de funcionar.", iconURL: 'https://i.imgur.com/MtCtrcK.png'})
          output.edit({embeds: [embed]});
          
          let embed2 = createEmbedMessage();
          embed2.setDescription(`Enlaces de invitación del servidor ${server.name}`);
          embed2.addField("Link para estudiantes", invite_links.s_inv.url);
          embed2.addField("Link para profesores", invite_links.t_inv.url);
          message.member.send(({embeds: [embed2]}));
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
  let new_server = new Server(server.id, invite_links.s_inv.url, invite_links.t_inv.url);
  db.get("server").then(servers_db => {
    let server_index= servers_db.findIndex(guild => guild.id == server.id);
    if (server_index != -1) {
      servers_db.splice(server_index, 1);
    }
    servers_db.push(new_server);
    db.set("server", servers_db);
  });
}

function deleteChannels(server, message){
  server.channels.cache.forEach((channel) => {
      if (channel.id != message.channel.id) {
        channel.delete();
      }
  });
}

function deleteRoles(server) {
  server.roles.cache.forEach((role) => {
    if (role.name != "@everyone" && role.name != "ClassBooster") {
      role.delete();
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
    hoist: true,
    permissions: [Permissions.FLAGS.MANAGE_CHANNELS, Permissions.FLAGS.MANAGE_GUILD, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.MUTE_MEMBERS, Permissions.FLAGS.DEAFEN_MEMBERS, Permissions.FLAGS.MANAGE_NICKNAMES, Permissions.FLAGS.MANAGE_ROLES, Permissions.FLAGS.MANAGE_EVENTS, Permissions.FLAGS.MODERATE_MEMBERS],
    reason: 'role for teachers',
  })
    .then(role => {
      member.roles.add(role);
      teacherRole = role;
    })
    .catch(console.error);

  await server.roles.create({
    name: 'Students',
    color: 'RED',
    hoist: true,
    reason: 'role for students',
  })
    .then(role => {
      studentRole = role;
    })
    .catch(console.error);


  //general category
  var generalCategoryId;

  await server.channels.create('📝 - Clase', {
    type: "GUILD_CATEGORY",
  }).then(category => {
      generalCategoryId = category.id;
    })
    .catch(console.error);

  
  await server.channels.create("Chat General", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(generalCategoryId);
  });

  await server.channels.create("Dudas", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(generalCategoryId);
  });

  await server.channels.create("Aula General", {
    type: "GUILD_VOICE",
  }).then(channel => {
    channel.setParent(generalCategoryId);
  });

  
  //teachers category
  var teachersCategoryId;

  await server.channels.create('📏 - Sala de profesores', {
    type: "GUILD_CATEGORY",
  }).then(async category => {
      teachersCategoryId = category.id;
      await category.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false })
      await category.permissionOverwrites.create(teacherRole, { VIEW_CHANNEL: true });
    })
    .catch(console.error);

  
  done = await server.channels.create("Chat Profesores", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(teachersCategoryId);
    teacherMainChannel = channel;
  });

  done = await server.channels.create("Profesores - Voz", {
    type: "GUILD_VOICE",
  }).then(channel => {
    channel.setParent(teachersCategoryId);
  });

  //students category

  var studentsCategoryId;

  await server.channels.create('📖 - Sala de estudio', {
    type: "GUILD_CATEGORY",
  }).then(async category => {
      studentsCategoryId = category.id;
      await category.permissionOverwrites.create(server.roles.everyone, { VIEW_CHANNEL: false })
      await category.permissionOverwrites.create(studentRole, { VIEW_CHANNEL: true });
    })
    .catch(console.error);

  
  await server.channels.create("Chat Alumnos", {
    type: "GUILD_TEXT",
  }).then(channel => {
    channel.setParent(studentsCategoryId);
    studentMainChannel = channel;
  });

  await server.channels.create("Alumnos - Voz", {
    type: "GUILD_VOICE",
  }).then(channel => {
    channel.setParent(studentsCategoryId);
  });

  return {"s_channel": studentMainChannel, "t_channel": teacherMainChannel};

}

async function createInvitationLinks(s_channel, t_channel, invites) {

  var s_inv, t_inv;
  invites[s_channel.guild.id] = [];

  await s_channel.createInvite({ maxAge: 0, maxUses: 0, unique: true })
    .then(inv => { 
      s_inv = inv;
      invites[s_channel.guild.id].push({"code": inv.code, "uses": inv.uses});
    });

  await t_channel.createInvite({ maxAge: 0, maxUses: 0, unique: true })
    .then(inv => { 
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
