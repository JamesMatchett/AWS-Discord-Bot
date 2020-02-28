var awsCli = require('aws-cli-js');
var gamedig = require('gamedig');
var Options = awsCli.Options;
var Aws = awsCli.Aws;

const { ACCESSKEY } = require('../config.json');
const { SECRETKEY } = require('../config.json');
const { SESSIONTOKEN } = require('../config.json');
const { INSTANCE } = require('../config.json');
const { MESSAGELOGGING } = require('../config.json');
const { SPOTINSTANCE } = require('../config.json');
var verboseLog = (MESSAGELOGGING === 'T');
const StartCommand = 'ec2 start-instances --instance-ids ' + INSTANCE;
const StopCommand = 'ec2 stop-instances --instance-ids ' + INSTANCE;
const StatusCommand = 'ec2 describe-instances --instance-id ' + INSTANCE;
const StatusSpotInstance = 'ec2 describe-spot-instance-requests --spot-instance-request-ids ' + SPOTINSTANCE;

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

const PREFIX = '$server';
const HelpDocs =
    '\n Help Docs: \n `start`: Starts the server \n `stop`: Stops the server \n `status`: Returns the server status  ';


// Create a Client instance with our bot token.
const bot = new eris.Client(BOT_TOKEN);

// When the bot is connected and ready, log to console.
bot.on('ready', () => {
    console.log('Connected and ready.');
});

// starts instance and fires off query wait for instances
const commandHandlerForCommandName = {};
commandHandlerForCommandName['start'] = async (msg, args) => {
    try {
        state = await returnInstanceState();
        if (state == "stopped") {
            aws.command(StartCommand)
            .then(async function (data) {
                console.warn('data = ', data);
                msg.channel.createMessage(`Starting the server, i will let you know when its ready`);
                message = await queryStart();
                return msg.channel.createMessage(message);
            })
            .catch(function (e) {
                if (verboseLog) {
                    msg.channel.createMessage(`Error starting the server,  ${e}`);
                } else {
                    msg.channel.createMessage(`Error starting the server`);
                }
            });
        } else {
            message = `Server cannot be started as it is in ${state} state`;
            msg.channel.createMessage(message);
        }
        
    } catch (err) {
        msg.channel.createMessage(`Error starting the server`);
        return msg.channel.createMessage(err);
    }
};

commandHandlerForCommandName['stop'] = async (msg, args) => {
    try {
        serverBusy = await playersOnServer();
        if (!serverBusy) { 
            aws.command(StopCommand)
                .then(async function (data) {
                    console.warn('data = ', data);
                    msg.channel.createMessage(`Stopping the server`);
                    stopped = await waitForInstanceStop();
                    if(stopped) {
                        msg.channel.createMessage("Server stopped");
                        return true;
                    } else {
                        msg.channel.createMessage(`Stop timeout, server: ${returnInstanceState} spot: ${returnSpotInstanceState}`);
                        return false;
                    }
                })
                .catch(function (e) {
                    if (verboseLog) {
                        msg.channel.createMessage(`Error stopping the server,  ${e}`);
                    } else {
                        msg.channel.createMessage(`Error stopping the server`);
                    }
                });
        } else {
            msg.channel.createMessage('players still on server, cannot stop.');
            return false;
        }

    } catch (err) {
        msg.channel.createMessage(`Error stopping the server`);
        return msg.channel.createMessage(err);
    }
};

commandHandlerForCommandName['help'] = (msg, args) => {
    return msg.channel.createMessage(HelpDocs);
};

// checks if instance is running and$server proceedes to get status of instance and players in arma server
commandHandlerForCommandName['status'] = (msg, args) => {
    console.warn("Getting server status");
    try {
        aws.command(StatusCommand)
        .then(function (data) {
            return reply = data.object.Reservations[0].Instances[0];
        })
        .then(async function (reply) {
            instanceState = reply.State.Name;
            istanceLaunch = reply.LaunchTime;
            ip = reply.PublicIpAddress;
            var launchTime = new Date(istanceLaunch).toLocaleString("en-US", {timezone: "Australia/Sydney"});

            message = `\`\`\`diff`
            message +=`\nServer Status`
            message += '\n________________________________';

            if (instanceState == 'running') {
                serverStatus = '+ Server: RUNNING';
                armaStatusP = queryServer('arma3', ip, 'status');
                tsStatusP = queryServer('teamspeak3', ip, 'status');
                playersP = queryServer('arma3', ip, 'players');
                let [armaStatus, tsStatus, players] = await Promise.all([armaStatusP, tsStatusP, playersP]);

                message +=`\n${serverStatus}`;
                message +=`\n${armaStatus}`;
                message +=`\n${tsStatus}`;
                message +=`\n  IP Address : ${ip}`;
                message +=`\n  Launch Time : ${launchTime} \n`
                
                if(typeof players != 'undefined') {
                    message +=`\n  Players: ${players.length}`
                    players.forEach(player => {
                        message+=`\n\t\t${player.name}`
                    });
                }

            } else {
                message += `\n- Server: ${instanceState.toUpperCase()}`;
            }

            message += '\n\`\`\`'
            msg.channel.createMessage(message);
        })
        .catch(function (e) {
            if (verboseLog) {
                msg.channel.createMessage(`Error getting status,  ${e}`);
            } else {
                msg.channel.createMessage(`Error getting status`);
            }
            console.warn(e);
        });
    } catch (err) {
	console.warn(err);
        msg.channel.createMessage(`Error getting status`);
        return msg.channel.createMessage(err);
    }
};

// queries game server passed
async function queryServer(serverType, ipAddress, queryType) {
    var queryInstance = new gamedig();
    let result = queryInstance.query({
        type: serverType,
        host: ipAddress
    }).then((state) => {
        if(queryType == 'players') {
            return state.players
        } else if(queryType == 'status') {
            return `+ ${serverType.toUpperCase()} Instance: ONLINE`;
        }
    }).catch((error) => {
        if(queryType=='players') {

        } else if (queryType == 'status') {
            return `- ${serverType.toUpperCase()} Instance: OFFLINE`;
        }
    });
    return result;
}

// waits until aws server is running and then checks arma and ts server
// will wait 15 seconds inbetween tries with a max time of 200 seconds
// sends message when everything has loaded 
async function queryStart() {
    var attempts = 0;
    var serverOnline = false;
    var tsOnline = false;
    var a3Online = false;
    var ipAddress;

    while (attempts < 5 && !serverOnline) {
        data = await aws.command(StatusCommand);
        instance = data.object.Reservations[0].Instances[0];
        if (instance.State.Name == "running") {
            serverOnline = true;
            ipAddress = instance.PublicIpAddress
        } else {
            console.log("server offline sleeping for 15 seconds");
            await sleep(15000);
        }
        attempts++
    }

    console.log(serverOnline);

    attempts = 0;
    while (attempts < 10 && (!a3Online || !tsOnline)) {
        if (!a3Online) {
            reply = await queryServer('arma3', ipAddress, 'status');
            if (reply[0] == '+') {a3Online = true;}
        }
        if(!tsOnline) {
            reply = await queryServer('teamspeak3', ipAddress, 'status');
            if (reply[0] == '+') {tsOnline = true;}
        }

        if(!tsOnline | !a3Online) {
            console.log("Instance offline sleeping for 15 seconds");
            await sleep(20000);
        }
        attempts++;
    }

    message = '```diff';
    if(a3Online && tsOnline && serverOnline) {
        message += '\nServer is Ready';
    } else {
        message +='\nMax wait time reached'
    }

    message += '\n________________________________';
    message += (serverOnline) ? `\n+ Server: ONLINE \n  IP Address: ${ipAddress}` : '\n- Server: OFFLINE';
    message += (a3Online) ? '\n+ ARMA3: ONLINE' : '\n- ARMA3: OFFLINE';
    message += (tsOnline) ? '\n+ Teamspeak: ONLINE' : '\n- Teamspeak: OFFLINE';
    message += '\n```'
    
    return message;
}

async function getInstanceInfo() {
    data = await aws.command(StatusCommand)
    return data.object.Reservations[0].Instances[0];
}

async function returnInstanceState() {
    data = await aws.command(StatusCommand)
    return reply = data.object.Reservations[0].Instances[0].State.Name;
}

async function returnSpotInstanceState() {
    data = await aws.command(StatusSpotInstance);
    return data.object.SpotInstanceRequests[0].State;
}

async function playersOnServer(){
    data = await getInstanceInfo();
    players = queryServer('arma3', data.PublicIpAddress, 'players');
    return (players.length > 0);
}

async function waitForInstanceStop() {
    attempts = 1;
    state = "";
    message = "";
    SPOTINSTANCE == "" ? spotStop = true : spotStop = false;
    instanceStop = false; 
      while (attempts <= 40 && (!spotStop || !instanceStop)) {
        !spotStop && await returnSpotInstanceState() == 'disabled' ? spotStop = true : null;
        !instanceStop && await returnInstanceState() == 'stopped' ? instanceStop = true : null;

        if (!spotStop || !instanceStop) {
            await sleep(15000);
        }

        attempts++
    }

    if (instanceStop && spotStop) {
        return true; 
    } else {
        return false;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Every time a message is sent anywhere the bot is present,
// this event will fire and we will check if the bot was mentioned.
// If it was, the bot will attempt to respond with "Present".
bot.on('messageCreate', async (msg) => {
    const content = msg.content;
    const botWasMentioned = msg.mentions.find(
        mentionedUser => mentionedUser.id === bot.user.id,
    );

    //make sure it's in the right channel
    if (!(msg.channel.id === CHANNELID)) {
        return;
    }

    //if the message is sent by a bot, ignore it
    if (msg.author.bot) {
        return;
    }

    if (!msg.member.roles.includes(ROLEID)) {
        await msg.channel.createMessage(`<  You do not have the required roles`);
        return;
    }

    if (botWasMentioned) {
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
        await msg.channel.createMessage(`Unkown command, try ${PREFIX} help for a list of commands`);
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
