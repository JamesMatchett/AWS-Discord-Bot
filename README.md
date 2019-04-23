# AWS-Discord-Bot
Discord bot used for toggling AWS instances on or off via chat commands in a Discord text channel

## To get started
* Download node and aws-cli onto your machine
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
"MESSAGELOGGING": "F" (or leave as 'T' if you want specific error messages logged to the Discord channel which may contain sensitive info                       like keys or instance IDs)
}
```

Command prompt into the DiscordBot folder and run 
```
node src/Bot.js
```
You can change the prefix if you'd like but hopefully by typing: 
``` 
$aws start
$aws stop
```
You, and anyone else you give the role and channel access to, should be able to toggle the selected AWS instance on or off when needed.
