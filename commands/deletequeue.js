const Queue = require("../interfaces/queues")
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'deletequeue',
  description: "this command deletes the server queue.",
  async execute(message, db) {
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    let server = message.guild;
    let serverDB;
    
    await db.get("server").then(async servers_db => {
      serverDB = servers_db.find(guild => guild.id == message.guild.id);
    });

    if (serverDB == null || !serverDB.init) {
        embed.setDescription("**Error**: El servidor no está inicializado. Utiliza el comando .startclass para poder inicializarlo. Puedes obtener más información introduciendo el comando .help startclass");
      output.edit({embeds: [embed]});
    }
      
    else if (!message.member.roles.cache.some(role => role.name == "Teachers")) {
      embed.setDescription("**Error:** Este comando solo puede ser ejecutado por miembros con el rol 'Teachers'.");
      output.edit({embeds: [embed]});
    }

    else {
      db.get("queue").then(result => {
        if (result == null) {
          embed.setDescription("La cola de dudas está vacía.");
          output.edit({embeds: [embed]});
        }
  
        else {
          let queueIndex = result.findIndex(queue => queue.serverId == server.id);
          if (queueIndex == -1 || result[queueIndex].memberQueue.length <= 0) {
            embed.setDescription("La cola de dudas está vacía.");
            output.edit({embeds: [embed]});
          }
          else {
            result.splice(queueIndex, 1);
            db.set("queue", result);
            embed.setDescription("Cola de dudas borrada con éxito.");
            output.edit({embeds: [embed]});
          }
        }
      });
    }
  }
}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Doubt Queue')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Borrando la cola de dudas...')
  
  return embedMessage;
}