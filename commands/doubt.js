const Queue = require("../interfaces/queues")
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'doubt',
  description: "this command allows to join to the current doubt queue",
  async execute(message, args, db, client) {
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    updateDoubtQueue(message, db, client, embed, output);
  }
}

async function updateDoubtQueue(message, db, client, embed, output) {
  let server = await client.guilds.fetch(message.guild.id);
  let member = await server.members.fetch(message.member.id);
  let channel = member.voice.channel;
  
  if (channel != null) {
    db.get("queue").then(result => {
      let queue;
      if (result == null) {
        let new_queue = new Queue(message.guild.id);
        new_queue.memberQueue.push({"memberId": member.id, "channelId": channel.id});
        result = [new_queue];
        queue = new_queue.memberQueue;
      }
      else {
        let queueIndex = result.findIndex(queue => queue.serverId == message.guild.id);
        if (queueIndex == -1) {
          let new_queue = new Queue(message.guild.id);
          new_queue.memberQueue.push({"memberId": member.id, "channelId": channel.id});
          result.push(new_queue);
          queue = new_queue.memberQueue;
        }
        else {
          if (!result[queueIndex].memberQueue.some(slot => slot.memberId == member.id)) {
            result[queueIndex].memberQueue.push({"memberId": member.id, "channelId": channel.id});
            queue = result[queueIndex].memberQueue;
          }
          else { //error: ya estas en la cola
            embed.setDescription("Error: Ya estas en la cola.");
            output.edit({embeds: [embed]});
            return;
          }
        }
      }
      db.set("queue", result);
      addQueueEmbed(embed, queue, output);
      embed.setDescription("Te has unido a la cola! Estás en la posición " + queue.length + ".");
      output.edit({embeds: [embed]});
      console.log(result);
    });
  }
  else { //error: no estas en ningun canal de voz
    embed.setDescription("Error: No estás en ningún canal de voz. Únete a un canal de voz y vuelve a intentarlo.");
    output.edit({embeds: [embed]});
    return;
  }
}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Doubt Queue')
  	.setDescription('Intentando unirte a la cola...')
  
  return embedMessage;
}

function addQueueEmbed(embed, queue, output) {
  let stringNames = "";
  if (queue != null) {
    queue.forEach((slot, index) => {
      var position = "**" + (index + 1) + ": **";
      var memberString = "<@" + slot.memberId + ">";
      var channelString = "<#" + slot.channelId + ">";
      aux = "\n" + position + memberString + ", en el canal " +  channelString;
      stringNames += aux;
    })
  }
  
  embed.addField("Cola", stringNames);
  output.edit({embeds: [embed]});
  
}