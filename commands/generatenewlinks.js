const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'generatenewlinks',
  description: "this command generates new invitation links for the server",
  async execute(message, db, invites) {
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    let serverDB;
    
    await db.get("server").then(async servers_db => {
      serverDB = servers_db.find(guild => guild.id == message.guild.id);
    });

    //control errores
    if (serverDB == null || !serverDB.init) {
      embed.setDescription("**Error**: El servidor no está inicializado. Utiliza el comando .startclass para poder inicializarlo. Puedes obtener más información introduciendo el comando .help startclass");
      output.edit({embeds: [embed]});
    }

    else if (!message.member.roles.cache.some(role => role.name == "Teachers")) {
      embed.setDescription("**Error:** Este comando solo puede ser ejecutado por miembros con el rol 'Teachers'.");
      output.edit({embeds: [embed]});
    }

    else {
      let text_channels = message.guild.channels.cache.filter(channel => channel.type == "GUILD_TEXT")

      if (text_channels.size < 2) {
        embed.setDescription("**Error**: No hay canales de texto suficientes para crear los links de invitación. Crea nuevos canales de texto manualmente o vuelve a inicializar el servidor con el comando .startclass (está última opción eliminará todo el contenido del servidor)");
      output.edit({embeds: [embed]});
      }

      else {
        let s_channel = text_channels.at(0);
        let t_channel = text_channels.at(1);
        let old_t_channel = "";
        let old_s_channel = "";
        
        await db.get("server").then(async servers_db => {
          let server_index = servers_db.findIndex(guild => guild.id == message.guild.id);
          if (server_index != null) {
            old_t_channel = servers_db[server_index].teachersInviteId;
            old_s_channel = servers_db[server_index].studentsInviteId;
          }
        });
        
        await deleteOldLinks(message.guild, old_s_channel, old_t_channel);
        let invite_links = await createInvitationLinks(s_channel, t_channel, invites);
        updateServer(db, message.guild, invite_links);

        embed.setDescription(`**Se han eliminado los links de invitación antiguos y se han generado unos nuevos.**\n\nTe hemos enviado los nuevos enlaces de invitación por mensaje privado. Si no has recibido ningún mensaje, prueba con el comando .sendlinks`);
        output.edit({embeds: [embed]});

        let embed2 = createEmbedMessage();
        embed2.setDescription(`Nuevos enlaces de invitación del servidor ${message.guild.name}`);
        embed2.addField("Link para estudiantes", invite_links.s_inv.url);
        embed2.addField("Link para profesores", invite_links.t_inv.url);
        message.member.send(({embeds: [embed2]}));
        console.log(`Students link: ${invite_links.s_inv.url}\nTeachers link: ${invite_links.t_inv.url}`);
      }
    }
  }
}

function updateServer(db, server, invite_links) {
  db.get("server").then(async servers_db => {
    let server_index = servers_db.findIndex(guild => guild.id == server.id);
    if (server_index != null) {
      servers_db[server_index].studentsInviteId = invite_links.s_inv.url;
      servers_db[server_index].teachersInviteId = invite_links.t_inv.url;
      db.set("server", servers_db);
    }
  });
}

async function deleteOldLinks(server, oldStudentsLinkId, oldTeachersLinkId) {
  let guildInvites = await server.invites.fetch();
  if (guildInvites != null) {
    await guildInvites.forEach(invite => {
      if (invite.url == oldStudentsLinkId || invite.url == oldTeachersLinkId) {
        invite.delete();
        console.log(`deleted: ${invite.url}`)
      }
    });
  }
  return;
}


async function createInvitationLinks(s_channel, t_channel, invites) {

  var s_inv, t_inv;
  invites[s_channel.guild.id] = [];

  await s_channel.createInvite({ maxAge: 0, maxUses: 0, unique: true })
    .then(inv => { 
      s_inv = inv;
      invites[s_channel.guild.id].push({"code": inv.code, "uses": inv.uses});
      console.log(`created: ${inv.url}`);
    });

  await t_channel.createInvite({ maxAge: 0, maxUses: 0, unique: true })
    .then(inv => { 
      t_inv = inv;
      invites[t_channel.guild.id].push({"code": inv.code, "uses": inv.uses});
      console.log(`created: ${inv.url}`);
    });

  return {"s_inv": s_inv, "t_inv": t_inv};

}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Generate New Links')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Generando nuevos links de invitación...')
  
  return embedMessage;
}