const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'guildMemberAddHandler',
  description: "this file handles the guildMemberAdd event.",
  async execute(invites, db, member) {

    let invites_before_join = invites[member.guild.id];
    let invites_after_join = await member.guild.invites.fetch();
    let serverDB;
    
    await db.get("server").then(async servers_db => {
      serverDB = servers_db.find(guild => guild.id == member.guild.id);
    });

    if (serverDB != null && serverDB.init) {

      invites_before_join.forEach(async inv => {
        let aux = await find_invite_by_code(invites_after_join, inv.code);
        if (aux != "") {
          let uses = aux.uses;
          if (inv.uses < uses) {
            console.log("Joined with: " + aux.url);
            inv.uses+=1;
            assignRole(member, db, aux.url);
          }
        }
      });
    }
  }
}

async function find_invite_by_code(invite_list, code) {
  let invite = "";
  
  await invite_list.forEach (inv => {
    if (inv.code == code) {
        invite = inv;
    }
  });

  return invite;
}

async function assignRole(member, db, inviteId) {
  let channel = member.guild.channels.cache.filter(channel => channel.type == "GUILD_TEXT").at(0);
  let embed = createEmbedMessage(member);
  let output = await channel.send({embeds: [embed]});
  
  db.get("server").then(servers_db => {
    let server= servers_db.find(guild => guild.id == member.guild.id);
    if (server.teachersInviteId == inviteId) {
      let teacherRole = member.guild.roles.cache.find(role => role.name == "Teachers");
      if (teacherRole != null) {
        member.roles.add(teacherRole);
        embed.setDescription(`Hola, ${member.toString()}! Se te ha asignado el rol de ${teacherRole.toString()}.`);
        output.edit({embeds: [embed]});
      }
    }
    else if (server.studentsInviteId == inviteId) {
      let studentRole = member.guild.roles.cache.find(role => role.name == "Students");
      if (studentRole != null) {
        member.roles.add(studentRole);
        embed.setDescription(`Hola, ${member.toString()}! Se te ha asignado el rol de ${studentRole.toString()}.`);
        output.edit({embeds: [embed]});
      }
    }
  });
}

function createEmbedMessage(member) {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle(`Bienvenido a la clase!`)
    .setDescription(`Hola, ${member.toString()}!`)
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  
  return embedMessage;
}