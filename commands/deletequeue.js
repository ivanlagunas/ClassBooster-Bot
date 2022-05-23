const Queue = require("../interfaces/queues")
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'deletequeue',
  description: "this command deletes the server queue.",
  async execute(message, args, db) {
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    let server = message.guild;

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

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Doubt Queue')
  	.setDescription('Borrando la cola de dudas...')
  
  return embedMessage;
}