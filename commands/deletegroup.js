const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'deletegroup',
  description: "this command deleted all channels and roles related to class groups created with this app",
  async execute(message, db) {

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

    else if (!message.member.roles.cache.some(role => role.name == "Teachers")) {
      updateOutput(output, embed, "**Error:** Este comando solo puede ser ejecutado por miembros con el rol 'Teachers'.");
    }

    else {
      
      await deleteGroupChannels(message.guild);
  
      embed.setDescription("Grupos borrados con éxito.");
      output.edit({embeds: [embed]});
    }
  }
}

async function deleteGroupChannels(server) {
  let groups = server.channels.cache.filter(channel => isGroupChannel(channel));
  let roles = server.roles.cache.filter(role => isGroupRole(role));

  if (roles != null) {
    await roles.forEach((role) => {
      role.delete();
      console.log("delete role:" + role.name);
    });
  }

  if (groups != null) {
    await groups.forEach((channel) => {
      let childs = channel.children;
      if (childs != null) {
        childs.forEach(channel => {
          channel.delete();
          console.log("delete channel:" + channel.name);
        })
      }
      channel.delete();
      console.log("delete category:" + channel.name);
    });
  }
}

function isGroupChannel(channel) {
  return (channel.name.startsWith("CB Group"));
}

function isGroupRole(role) {
  return (role.name.startsWith("CB Group"));
}

function createEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Delete Groups')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  	.setDescription('Borrando grupos...')
  
  return embedMessage;
}

function updateOutput(output, embed, text) {
  embed.setDescription(text);
  output.edit({embeds: [embed]});
}