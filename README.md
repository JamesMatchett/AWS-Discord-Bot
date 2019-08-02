# AWS-Discord-Bot   <div style="text-align: right">[![codebeat badge](https://codebeat.co/badges/017b9bdd-d5ca-4b4a-a334-ccc6cf8bdb06)](https://codebeat.co/projects/github-com-jamesmatchett-aws-discord-bot-master) </div>

Discord bot used for managing AWS instances including status and toggling on or off via chat commands in a Discord text channel 
Thanks to the writer of this article here for the very useful guide https://www.toptal.com/chatbot/how-to-make-a-discord-bot

## To get started
* Download node and aws-cli onto your machine https://nodejs.org/en/ https://aws.amazon.com/cli/
* Run `aws configure` from command prompt on the machine you wish to host the bot from
* Create a discord application here https://discordapp.com/developers/applications/ and create a bot user under it
* Add the bot account to your discord server
* Create a dedicated role on your discord server as well as a dedicated text channel for the bot
* Gather the required credentials and IDs needed from AWS and Discord mentioned below

In the DiscordBot folder make a Json file called "config.json" and add the following values in this format 
```
{
"BOT_TOKEN": "*Insert your discord bot token here*",
"ROLEID": "*Insert the Discord role ID of a role that only people you want using the bot have*",
"CHANNELID": "*Insert the Discord channel ID of the text channel where you want the bot to be controlled from*",
"ACCESSKEY": "*Insert the AWS generated access key here*",
"SECRETKEY": "*Insert the AWS generated secret key here*",
"SESSIONTOKEN": "*Insert the AWS session token here (may not be needed)*",
"INSTANCE": "*Insert the instance ID of the AWS instance you wish to toggle from the bot*"
"MESSAGELOGGING": "F" (or leave as 'T' if you want specific error messages logged to the Discord channel which may contain sensitive info like keys or instance IDs)
}
```

Command prompt into the DiscordBot folder and run 
```
node src/Bot.js
```
Commands: 
``` 
$aws start (Starts the specified instance)
$aws stop (Stops the specified instance)
$aws status (Returns information about the instance, i.e. if it is running, it's IP, it's last startTime)
```
You, and anyone else you give the role and channel access to, should be able to toggle the selected AWS instance on or off when needed as well as view instance information on demand.
