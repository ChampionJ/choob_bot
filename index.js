const {
    performance,
    PerformanceObserver
} = require('perf_hooks');
const tmi = require("tmi.js");
const options = require("./options");
const fs = require('fs');

const settingsPath = "settings.json";

let settings;
//check settings
try {
    if(fs.existsSync(settingsPath)){
        settings = fs.readFileSync('settings.json');
        settings = JSON.parse(settings);
    } else {
        settings = makeSettings();
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
    }
} catch(err){
    console.log(err);
}

const webhook = require("webhook-discord");

// Create a client with our options
const client = new tmi.client(settings.connectionSettings);
const _personalAliases = ["durok"];
const _mcdmAliases = ["matt","mcdm"];
const personalAliases = _personalAliases.join("|");
const mcdmAliases = _mcdmAliases.join("|");

let questionsOpen = false;
let listenForMentions = true;
let date = new Date();
let cooldown = 5000;
let lastCommandTime = 0;


// Register our event handlers (defined below)
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
    const commandTriggered = messageString.split(" ")[0].toLowerCase();
    //get the settings for the channel
    //let commandSettingsName = settings.commands.find((command) => command.name == commandTriggered);
    let command = settings.commands.find((command) => command.channels.find((channel) => channel == target.substr(1)) && command.command == commandTriggered);
    if(command === undefined)
    {
        console.log("command settings not found");
        return;
    }
        
    if(command.settings.requiresMod === true){
        if(checkIfMod(context, target) === false){
            client.say(target, "@"+context["display-name"]+" you lack the correct Choob permissions to execute this command!");
            return;
        }
    }
    // If the command is known, let's execute it
    switch (commandTriggered){
        case "choob":
            if(lastCommandTime + cooldown < date.getTime()){
                let i = command.settings.messages.length;
                let s = command.settings.messages[Math.floor(Math.random() * i)];
                client.say(target, s);
                console.log(`* Executed ${commandTriggered} command`);
            }
            break;
        case "choobcount":
            if(lastCommandTime + cooldown < date.getTime()){
                let choobCommand = settings.commands.find((command) => command.command == "choob");
                let i = choobCommand.settings.messages.length;
                client.say(target, "I have " + i + " Choobs!");
                console.log(`* Executed ${commandTriggered} command`);
            }
            break;
        case "togglechoob":
            let choobCommand = settings.commands.find((command) => command.command == "choob");
            let exists = choobCommand.channels.indexOf(target.substr(1));
            if(exists >= 0){
                choobCommand.channels.splice(exists, 1);
                client.say(target, "!Choob has been disabled");
                
            } else {
                choobCommand.channels.push(target.substr(1));
                client.say(target, "!Choob has been enabled");
            }
            fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
            console.log(`* Executed ${commandTriggered} command`);
            break;
        case "addchoob":
            if(messageString.length < commandTriggered.length + 2){
                break;
            }
            const choobString = messageString.substr(commandTriggered.length + 1); //remove commnad name and first space

            let choobc = settings.commands.find((command) => command.command == "choob");
            choobc.settings.messages.push(choobString);
            fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
            client.say(target, "Added Choob: \""+choobString+"\" to the master Choob list!");
            console.log(`* Executed ${commandTriggered} command`);
            break;
        case "removechoob":
            if(messageString.length < commandTriggered.length + 2){
                break;
            }
            const removalString = messageString.substr(commandTriggered.length + 1); //remove commnad name and first space
            let choobCommandInfo = settings.commands.find((command) => command.command == "choob");
            
            let i = choobCommandInfo.settings.messages.indexOf(removalString);
            if(i != -1){
                choobCommandInfo.settings.messages.splice(i, 1);
                fs.writeFile(settingsPath, JSON.stringify(settings, null, 4), (e) => {if(e != null)console.log(e);});
                client.say(target, "Removed Choob: \""+removalString+"\" from the master Choob list!");
                console.log(`* Executed ${commandTriggered} command`);
            }
            break;
        case "updatesettings":
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
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}
function checkIfMod(context, target){
    return context.mod == true || context.username == target.substr(1);
}

function makeChoobSettings(){
    let choobSettings = {
        currentlyListening : true,
        messages : ["Choob!"]
    };
    return choobSettings;
}

function makeCommands(){
    let commands = {
        channel : "",
        choobSettings : null,
        ignoredUsers : []
    };
    commands.choobSettings = makeChoobSettings();
    return commands;
}
function makeSettings(){
    let settings = {
        commands : []
    };
    settings.commands[0] = makeCommands();
    return settings;
}