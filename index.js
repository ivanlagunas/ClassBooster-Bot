const Discord = require('discord.js');
const fs = require('fs');
const Database = require("@replit/database");
const keepAlive = require("./server");
const Server = require("./servers")

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

const prefix = '.';
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.name, command);
}

////////////////////DATABASE//////////////////////
const db = new Database();
const startTestDB = [
  {name: "Ivan", value: 1},
  {name: "Paco", value: 2},
]

db.get("test").then(result => {
  if (!result || result.length < 1) {
    db.set("test", startTestDB);
  }
})

//////////////////////////////////////////////////

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
});

client.on("messageCreate", msg => {
  if (!msg.content.startsWith(prefix) || msg.author.bot) return;

  const args = msg.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();


  switch (command) {

    case "startclass":
      client.commands.get('startclass').execute(msg, args, db);
      break;
      
    case "ping":
      client.commands.get('ping').execute(msg, args);
      break;

    case "adddb":
      client.commands.get('addDB').execute(msg, args, db);
      break;

    case "deletedb":
      client.commands.get('deleteDB').execute(msg, args, db);
      break;
      
  }
});


keepAlive();
client.login(process.env.TOKEN);
