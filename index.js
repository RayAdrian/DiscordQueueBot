const Discord = require('discord.js');
const bot = new Discord.Client();
// const GAME_TAG = '<@&547735369475555329>';  //Main server

const R6_TAG = '<@&673399090012225555>';
const CS_TAG = '<@&673398998996090880>';
const DOTA_TAG = '<@&673399033771065374>';
const LOL_TAG = '<@&673398895195193344>';

const gameList = ['cs', 'lol', 'dota', 'r6'];

const RESET = 5;
const MSG_TIME_DEL = 3000;
const MSG_TIME_FULL_DEL = 7000;
const CHANNEL_ID = process.env.CHANNEL_ID; //Pro-Gaming Channel
// const CHANNEL_ID = '673393759626592273';   //Test server

const PREFIX = '.';

var remaining = {
    cs: RESET,
    lol: RESET,
    dota: RESET,
    r6: RESET
};

var players = {
    cs: [],
    lol: [],
    dota: [],
    r6: []
};

var lineup = {
    cs: [],
    lol: [],
    dota: [],
    r6: []
};

var full = {
    cs: false,
    lol: false,
    dota: false,
    r6: false
}

var gameTag = {
    cs: CS_TAG,
    lol: LOL_TAG,
    dota: DOTA_TAG,
    r6: R6_TAG
}

bot.on('ready', () => {
    console.log('Bot is online');
    bot.user.setActivity("In development");
});

bot.on('message' ,msg=>{
    if (msg.author == bot.user) { // Prevent bot from responding to its own messages
        return
    }


    if (msg.content.startsWith(PREFIX)) {
        mention = msg.mentions.members.first();
        if(mention == null)
            processCommand(msg,mention);
        else{
            //mention = msg.mentions.members.first().toString();
            mentionList = msg.mentions.members.array().toString().split(',');
            mentionSize = msg.mentions.members.size.toString();
            for(var i = 0; i < mentionSize; i++){
                if(mentionList[i].indexOf('!') >= 0){       //
                    mentionList[i] = mentionList[i].slice(0, 2) + mentionList[i].slice(3);
                }
            }
            processCommand(msg,mentionList,mentionSize);
        }

    }
   
});

function getGameTag(game) {
    switch(game){
        case 'cs': 
            return CS_TAG;
        case 'dota':
            return DOTA_TAG;
        case 'lol':
            return LOL_TAG;
        case 'r6':
            return R6_TAG;
    }
}

function addToQueue(msg, game){
    var sameUser = 0;
    //check if sender is already in lineup
    console.log(players);
    players[game].forEach(function(item, index, array) {
        if (item === msg.author.toString()){
            sameUser = 1;
        }
    });

    if(sameUser === 1){
        msg.channel.send('You are already in the lineup').then(sentMessage => {
            sentMessage.delete(MSG_TIME_DEL);
        });
        console.log('User already in lineup');
    }
    else{
        if(!full[game]){      //Do this if not full
            console.log('User to be added to lineup');
            //Proceed to this if not in lineup
            players[game].push(msg.author.toString())
            lineup[game] = players[game].join();
            remaining[game] = remaining[game] - 1; 
        }
    }

    if(remaining[game] == 0){
        if(!full[game]){
            //msg.channel.send('Lineup complete: ' + lineup);
            bot.channels.get(CHANNEL_ID).send(`${game.toUpperCase()} Lineup Complete: ${lineup[game]}`);
            full[game] = true;
            // remove players in other lineups
        }
        else{
            msg.channel.send('Lineup already full :(. Check again later. A queue feature will be implemented in the future').then(sentMessage => {
                sentMessage.delete(MSG_TIME_FULL_DEL);
            });
        }
    }
    else{
        if(remaining[game] == 4 && !sameUser) {
            //msg.channel.send(GAME_TAG + ' +' + remaining);
            const GAME_TAG = getGameTag(game);
            bot.channels.get(CHANNEL_ID).send(GAME_TAG + ' +' + remaining[game]);
        }
        else{
            if(sameUser == 0)
            msg.channel.send('Added you to the lineup').then(sentMessage => {
                sentMessage.delete(MSG_TIME_DEL);
            });
        }

    }
}

function inviteModule(game){
    if(remaining[game] === 0)
        msg.channel.send('Lineup full.').then(sentMessage => {
            sentMessage.delete(MSG_TIME_DEL);
        });  
    else
        bot.channels.get(CHANNEL_ID).send(gameTag[game] + ' +' + remaining[game]);
}

function removeFromLineup(pos, game){
    players[game].splice(pos, 1);
    lineup[game] = players[game].join();
    remaining[game] = remaining[game] + 1;
    full[game] = false;
}

function processCommand(msg,mentionList,mentionSize){

    let args  =  msg.content.substring(PREFIX.length).split(' ')
    args[0] = args[0].toLowerCase();

    switch(args[0]){
        case 'cs': 
        case 'dota':
        case 'lol':
        case 'r6':
            addToQueue(msg, args[0]);
            break;
        case 'reset':
            if(args[1] == undefined) {
                reset();
                msg.channel.send('Reset all lineups');
            }
            else {
                //Typo safe
                if (gameList.indexOf(args[1]) > -1)
                {
                    msg.channel.send('Reset lineup for ' + args[1]);
                    reset(args[1]);
                }
            }
            break;
        case 'leave':
            if(args[1] == undefined) {  //.leave
                let isPartOfLineup = false;
                let pos;
                gameList.forEach(game => {
                    pos = players[game].indexOf(msg.author.toString());
                    if(pos > -1){
                        isPartOfLineup = true;
                       removeFromLineup(pos, game);
                    }
                });

                msg.channel.send(!isPartOfLineup ? 'You are not part of any lineup.' : 'Removed you from the lineups.').then(sentMessage => {
                    sentMessage.delete(MSG_TIME_DEL);
                });
            }
            else {  //.leave cs
                if (gameList.indexOf(args[1]) > -1) {
                    const game = args[1];
                    pos = players[game].indexOf(msg.author.toString());
                    if(pos > -1){
                        removeFromLineup(pos, game);
                        msg.channel.send('Removed you from the lineup.').then(sentMessage => {
                            sentMessage.delete(MSG_TIME_DEL);
                        });
                    }
                    else {
                        msg.channel.send('You are not part of the lineup.').then(sentMessage => {
                            sentMessage.delete(MSG_TIME_DEL);
                        });
                    }
                }
            }
            break;
        case 'invite':
            if(args[1] == undefined){
                gameList.forEach(game => {
                   if(players[game].indexOf(msg.author.toString()) !== -1){
                        inviteModule(game);
                   } 
                });
            }
            else {
                if (gameList.indexOf(args[1]) > -1) inviteModule(args[1]);
            }

            break;
        case 'lineup':
            if (args[1] === undefined) {
                gameList.forEach((game, index) => {
                    if(players[game].length == 0){
                        const embed = new Discord.RichEmbed()
                        .setTitle(`${game.toUpperCase()}`)
                        .addField('Current lineup','No players in lineup');
                        msg.channel.send(embed);
                    }
                    else{
                        const lineupList = players[game].join('\n');
                        const embed = new Discord.RichEmbed()
                        .setTitle(`${game.toUpperCase()}`)
                        .addField('Current Lineup', lineupList)
                        msg.channel.send(embed);
                    }
                });
            }
            else {
                const gameName = args[1];
                switch(gameName) {
                    case 'cs':
                    case 'dota':
                    case 'lol':
                    case 'r6':
                        if(players[gameName].length == 0){
                            const embed = new Discord.RichEmbed()
                            .setTitle(`${gameName.toUpperCase()}`)
                            .addField('Current lineup','No players in lineup');
                            msg.channel.send(embed);
                        }
                        else{
                            const lineupList = players[gameName].join('\n');
                            const embed = new Discord.RichEmbed()
                            .setTitle(`${gameName.toUpperCase()}`)
                            .addField('Current Lineup', lineupList)
                            msg.channel.send(embed);
                        }
                        break;
                    default:
                        ''
                        break;
                }
            }
            break;
        case 'g':
        case 'game':
            if (args[1] !== undefined) {
                const game = args[1];
                if (gameList.indexOf(game) > -1) {
                    if (players[game].indexOf(msg.author.toString()) > -1) {
                        bot.channels.get(CHANNEL_ID).send('tara g ' + lineup[game]);
                    } else {
                        msg.channel.send('You are not part of that lineup').then(sentMessage => {
                            sentMessage.delete(MSG_TIME_DEL);
                        });
                    }
                }
            }
            break;
        case 'add':
            if (args[1] === undefined) {
                msg.channel.send('Indicate game to add to.').then(sentMessage => {
                    sentMessage.delete(MSG_TIME_DEL);
                });
            }
            if(mentionList == null)
                msg.channel.send('Mention user to add to lineup');
            else{
                let sameUser = false;
                const game = args[1];
                if (gameList.indexOf(game) < 0) break;
                for(var i = 0; i < mentionSize; i++){
                    sameUser = false;
                    //check if sender is already in lineup
                    if (players[game].indexOf(mentionList[i]) > -1) sameUser = true;
                    
                    if(sameUser){
                        msg.channel.send('User ' + (i+1) + ' already added').then(sentMessage => {
                            sentMessage.delete(MSG_TIME_DEL);
                        });
                        console.log('User already in lineup');
                    }
                    else{
                        if(!full[game]){
                            console.log('User to be added to lineup');
                            //Proceed to this if not in lineup
                            players[game].push(mentionList[i])
                            lineup[game] = players[game].join();
                            remaining[game] = remaining[game] - 1; 
                        }
                    }

                    if(remaining[game] == 0){
                        if(!full[game]){
                            //msg.channel.send('Lineup complete: ' + lineup);
                            bot.channels.get(CHANNEL_ID).send(`${game.toUpperCase()} Lineup Complete: ${lineup[game]}`);
                            full[game] = true;
                            break;
                        }
                        else{
                            msg.channel.send('Lineup already full :(. Check again later. A queue feature will be implemented in the future').then(sentMessage => {
                                sentMessage.delete(MSG_TIME_FULL_DEL);
                            });
                            break;
                        }
                    }
                    else{
                        if(remaining[game] == 4){
                            console.log(gameTag[game] + ' +' + remaining[game]);
                        }
                        else{
                            if(sameUser == 0){
                                msg.channel.send('Added to lineup').then(sentMessage => {
                                    sentMessage.delete(MSG_TIME_DEL);
                                });
                            }
                        }
                    }
                }
            }   
            break;
        case 'kick':
            if (args[1] === undefined) {
                msg.channel.send('Indicate game to kick from.').then(sentMessage => {
                    sentMessage.delete(MSG_TIME_DEL);
                });
            }
            if(mentionList == null)
                msg.channel.send('Mention user to kick from lineup');
            else{
                const game = args[1];
                if (gameList.indexOf(game) < 0) break;
                for(var i = 0; i < mentionSize; i++){
                    let pos = players[game].indexOf(mentionList[i]);
                    if(pos < 0){
                        console.log('Not in lineup');
                        if(mentionSize > 1)
                            msg.channel.send("User is not in current lineup");
                        else
                            msg.channel.send('User ' + (i+1) + ' is not in current lineup'); 
                    }
                    else{    
                        players[game].splice(pos, 1);
                        msg.channel.send('Removed from lineup').then(sentMessage => {
                            sentMessage.delete(MSG_TIME_DEL);
                        });
                        console.log('Removed from lineup');
                        lineup[game] = players[game].join();
                        remaining[game] = remaining[game] + 1;
                        full[game] = false;
                    }  
                } 
            }
            break;
        case 'help':
            const helpEmbed = new Discord.RichEmbed()
            .setTitle('GentleBot Help')
            .addField('Queueing Commands', '.cs\n .dota\n .lol\n .r6')
            .addField('Reset', '.reset to clear all lineups\n .reset <game> to clear specific lineup. e.g. .reset dota')
            .addField('Lineup', '.lineup to see all lineups\n .lineup <game> to see specific lineup. e.g. .lineup dota')
            .addField('Invite', '.invite to send invite for lineups you are part of.\n .invite <game> to send specific invite. e.g. .invite dota')
            .addField('Leave', '.leave to leave all lineups.\n .leave <game> to leave specific lineup. e.g. .leave dota')
            .addField('Game', '.game, .game <game>')
            .addField('Add', '.add <game> <user> to add user to game')
            .addField('Kick', '.kick <game> <user> to kick user from game')
            msg.channel.send(helpEmbed);
            break;
        default:
            ''
            break;
    }
    
}

function reset(game){
    if(game) {
        remaining[game] = RESET;
        lineupList = [];
        lineup[game] = [];
        players[game] = [];
        full[game] = false;
    }
    else {
        remaining = {
            cs: RESET,
            lol: RESET,
            dota: RESET,
            r6: RESET
        };
        lineupList = [];
        lineup = {
            cs: [],
            lol: [],
            dota: [],
            r6: []
        };
        players = {
            cs: [],
            lol: [],
            dota: [],
            r6: []
        };
        
        full = {
            cs: false,
            lol: false,
            dota: false,
            r6: false
        }
    }
}

bot.login(process.env.BOT_TOKEN);

