const tmi = require("tmi.js");
const fs = require('fs');
const settingsPath = "settings.json";
//Grab settings, or create them from Base
let settings;
try {
    if(fs.existsSync(settingsPath)){
        settings = fs.readFileSync('settings.json');
        settings = JSON.parse(settings);
    } else {
        if(fs.existsSync('settingsBase.json')){
            settings = fs.readFileSync('settingsBase.json');
            settings = JSON.parse(settings);
            fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
        }
        else{
            console.log("Error, could not find base settings!");
        }
    }
} catch(err){
    console.log(err);
}
//create twitch client
const client = new tmi.client(settings.connectionSettings);
// Register our event handlers
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
    if (self) { return; } // Ignore messages from the bot
    // Remove whitespace from edges of chat message
    let messageString = msg.trim();
    if(messageString[0] != '!'){ //check if they're trying to activate a command
        return;
    }
    messageString = messageString.substr(1);
    const commandTriggeredRAW = messageString.split(" ")[0].toLowerCase().replace(/-/g,"");
    let commandTriggered = commandTriggeredRAW;
    
    let command = settings.commands[commandTriggered];
    if(command === undefined){
        let alias = settings.aliases[commandTriggered];
        if(alias === undefined){
            console.log("command not found");
            return;
        } else {
            console.log("alias found");
            command = settings.commands[alias];
            commandTriggered = alias;
        }
    }
    if(command.choobbotChannelOnly === true){
        if(checkIfChoobbotChannel(target) === false){
            //client.say(target, "@"+context["display-name"]+" you lack the correct Choob permissions to execute this command!");
            return;
        }
    }
    let isUserSuperAdmin = checkIfSuperAdmin(context);
    
    if(!isUserSuperAdmin){
        if(command.requiresSuperAdmin === true){
            client.say(target, "@"+context["display-name"]+" you lack the choob neeeded to execute this command!");
            return;
        }
        if(command.requiresAdmin === true){
            if(checkIfAdmin(context, target) === false){
                client.say(target, "@"+context["display-name"]+" you lack the choob neeeded to execute this command!");
                return;
            }
        }
        if(command.requiresMod === true){
            if(checkIfMod(context, target) === false){
                client.say(target, "@"+context["display-name"]+" you lack the choob neeeded to execute this command!");
                return;
            }
        }
    }
    switch(commandTriggered){
        case "choob":
            if(command.ignoredChannels.includes(target))
                break;
            let choobIndex = command.messages.length;
            let choobQuote = command.messages[Math.floor(Math.random() * choobIndex)];
            client.say(target, choobQuote);
            console.log(`* Executed ${commandTriggered} command`);
            break;
        case "joinchoob": {
            let channelstring = "#" + context.username;
            if(settings.connectionSettings.channels.includes(channelstring)){
                client.say(target, "Choob Bot is already in your channel!");
            } else {
                settings.connectionSettings.channels.push(channelstring);
                fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, "Choob Bot has joined your channel!");
                client.join(channelstring);
            }
            console.log(`* Executed ${commandTriggered} command`);
            break;
        }
        case "leavechoob": {
            const removalChannel = "#" + context.username;
            let removalChannelIndex = settings.connectionSettings.channels.indexOf(removalChannel);
            if(removalChannelIndex != -1){
                settings.connectionSettings.channels.splice(removalChannelIndex, 1);
                fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, "Choob Bot has left your channel...");
                client.part(removalChannel);
                console.log(`* Executed ${commandTriggered} command`);
            }
            break;
        }
        case "choobchannels":
            let channelCount = settings.connectionSettings.channels.length;
            client.say(target, "There are " + channelCount + " members of the Choob Continuum");
            console.log(`* Executed ${commandTriggered} command`); 
            break;
        case "choobcount":
            let choobCount = settings.commands.choob.messages.length;
            client.say(target, "There are " + choobCount + " choobs in the database!");
            console.log(`* Executed ${commandTriggered} command`); 
            break;
        case "choobhelp":
            client.say(target, command.message);
            console.log(`* Executed ${commandTriggered} command`); 
            break;
        case "choobinfo":
            let info = command.message;
            client.say(target, info);
            console.log(`* Executed ${commandTriggered} command`);
            break;
        case "togglechoob":
            let exists = settings.commands.choob.ignoredChannels.indexOf(target);
            if(exists >= 0){
                settings.commands.choob.ignoredChannels.splice(exists, 1);
                client.say(target, "!Choob has been enabled");
            } else {
                settings.commands.choob.ignoredChannels.push(target);
                client.say(target, "!Choob has been disabled");
            }
            fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
            console.log(`* Executed ${commandTriggered} command`);
            break;
        case "addchoob":
            if(messageString.length < commandTriggeredRAW.length + 2){
                break;
            }
            const choobString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
            settings.commands.choob.messages.push(choobString);
            fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
            client.say(target, "Added Choob: \""+choobString+"\" to the master Choob list!");
            console.log(`* Executed ${commandTriggered} command`);
            break;
        case "removechoob":
            if(messageString.length < commandTriggeredRAW.length + 2){
                break;
            }
            const removalString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
            let removalIndex = settings.commands.choob.messages.indexOf(removalString);
            if(removalIndex != -1){
                settings.commands.choob.messages.splice(removalIndex, 1);
                fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, "Removed Choob: \""+removalString+"\" from the master Choob list!");
                console.log(`* Executed ${commandTriggered} command`);
            }
            break;
        case "updatechoob":
            try {
                settings = fs.readFileSync('settings.json');
                settings = JSON.parse(settings);
                client.say(target, "Choobs have been updated!");
                console.log(`* Executed ${commandTriggered} command`);
            }
            catch(err){
                console.log(err);
                client.say(target, "Hmm, seems like a Choob got plugged along the way...");
            }
            break;
        default:
            console.log(`* Unknown command ${commandTriggered}`);
    }
    return;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}
function checkIfMod(context, target){
    return context.mod == true || context.username == target.substr(1);
}
function checkIfAdmin(context, target){
    if(checkIfMod(context, target) === true && settings.adminChannels.includes(target))
        return true;
    return false;
}
function checkIfSuperAdmin(context){
    return settings.superAdmins.includes(context.username);
}
function checkIfChoobbotChannel(target){
    return target === "#choob_bot";
}