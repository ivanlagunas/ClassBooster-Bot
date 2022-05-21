const Discord = require('discord.js');
const fs = require('fs');
const Database = require("@replit/database");
const keepAlive = require("./server");
const Server = require("./interfaces/servers")

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MEMBERS", "GUILD_VOICE_STATES"]});

const prefix = '.';
const invites = [];
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  client.commands.set(command.name, command);
}

////////////////////DATABASE//////////////////////
const db = new Database();
db.empty();

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

////////////////////////////////////////////////////

async function find_invite_by_code(invite_list, code) {
  let invite = "";
  
  await invite_list.forEach (inv => {
    if (inv.code == code) {
        invite = inv;
    }
  });

  return invite;
}

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

client.on('guildMemberAdd', async member => {

    let invites_before_join = invites[member.guild.id];
    let invites_after_join = await member.guild.invites.fetch();

    invites_before_join.forEach(async inv => {
      let aux = await find_invite_by_code(invites_after_join, inv.code);
      if (aux != "") {
        let uses = aux.uses;
        if (inv.uses < uses) {
          console.log("Joined with: " + aux.url);
          inv.uses+=1;
          assignRole(member, aux.channelId);
        }
      }
    });
});

client.on('voiceStateUpdate', (oldMemberVoice, newMemberVoice) => {
  let newUserChannel = newMemberVoice.channel;
  let oldUserChannel = oldMemberVoice.channel;

  if((oldUserChannel == null && newUserChannel != null) || (newUserChannel != null && oldUserChannel != newUserChannel)) { //user joins channel
    let member = newMemberVoice.member;
    if (member.roles.cache.some(role => role.name == "Teachers")) {
      db.get("queue").then(result => {

        if (result != null) {
          let queueIndex = result.findIndex(queue => queue.serverId == member.guild.id);
          
          if (queueIndex != -1 && result[queueIndex].memberQueue[0].channelId == newUserChannel.id) {
            result[queueIndex].memberQueue.splice(0, 1); //eliminamos de la cola
            db.set("queue", result);
          }
        }
      });
    } 
  }
  
  else if(newUserChannel == null) {

    //user leaves a voice channel

  }
});


client.on("debug", ( e ) => console.log(e));


function assignRole(member, inviteId) {
  db.get("server").then(servers_db => {
    let server= servers_db.find(guild => guild.id == member.guild.id);
    if (server.teachersInviteId == inviteId) {
      let teacherRole = member.guild.roles.cache.find(role => role.name == "Teachers");
      if (teacherRole != null) member.roles.add(teacherRole);
    }
    else if (server.studentsInviteId == inviteId) {
      let studentRole = member.guild.roles.cache.find(role => role.name == "Students");
      if (studentRole != null) member.roles.add(studentRole);
    }
  });
}


keepAlive();
client.login(process.env.TOKEN);
