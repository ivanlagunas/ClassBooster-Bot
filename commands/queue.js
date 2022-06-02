const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'queue',
  description: "allows to see the server doubt queue.",
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
          addQueueEmbed(embed, result[queueIndex].memberQueue, output);
        }
      }
        
    });
  }
}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Doubt Queue')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Cargando cola de dudas...')
  
  return embedMessage;
}


function addQueueEmbed(embed, queue, output) {
  let stringNames = "";
  if (queue != null) {
    queue.forEach((slot, index) => {
      var position = "**" + (index + 1) + "**";
      var memberString = "<@" + slot.memberId + ">";
      var channelString = "<#" + slot.channelId + ">";
      aux = "\n" + position + ": " + memberString + ", en el canal " +  channelString;
      stringNames += aux;
    })
  }
  
  embed.setDescription("Esta es la cola de dudas del servidor:");
  embed.addField("Cola", stringNames);
  output.edit({embeds: [embed]});
  
}