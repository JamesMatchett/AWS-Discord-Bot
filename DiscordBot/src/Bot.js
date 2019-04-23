var awsCli = require('aws-cli-js');
var Options = awsCli.Options;
var Aws = awsCli.Aws;

const { ACCESSKEY } = require('../config.json');
const { SECRETKEY } = require('../config.json');
const { SESSIONTOKEN } = require('../config.json');
const { INSTANCE } = require('../config.json');
const StartCommand = 'ec2 start-instances --instance-ids ' + INSTANCE
const StopCommand = 'ec2 stop-instances --instance-ids ' + INSTANCE

let options = new Options(
  /* accessKey    */ ACCESSKEY,
  /* secretKey    */ SECRETKEY,
  /* sessionToken */ SESSIONTOKEN,
  /* currentWorkingDirectory */ null
);
 
const aws = new Aws(options);

const eris = require('eris');
const { BOT_TOKEN } = require('../config.json');
const { ROLEID } = require('../config.json');
const { CHANNELID } = require('../config.json');

const PREFIX = '$aws';
const HelpDocs = 
'\n Help Docs: \n `start`: Starts the server \n `stop`: Stops the server \n 

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

  aws.command(StartCommand).then(function (data) {
  console.warn('data = ', data); 
});

  return msg.channel.createMessage(`<@${msg.author.id}> Starting the server`);
};

commandHandlerForCommandName['stop'] = (msg, args) => {
console.warn("Stopping the server");
aws.command(StopCommand).then(function (data) {
  console.warn('data = ', data); 
});
 return msg.channel.createMessage(`<@${msg.author.id}> Stopping and saving the server`);
};

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

//if the message is sent by a bot, ignore it
if(msg.author.bot){
return;
}

if(!msg.member.roles.includes(ROLEID)) {
    await msg.channel.createMessage(`<@${msg.author.id}> You do not have the required roles`);
    return;
}


if(botWasMentioned){
  await msg.channel.createMessage('Brewing the coffee and ready to go!');
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