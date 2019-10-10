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
const client = new tmi.client(options);
const _personalAliases = ["durok"];
const _mcdmAliases = ["matt","mcdm"];
const personalAliases = _personalAliases.join("|");
const mcdmAliases = _mcdmAliases.join("|");

let questionsOpen = false;
let listenForMentions = true;
let date = new Date();
let cooldown = 500;
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
    const commandTriggered = messageString.split(" ")[0];
    //get the settings for the command
    let commandsettings = settings.commands.find((commandsSettings, index) => commandsSettings.channel == target.substr(1));
    if(commandsettings === undefined)
        return;
    // If the command is known, let's execute it
    switch (commandTriggered){
        case "choob":
            if(lastCommandTime + cooldown < date.getTime()){
                let i = commandsettings.choobSettings.messages.length;
                let s = commandsettings.choobSettings.messages[Math.floor(Math.random() * i)];
                client.say(target, s);
                console.log(`* Executed ${commandTriggered} command`);
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