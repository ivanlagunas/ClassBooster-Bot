const Discord = require('discord.js');
const fs = require('fs');
const Database = require("@replit/database");
const keepAlive = require("./server");
const Server = require("./interfaces/servers")

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_VOICE_STATES", "GUILD_PRESENCES"]});

const prefix = '.';
const invites = [];
client.commands = new Discord.Collection();
client.events = new Discord.Collection();

///////////////INIT HANDLERS//////////////////////

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);

  client.events.set(event.name, event);
}

////////////////////DATABASE//////////////////////
const db = new Database();

db.get("queue").then(result => {
  if (!result || result.length < 1) {
    db.set("queue", []);
  }
})

db.get("server").then(result => {
  if (!result || result.length < 1) {
    db.set("server", []);
  }
})

/////////////////////EVENTS/////////////////////////

client.on("ready", async() => {
  console.log(`Logged in as ${client.user.tag}!`)

  client.guilds.cache.forEach(async guild =>{
    let guildInvites = await guild.invites.fetch();
    invites[guild.id] = [];
    guildInvites.forEach(inv => {
      invites[guild.id].push({"code": inv.code, "uses": inv.uses});
    });
  });
});

client.on("messageCreate", msg => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  const args = msg.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();


  switch (command) {

    case "startclass":
      client.commands.get('startclass').execute(msg, args, db, invites);
      break;

    case "creategroup":
      client.commands.get('creategroup').execute(msg, args);
      break;

    case "deletegroup":
      client.commands.get('deletegroup').execute(msg, args);
      break;

    case "doubt":
      client.commands.get('doubt').execute(msg, args, db, client);
      break;

    case "queue":
      client.commands.get('queue').execute(msg, args, db);
      break;

    case "deletequeue":
      client.commands.get('deletequeue').execute(msg, args, db);
      break;

    case "help": 
      client.commands.get('help').execute(msg, args);
      break;
      
    case "ping":
      client.commands.get('ping').execute(msg, args);
      break;
      
  }
});

client.on('guildMemberAdd', async member => {
  client.events.get('guildMemberAddHandler').execute(invites, db, member);
  
});

client.on('voiceStateUpdate', (oldMemberVoice, newMemberVoice) => {
  client.events.get('voiceStateHandler').execute(oldMemberVoice, newMemberVoice, db);
});


keepAlive();
client.login(process.env.TOKEN);
