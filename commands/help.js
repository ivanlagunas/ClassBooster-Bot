const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'help',
  description: "this command shows a list of all available commands",
  async execute(message, args) {
    let embed = "";
    if (args.length == 1) { //help de un comando
      embed = commandHelp(args[0]);
    }
    else {
      embed = createHelpEmbedMessage();
    }
    let output = await message.channel.send({embeds: [embed]});
  }
}

function createHelpEmbedMessage() {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Help Command')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
    .addField("**Comandos para todos**", ".ping, .help, .queue")
    .addField("**Comandos para profesores**", ".startclass, .creategroup, .deletegroup, .deletequeue")
    .addField("**Comandos para estudiantes**", ".doubt")
    .setFooter({ text: 'Para más información sobre un comando, escribe .help <nombre_comando>', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
  
  
  return embedMessage;
}

function commandHelp(command) {
  let embed = createErrorEmbedMessage(command);
  switch(command) {
      case "startclass":
      embed = createCommandEmbedMessage("startclass", ".startclass [-reboot]", "Permite inicializar el servidor con los canales, roles y links de invitación por defecto.", [{name: "-reboot", info: "Permite volver a ejecutar el comando una vez inicializado el servidor (elimina todos los canales)"}], "Profesores");
      break;

    case "creategroup":
      embed = createCommandEmbedMessage("creategroup", ".creategroup numIntegrants [-n] [-m] [-o]\n.creategroup numGroups (con la opción -n)", "Permite crear grupos de clase con canales asociados.", [{name: "-n", info: "Crear número indicado de grupos"}, {name: "-m", info: "Sin asignación de estudiantes a los grupos"}, {name: "-o", info: "Asignar solo estudiantes conectados"}], "Profesores");
      break;

    case "deletegroup":
      embed = createCommandEmbedMessage("deletegroup", ".deletegroup", 'Borra todos los canales creados mediante el comando "creategroups".', [], "Profesores");
      break;

    case "doubt":
      embed = createCommandEmbedMessage("doubt", ".doubt", 'Permite unirse a la cola de dudas del servidor.', [], "Estudiantes");
      break;

    case "queue":
      embed = createCommandEmbedMessage("queue", ".queue", 'Muestra la cola de dudas del servidor.', [], "Cualquiera");
      break;

    case "deletequeue":
      embed = createCommandEmbedMessage("deletequeue", ".deletequeue", 'Borra la cola de dudas del servidor.', [], "Profesores");
      break;

    case "help": 
      embed = createCommandEmbedMessage("help", ".help [<command_name>]", 'Muestra información de los comandos del servidor.', [{name: "<command_name>", info: 'Muestra información adicional del comando "command_name"'}], "Cualquiera");
      break;
      
    case "ping":
      embed = createCommandEmbedMessage("ping", ".ping", 'El bot responde al usuario con la palabra "pong".', [], "Cualquiera");
      break;
  }
  return embed;
}


function createCommandEmbedMessage(command, usage, description, options, permissions) {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Help - Command "' + command + '"')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
    .setDescription(description)

  embedMessage.addField("**Usage**", usage);

  if (options.length > 0) {
    let optionsString = "";
    options.forEach(option => {
      optionsString += "**" + option.name + ":** " + option.info + "\n";
    })
    embedMessage.addField("**Opciones**", optionsString);
  }

  embedMessage.addField("**Permisos de ejecución**", permissions);
  
  return embedMessage;
}

function createErrorEmbedMessage(command) {

  embedMessage = new MessageEmbed()
  	.setColor('#0099ff')
  	.setTitle('Help Command')
    .setAuthor({ name: 'ClassBooster', iconURL: 'https://i.imgur.com/YKgRxqd.png'})
    .setDescription('El comando "' + command + '" no existe.')
  
  return embedMessage;
}