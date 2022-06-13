const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'sendlinks',
  description: "this command sends the links to the user (private message)",
  async execute(message, db) {
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
      let embed2 = createEmbedMessage();
      embed2.setDescription(`Enlaces de invitación al servidor ${message.guild.name}`);
      embed2.addField("Link para estudiantes", serverDB.studentsInviteId);
      embed2.addField("Link para profesores", serverDB.teachersInviteId);
      message.member.send(({embeds: [embed2]}));

      embed.setDescription("Te hemos enviado los enlaces de invitación del servidor por mensaje privado.");
      output.edit({embeds: [embed]});
    }
  }
}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Start Class')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Enviando links de invitación...')
  
  return embedMessage;
}