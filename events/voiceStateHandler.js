const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'voiceStateHandler',
  description: "this file handles the voiceStateChange event.",
  execute(oldMemberVoice, newMemberVoice, db) {
    let newUserChannel = newMemberVoice.channel;
    let oldUserChannel = oldMemberVoice.channel;
    let member = newMemberVoice.member;
  
    if((member.roles.cache.some(role => role.name == "Teachers")) && ((oldUserChannel == null && newUserChannel != null) || (newUserChannel != null && oldUserChannel != newUserChannel))) { //user joins/changes channel
      db.get("queue").then(result => {
        if (result != null) {
          let queueIndex = result.findIndex(queue => queue.serverId == member.guild.id);
          
          if (queueIndex != -1 && result[queueIndex].memberQueue[0].channelId == newUserChannel.id) {
            result[queueIndex].memberQueue.splice(0, 1); //eliminamos de la cola
            db.set("queue", result);
            sendNextQueueMember(member, result[queueIndex].memberQueue);
          }
        }
      });
    }
    
    else if(member.roles.cache.some(role => role.name == "Students") && (newUserChannel != oldUserChannel)) { //cuando un estudiante sale/cambia de canal
      db.get("queue").then(result => {
        if (result != null) {
          let queueIndex = result.findIndex(queue => queue.serverId == member.guild.id);
          if (queueIndex != -1) {
            let slotIndex = result[queueIndex].memberQueue.findIndex(slot => slot.memberId == member.id);
            if (slotIndex != -1) { //si está en la cola, lo eliminamos
              result[queueIndex].memberQueue.splice(slotIndex, 1);
              db.set("queue", result);
            }
          }
        }
      });
    }
  }
}

async function sendNextQueueMember(teacher, serverQueue) {
  let embed = null;
  if (serverQueue.length <= 0) {
    embed = createEmbedMessage(teacher.guild.name, "No hay más estudiantes en la cola.");
  }
  else {
    let studentString = "<@" + serverQueue[0].memberId + ">";
    let channelString = "<#" + serverQueue[0].channelId + ">";
    embed = createEmbedMessage(teacher.guild.name, "Siguiente estudiante en la cola: " + studentString + ", en el canal de voz: " + channelString);
  }

  let members = await teacher.guild.members.fetch();
  let teachers = getOnlineTeachers(members);

  teachers.forEach(teacher => {
    teacher.send({embeds: [embed]})
  });
  
}

function createEmbedMessage(serverName, description) {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle(serverName + " - Doubt Queue")
  	.setDescription(description)
  
  return embedMessage;
}

function getOnlineTeachers(members) {

  teachers = members.filter(member => member.presence?.status === "online" && member.roles.cache.some(role => role.name == "Teachers"));
  return teachers;
  
}
