const Queue = require("../interfaces/queues")
const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'doubt',
  description: "this command allows to join to the current doubt queue",
  async execute(message, db, client) {
    let embed = createEmbedMessage();
    let output = await message.channel.send({embeds: [embed]});
    let serverDB;
    
    await db.get("server").then(async servers_db => {
      serverDB = servers_db.find(guild => guild.id == message.guild.id);
    });

    if (serverDB == null || !serverDB.init) {
        embed.setDescription("**Error**: El servidor no está inicializado. Utiliza el comando .startclass para poder inicializarlo. Puedes obtener más información introduciendo el comando .help startclass");
      output.edit({embeds: [embed]});
    }
    
    else if (!message.member.roles.cache.some(role => role.name == "Students")) {
      embed.setDescription("**Error:** Este comando solo puede ser ejecutado por miembros con el rol 'Students'.");
      output.edit({embeds: [embed]});
    }
    else {
      updateDoubtQueue(message, db, client, embed, output);
    }
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
        sendNextQueueMember(member, channel);
      }
      else {
        let queueIndex = result.findIndex(queue => queue.serverId == message.guild.id);
        if (queueIndex == -1) {
          let new_queue = new Queue(message.guild.id);
          new_queue.memberQueue.push({"memberId": member.id, "channelId": channel.id});
          result.push(new_queue);
          queue = new_queue.memberQueue;
          sendNextQueueMember(member, channel);
        }
        else {
          if (!result[queueIndex].memberQueue.some(slot => slot.memberId == member.id)) {
            result[queueIndex].memberQueue.push({"memberId": member.id, "channelId": channel.id});
            queue = result[queueIndex].memberQueue;
            if (result[queueIndex].memberQueue.length == 1) {
              sendNextQueueMember(member, channel);
            }
          }
          else {
            embed.setDescription("**Error:** Ya estás en la cola.");
            output.edit({embeds: [embed]});
            return;
          }
        }
      }
      db.set("queue", result);
      embed.setDescription("**Te has unido a la cola! Estás en la posición " + queue.length + ".**\n\nSi abandonas el canal de voz actual, se te eliminará de la cola.");
      output.edit({embeds: [embed]});
    });
  }
  else { //**Error:** no estas en ningun canal de voz
    embed.setDescription("**Error:** No estás en ningún canal de voz. Únete a un canal de voz y vuelve a intentarlo.");
    output.edit({embeds: [embed]});
    return;
  }
}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Doubt Queue')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Intentando unirte a la cola...')
  
  return embedMessage;
}

async function sendNextQueueMember(member, channel) {
  let studentString = member.toString();
  let channelString = channel.toString();
  let embed = createDMEmbedMessage(member.guild.name, "Se ha iniciado una cola de dudas, el primer estudiante en la cola es: " + studentString + ", en el canal de voz: " + channelString);

  let members = await member.guild.members.fetch();
  let teachers = getOnlineTeachers(members);

  teachers.forEach(teacher => {
    teacher.send({embeds: [embed]})
  })
}

function createDMEmbedMessage(serverName, description) {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle(serverName + " - Doubt Queue")
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription(description)
  
  return embedMessage;
}

function getOnlineTeachers(members) {
  let validStatus = ["online", "idle"];
  teachers = members.filter(member => validStatus.includes(member.presence?.status) && member.roles.cache.some(role => role.name == "Teachers"));
  return teachers;
  
}