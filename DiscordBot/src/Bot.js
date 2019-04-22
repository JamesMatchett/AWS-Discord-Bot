var awsCli = require('aws-cli-js');
var Options = awsCli.Options;
var Aws = awsCli.Aws;

const { ACCESSKEY } = require('../config.json');
const { SECRETKEY } = require('../config.json');
const { SESSIONTOKEN } = require('../config.json');

let options = new Options(
  /* accessKey    */ ACCESSKEY,
  /* secretKey    */ SECRETKEY,
  /* sessionToken */ SESSIONTOKEN,
  /* currentWorkingDirectory */ null
);
 
var aws = new Aws(options);

const eris = require('eris');
const { BOT_TOKEN } = require('../config.json');
const { ROLEID } = require('../config.json');
const { CHANNELID } = require('../config.json');

const PREFIX = '$aws';
const HelpDocs = 
'\n Help Docs: \n `start`: Starts the tekkit server \n `stop`: Stops the tekkit server \n `status`: Displays server and bot status \n `list`: Lists players currently on the server \n `save`: Forces a backup to be saved, useful if server is unstable \n `help`: Displays help docs \n For any further help, ask <@193482978586918913>';

// Create a Client instance with our bot token.
const bot = new eris.Client(BOT_TOKEN);

// When the bot is connected and ready, log to console.
bot.on('ready', () => {
  console.log('Connected and ready.');
});

const commandHandlerForCommandName = {};
commandHandlerForCommandName['start'] = (msg, args) => {
  const mention = args[0];
  console.warn("Starting the server");
  return msg.channel.createMessage(`<@${msg.author.id}> starting the server`);
};

commandHandlerForCommandName['stop'] = (msg, args) => {
console.warn("Stopping the server");
return msg.channel.createMessage('Stopping the server and saving the world'); };

commandHandlerForCommandName['uwu'] = (msg, args) => {
return msg.channel.createMessage('https://giphy.com/gifs/adorable-3-owo-D8nU1wFQ62aZ2'); };

commandHandlerForCommandName['help'] = (msg, args) => {
return msg.channel.createMessage(HelpDocs); };

// Every time a message is sent anywhere the bot is present,
// this event will fire and we will check if the bot was mentioned.
// If it was, the bot will attempt to respond with "Present".
bot.on('messageCreate', async (msg) => {
 const content = msg.content;
  const botWasMentioned = msg.mentions.find(
    mentionedUser => mentionedUser.id === bot.user.id,
  );

//make sure it's in the right channel
if(!(msg.channel.id === CHANNELID)){
return;
}

if(msg.author.bot){
return;
}

if(!msg.member.roles.includes(ROLEID)) {
    await msg.channel.createMessage(`<@${msg.author.id}> You do not have the required roles`);
    return;
}


if(botWasMentioned){
  await msg.channel.createMessage('Brewing the coffee');
}

//ignore dms, guild messages only
if (!msg.channel.guild) {
    console.warn('Received a dm, ignoring');
    return;
  }

  // Ignore any message that doesn't start with the correct prefix.
  if (!content.startsWith(PREFIX)) {
      return;
  }
// Extract the parts of the command and the command name
  const commandName = content.split(PREFIX)[1].trim();

  // Get the appropriate handler for the command, if there is one.
  const commandHandler = commandHandlerForCommandName[commandName];
  if (!commandHandler) {
	await msg.channel.createMessage('Unkown command, try `$aws help` for a list of commands');
      return;
  }

  // Separate the command arguments from the command prefix and command name.

  try {
      // Execute the command.
      await commandHandler(msg, commandName);
  } catch (err) {
      console.warn('Error handling command');
      console.warn(err);
  }
});

bot.on('error', err => {
  console.warn(err);
});

bot.connect();