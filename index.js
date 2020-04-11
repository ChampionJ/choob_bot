const tmi = require("tmi.js");
const fs = require('fs');
const settingsPath = "settings.json";
const localdataPath = "localdata.json";
//Grab settings, or create them from Base
let settings;
try {
    if(fs.existsSync(settingsPath)){
        settings = fs.readFileSync(settingsPath);
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

let localdata;
try {
    if(fs.existsSync(localdataPath)){
        localdata = fs.readFileSync(localdataPath);
        localdata = JSON.parse(localdata);
    } else {
        if(fs.existsSync('localdataBase.json')){
            localdata = fs.readFileSync('localdataBase.json');
            localdata = JSON.parse(localdata);
            fs.writeFileSync(localdataPath, JSON.stringify(localdata, null, 4));
            console.log("Error, could not find local settings! Generating new");
        }
        else{
            console.log("Error, could not find local settings!");
        }
    }
} catch(err){
    console.log(err);
}

//create twitch client
const client = new tmi.client(localdata.connectionSettings);
// Register our event handlers
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on("submysterygift", onGiftedSubsHandler);
// Connect to Twitch:
client.connect();
function onGiftedSubsHandler (channel, username, numbOfSubs, methods, userstate){
    if(settings.adminChannels.includes(channel)){
        setTimeout(() => {
            client.say(channel, settings.messages.giftedsubs.replace('{gifter}',username));
            }, numbOfSubs*200+1000);
        //client.say(channel, settings.messages.giftedsubs.replace('{gifter}','@'+username));
    }
    console.log(`There were ${numbOfSubs} gifted in ${channel} by ${username}`);
    //let senderCount = ~~userstate["msg-param-sender-count"];
}
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
            //console.log("command not found");
            return;
        } else {
            //console.log("alias found");
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
            client.say(target, settings.permissionLackingMessage.replace('{name}',context["display-name"]));
            return;
        }
        if(command.requiresAdmin === true){
            if(checkIfAdmin(context, target) === false){
                client.say(target, settings.permissionLackingMessage.replace('{name}',context["display-name"]));
                return;
            }
        }
        if(command.requiresMod === true){
            if(checkIfMod(context, target) === false){
                client.say(target, settings.permissionLackingMessage.replace('{name}',context["display-name"]));
                return;
            }
        }
    }
    switch(commandTriggered){
        case "choob":
            if(localdata.choob.ignoredTwitchChannels.includes(target))
                break;
            let choobIndex = localdata.choob.messages.length;
            let choobQuote = localdata.choob.messages[Math.floor(Math.random() * choobIndex)];
            client.say(target, choobQuote);
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        case "addchoobtochannel": {
            let channelToJoin = messageString.split(" ")[1].toLowerCase();
            let channelstring = "#" + channelToJoin;
            if(localdata.connectionSettings.channels.includes(channelstring)){
                client.say(target, command.existsMessage.replace('{channel}',channelToJoin));
            } else {
                client.join(channelstring)
                .then(()=>{
                    localdata.connectionSettings.channels.push(channelstring);
                    fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e) => {if(e != null)console.log(e);});
                    client.say(target, command.joinMessage.replace('{channel}',channelToJoin));
                })
                .catch(()=>{
                    client.say(target, command.doesntExist.replace('{channel}',channelToJoin));
                });
            }
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        }
        case "removechoobfromchannel": {
            let channelToLeave = messageString.split(" ")[1].toLowerCase();
            const removalChannel = "#" + channelToLeave;
            let removalChannelIndex = localdata.connectionSettings.channels.indexOf(removalChannel);
            if(removalChannelIndex != -1){
                localdata.connectionSettings.channels.splice(removalChannelIndex, 1);
                fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, command.leaveMessage.replace('{channel}',channelToLeave));
                client.part(removalChannel);
            } else {
                client.say(target, command.errorMessage.replace('{channel}',channelToLeave));
            }
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        }
        case "joinchoob": {
            let channelstring = "#" + context.username;
            if(localdata.connectionSettings.channels.includes(channelstring)){
                client.say(target, command.existsMessage);
            } else {
                localdata.connectionSettings.channels.push(channelstring);
                fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, command.joinMessage);
                client.join(channelstring);
            }
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        }
        case "leavechoob": {
            const removalChannel = "#" + context.username;
            let removalChannelIndex = localdata.connectionSettings.channels.indexOf(removalChannel);
            if(removalChannelIndex != -1){
                localdata.connectionSettings.channels.splice(removalChannelIndex, 1);
                fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, command.leaveMessage);
                client.part(removalChannel);
            }
            else {
                client.say(target, command.errorMessage);
            }
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        }
        case "choobchannels":
            let channelCount = localdata.connectionSettings.channels.length;
            client.say(target, command.message.replace('{count}',channelCount));
            console.log(`* Executed ${commandTriggered} command in ${target}`); 
            break;
        case "choobcount":
            let choobCount = localdata.choob.messages.length;
            client.say(target, command.message.replace('{count}',choobCount));
            console.log(`* Executed ${commandTriggered} command in ${target}`); 
            break;
        case "choobhelp":
            client.say(target, command.message);
            console.log(`* Executed ${commandTriggered} command in ${target}`); 
            break;
        case "choobinfo":
            let info = command.message;
            client.say(target, info);
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        case "choobversion":
            client.say(target, command.message);
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        case "togglechoob":
            let exists = localdata.choob.ignoredTwitchChannels.indexOf(target);
            if(exists >= 0){
                localdata.choob.ignoredTwitchChannels.splice(exists, 1);
                client.say(target, command.onMessage);
            } else {
                localdata.choob.ignoredTwitchChannels.push(target);
                client.say(target, command.offMessage);
            }
            fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e) => {if(e != null)console.log(e);});
            console.log(`* Executed ${commandTriggered} command in ${target}`);
            break;
        case "addchoob":
            if(messageString.length < commandTriggeredRAW.length + 2){
                break;
            }
            const choobString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
            for(let msgnum = 0; msgnum < localdata.choob.messages.length; msgnum++){
                if(stringSimilarity(localdata.choob.messages[msgnum], choobString) > 0.8){
                    client.say(target, command.duplicateMsg.replace('{username}',context["display-name"]));
                    console.log(`* Attempted to add duplicate choob quote.\n\"${choobString}\"\nmatched\n"${localdata.choob.messages[msgnum]}\"`);
                    return;
                }
            }
            
            localdata.choob.messages.push(choobString);
            fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e) => {if(e != null)console.log(e);});
            client.say(target, command.message.replace('{msg}',choobString));
            console.log(`* ${context["display-name"]} added:\n\"${choobString}\"\nto the choob list`);
            break;
        case "removechoob":
            if(messageString.length < commandTriggeredRAW.length + 2){
                break;
            }
            const removalString = messageString.substr(commandTriggeredRAW.length + 1); //remove commnad name and first space
            let removalIndex = localdata.choob.messages.indexOf(removalString);
            if(removalIndex != -1){
                localdata.choob.messages.splice(removalIndex, 1);
                fs.writeFile(localdataPath, JSON.stringify(localdata, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, command.message.replace('{msg}',removalString));
                console.log(`* ${context["display-name"]} removed:\n\"${removalString}\"\nfrom the choob list`);
            } else {
                client.say(target, command.messageNoMatch.replace('{username}',context["display-name"]));
                console.log(`* ${context["display-name"]} attempted to remove non-matching choob:\n\"${removalString}\"\nfrom the choob list`);
            }
            break;
        case "updatechoob":
            try {
                localdata = fs.readFileSync(localdataPath);
                localdata = JSON.parse(localdata);
                client.say(target, command.successMessage);
                console.log(`* Executed ${commandTriggered} command in ${target}`);
            }
            catch(err){
                console.log(err);
                client.say(target, command.failMessage);
            }
            break;
        default:
            //console.log(`* Unknown command ${commandTriggered}`);
            break;
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

function stringSimilarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                    costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}