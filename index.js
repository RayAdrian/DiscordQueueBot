const Discord = require('discord.js');
const mongoose = require('mongoose');
const Report = require('./models/report.js');
const Quote = require('./models/quote.js');
var cron = require('node-cron');

const bot = new Discord.Client();
// const GAME_TAG = '<@&547735369475555329>';  //Main server
const PUNISH_TAG = '<@&747740479638208532>';

const MSG_TIME_DEL = 3000;
const PUNISH_TIME_DEL = 500;
const MSG_TIME_FULL_DEL = 7000;
const CHANNEL_ID = process.env.CHANNEL_ID; //Pro-Gaming Channel
// const CHANNEL_ID = '673393759626592273';   //Test server

const PREFIX = '.';

let data;
let adminUser;

let gameList = [];

let countList = {};

let remaining = {};

let players = {};

let lineup = {};

let full = {}

let gameTag = {}

let gameNameList = {}

async function fetchAll() {
    const query = Report.find({})
    query.getFilter();
    const data = await query.exec();
    return data;
}

function initData(isReset = false) {
    data.forEach(gameObj => {
        if (!isReset) gameList.push(gameObj.game);

        remaining = {
            ...remaining,
            [gameObj.game]: gameObj.playerCount
        };

        countList = {
            ...remaining
        };

        players = {
            ...players,
            [gameObj.game]: []
        };

        lineup = {
            ...players
        };

        full = {
            ...full,
            [gameObj.game]: false
        }

        gameTag = {
            ...gameTag,
            [gameObj.game]: gameObj.gameId
        }

        gameNameList = {
            ...gameNameList,
            [gameObj.gameId]: gameObj.game
        }
    });
}   

async function init() {
    data = await fetchAll();

    initData();
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function punish(msg) {
    msg.channel.send(PUNISH_TAG).then(sentMessage => {
        deleteMessage(sentMessage, true);
    });
}

bot.on('ready', async () => {
    console.log('Bot is online');
    bot.user.setActivity(".help | Sup gamers");
    // Quote.create({ message: 'Good morning gamers! All lineups are reset.' })
    // .then(quote => {
    //     console.log('uploaded quote')
    // })

    // bot.fetchUser("167564154562019328",false).then(user => {
    //     adminUser = user.username;
    // })

    // await mongoose.connect('mongodb://localhost/Reports');
    await mongoose.connect(process.env.DB_URL);

    // Prod deploy message
    // bot.channels.cache.get(CHANNEL_ID).send('Good morning gamers. I am now scalable (easily add and remove games). I am currently in beta and may contain bugs.\nPlease tag Chaeryeong if you encounter one');

    init();
});

cron.schedule('0 6 * * *', () => {
    Quote.find({})
    .then(quote => {
        const randInt = getRandomInt(quote.length - 1)
        reset();
        bot.channels.cache.get(CHANNEL_ID).send(quote[randInt].message);
        if (quote[randInt].message.includes('://')) {
            bot.channels.cache.get(CHANNEL_ID).send('All lineups are reset.');
            Quote.deleteOne({ _id: quote[randInt]._id })
            .then(quote => console.log('Quote deleted'))
        }
    })
}, {
    scheduled: true,
    timezone: "Asia/Manila"
});

bot.on('message' ,msg=>{
    if (msg.author == bot.user) { // Prevent bot from responding to its own messages
        return
    }


    if (msg.content.startsWith(PREFIX)) {
        mention = msg.mentions.members.first()
        if(mention == null)
            processCommand(msg,mention);
        else{
            //mention = msg.mentions.members.first().toString();
            mentionList = msg.mentions.members.array().toString().split(',');
            mentionSize = msg.mentions.members.size.toString();
            for(let i = 0; i < mentionSize; i++){
                if(mentionList[i].indexOf('!') >= 0){       //
                    mentionList[i] = mentionList[i].slice(0, 2) + mentionList[i].slice(3);
                }
            }
            processCommand(msg,mentionList,mentionSize);
        }
        punish(msg);
    }
   
});

function getGameTag(game) {
    return gameTag[game];
}

function addToQueue(msg, game){
    let sameUser = 0;
    //check if sender is already in lineup
    console.log(players);
    players[game].forEach(function(item, index, array) {
        if (item === msg.author.toString()){
            sameUser = 1;
        }
    });

    if(sameUser === 1){
        msg.channel.send('You are already in the lineup').then(sentMessage => {
            deleteMessage(sentMessage);
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

    if(remaining[game] == 0 && !isInfinite(game)){
        if(!full[game]){
            //msg.channel.send('Lineup complete: ' + lineup);
            bot.channels.cache.get(CHANNEL_ID).send(`${game.toUpperCase()} Lineup Complete: ${lineup[game]}`);
            full[game] = true;
            // remove players in other lineups
        }
        else{
            msg.channel.send('Lineup already full').then(sentMessage => {
                sentMessage.delete(MSG_TIME_FULL_DEL);
            });
        }
    }
    else{
        if (isInfinite(game)){
            if (remaining[game] === -1 && !sameUser) {
                const GAME_TAG = getGameTag(game);
                bot.channels.cache.get(CHANNEL_ID).send(GAME_TAG);
            }
            else{
                if(sameUser == 0)
                msg.channel.send('Added you to the lineup').then(sentMessage => {
                    deleteMessage(sentMessage);
                });
            }
        }
        else if(remaining[game] == (countList[game] - 1) && !sameUser) {
            //msg.channel.send(GAME_TAG + ' +' + remaining);
            const GAME_TAG = getGameTag(game);
            bot.channels.cache.get(CHANNEL_ID).send(GAME_TAG + ' +' + remaining[game]);
        }
        else{
            if(sameUser == 0)
            msg.channel.send('Added you to the lineup').then(sentMessage => {
                deleteMessage(sentMessage);
            });
        }

    }
}

function inviteModule(game){
    if (isInfinite(game)) 
        bot.channels.cache.get(CHANNEL_ID).send(gameTag[game]); 
    else if(remaining[game] !== 0)
        bot.channels.cache.get(CHANNEL_ID).send(gameTag[game] + ' +' + remaining[game]);  
}

function removeFromLineup(pos, game){
    players[game].splice(pos, 1);
    lineup[game] = players[game].join();
    remaining[game] = remaining[game] + 1;
    full[game] = false;
}

function isDigit(str) {
    return str && !/[^\d]/.test(str);
}

function addData(name, role, count, msg) {
    const report = new Report({
        game: name,
        gameId: role,
        playerCount: count
    });
    report.save()
    .then(result => {
        msg.channel.send('Game added.');
    })
    .catch(err => console.log(err));
    
    // Update all existing vars
    data.push({
        game: name,
        gameId: role,
        playerCount: count
    });
    gameList.push(name);
    countList = {
        ...countList,
        [name]: count
    };
    remaining = {
        ...remaining,
        [name]: count
    };
    players = {
        ...players,
        [name]: []
    };
    lineup = {
        ...players,
    };
    full = {
        ...full,
        [name]: false
    };
    gameTag = {
        ...gameTag,
        [name]: role
    };

    gameNameList = {
        ...gameNameList,
        [role]: name
    };
}

async function editData(msg, role, count) {
    const res = await Report.updateOne({ gameId: role }, { playerCount: count })
    if (res.n) {
        msg.channel.send('Game edited.');
    } else {
        msg.channel.send('An error occured.');
    }

    // Update all existing vars
    const name = gameNameList[role];
    data = data.filter(obj => {
        return data.gameId !== role
    });

    data.push({
        game: name,
        gameId: role,
        playerCount: count
    });

    remaining = {
        ...remaining,
        [name]: count
    };
    countList = {
        ...countList,
        [name]: count
    };
    players = {
        ...players,
        [name]: []
    };
    lineup = {
        ...players,
    };
    full = {
        ...full,
        [name]: false
    };
    gameTag = {
        ...gameTag,
        [name]: role
    };
}

async function removeData(msg, role) {
    Report.deleteOne({ gameId: role })
    .then(result => {
        msg.channel.send('Game deleted.');
    })
    .catch(err => console.log(err));

    // Update all existing vars
    data = data.filter(obj => {
        return data.gameId !== role
    });
    const name = gameNameList[role];
    gameList = gameList.filter((value, index, arr) => value !== name);
    
    delete remaining[name];
    delete countList[name];
    delete players[name];
    delete lineup[name];
    delete full[name];
    delete gameTag[name];
    delete gameNameList[role];
}

function deleteMessage (sentMessage, isPunish) {
    sentMessage.delete({ timeout: !isPunish ? MSG_TIME_DEL : PUNISH_TIME_DEL, reason: 'test' });
}

async function hasData(role) {
    const query = Report.find({ gameId: role })
    query.getFilter();
    const data = await query.exec();
    return data.length;
}

async function hasName(name) {
    const query = Report.find({ game: name })
    query.getFilter();
    const data = await query.exec();
    return data.length;
}

function hasError(msg, name, role, count, isRemove = false, isEdit = false) {
    if (!role || role[0] !== '<') {
        msg.channel.send('Invalid role').then(sentMessage => {
            deleteMessage(sentMessage);
        });
        return true;
    }

    if (!isRemove && !isEdit) {
        if (!name) {
            msg.channel.send('Indicate game to add').then(sentMessage => {
                deleteMessage(sentMessage);
            });
            return true;
        }

        if (!count || !isDigit(count)) {
            msg.channel.send('Invalid game player count.').then(sentMessage => {
                deleteMessage(sentMessage);
            });
            return true;
        }
    } else if (isEdit) {
        if (!count || !isDigit(count)) {
            msg.channel.send('Invalid game player count.').then(sentMessage => {
                deleteMessage(sentMessage);
            });
            return true;
        }
    }

    return false;
}

function isInfinite(game) {
    return countList[game] == 0 ? true : false;
}

async function processCommand(msg,mentionList,mentionSize){

    let args  =  msg.content.substring(PREFIX.length).split(' ')
    args[0] = args[0].toLowerCase();

    switch(args[0]){
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
                    deleteMessage(sentMessage);
                });
            }
            else {  //.leave cs
                if (gameList.indexOf(args[1]) > -1) {
                    const game = args[1];
                    pos = players[game].indexOf(msg.author.toString());
                    if(pos > -1){
                        removeFromLineup(pos, game);
                        msg.channel.send('Removed you from the lineup.').then(sentMessage => {
                            deleteMessage(sentMessage);
                        });
                    }
                    else {
                        msg.channel.send('You are not part of the lineup.').then(sentMessage => {
                            deleteMessage(sentMessage);
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
            const gameName = args[1];
            if (gameList.indexOf(gameName) > -1) {
                if(players[gameName].length == 0){
                    const embed = new Discord.MessageEmbed()
                    .setTitle(`${gameName.toUpperCase()}`)
                    .addField('Current lineup','No players in lineup');
                    msg.channel.send(embed);
                }
                else{
                    const lineupList = players[gameName].join('\n');
                    const embed = new Discord.MessageEmbed()
                    .setTitle(`${gameName.toUpperCase()}`)
                    .addField('Current Lineup', lineupList)
                    msg.channel.send(embed);
                }
            }
            break;
        case 'g':
            if (args[1] !== undefined) {
                const game = args[1];
                if (gameList.indexOf(game) > -1) {
                    if (players[game].indexOf(msg.author.toString()) > -1) {
                        bot.channels.cache.get(CHANNEL_ID).send('tara g ' + lineup[game]);
                    } else {
                        msg.channel.send('You are not part of that lineup').then(sentMessage => {
                            deleteMessage(sentMessage);
                        });
                    }
                }
            }
            break;
        case 'add':
            if (gameList.indexOf(args[1]) < 0) {
                msg.channel.send('Indicate game to add to.').then(sentMessage => {
                    deleteMessage(sentMessage);
                });
                break;
            }
            if(mentionList == null) {
                msg.channel.send('Mention user to add to lineup');
                break;
            }
            else{
                console.log('hereee');
                let sameUser = false;
                const game = args[1];
                if (gameList.indexOf(game) < 0) break;
                for(let i = 0; i < mentionSize; i++){
                    sameUser = false;
                    //check if sender is already in lineup
                    if (players[game].indexOf(mentionList[i]) > -1) sameUser = true;
                    
                    if(sameUser){
                        msg.channel.send('User already added').then(sentMessage => {
                            deleteMessage(sentMessage);
                        });
                        console.log('User already in lineup');
                        break;
                    }
                    else{
                        if(!full[game]){
                            console.log('User to be added to lineup');
                            //Proceed to this if not in lineup
                            players[game].push(mentionList[i])
                            lineup[game] = players[game].join();
                            remaining[game] = remaining[game] - 1; 
                            msg.channel.send('User added to lineup').then(sentMessage => {
                                sentMessage.delete({ timeout: MSG_TIME_DEL, reason: 'test' });
                            });
                            if (remaining[game] === -1 && isInfinite(game)) {
                                const GAME_TAG = getGameTag(game);
                                bot.channels.cache.get(CHANNEL_ID).send(GAME_TAG);
                            }
                            else if (remaining[game] ===  countList[game] - 1) {
                                const GAME_TAG = getGameTag(game);
                                bot.channels.cache.get(CHANNEL_ID).send(GAME_TAG + ' +' + remaining[game]);
                            }
                        }
                    }

                    if(remaining[game] == 0 && !isInfinite(game)){
                        if(!full[game]){
                            //msg.channel.send('Lineup complete: ' + lineup);
                            bot.channels.cache.get(CHANNEL_ID).send(`${game.toUpperCase()} Lineup Complete: ${lineup[game]}`);
                            full[game] = true;
                            break;
                        }
                        else{
                            msg.channel.send('Lineup already full').then(sentMessage => {
                                sentMessage.delete(MSG_TIME_FULL_DEL);
                            });
                            break;
                        }
                    }
                    else{
                        if(remaining[game] == 4){
                            console.log(gameTag[game] + ' +' + remaining[game]);
                        }
                    }
                }
            }   
            break;
        case 'kick':
            if (gameList.indexOf(args[1]) < 0) {
                msg.channel.send('Indicate game to kick from.').then(sentMessage => {
                    deleteMessage(sentMessage);
                });
                break;
            }
            if(mentionList == null) {
                msg.channel.send('Mention user to kick from lineup');
                break;
            }
            else{
                const game = args[1];
                if (gameList.indexOf(game) < 0) break;
                for(let i = 0; i < mentionSize; i++){
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
                            deleteMessage(sentMessage);
                        });
                        console.log('Removed from lineup');
                        lineup[game] = players[game].join();
                        remaining[game] = remaining[game] + 1;
                        full[game] = false;
                    }  
                } 
            }
            break;
        case 'game':
            switch (args[1]) {
                case 'add':
                    //Error handling
                    if (hasError(msg, args[2], args[3], args[4], false)) break;
                    if (await hasName(args[2]) !== 0) {
                        msg.channel.send('That name is already in use.');
                        break;
                    }
                    if (await hasData(args[3]) !== 0) {
                        msg.channel.send('That role is already added. If you would like to edit, please use the edit command.')
                        break;
                    }

                    addData(args[2], args[3], args[4], msg);
                    break;
                case 'remove':
                    if (hasError(msg, '', args[2], '', true)) break;
                    if (await hasData(args[2]) === 0) {
                        msg.channel.send('That role does not exist')
                        break;
                    }

                    removeData(msg, args[2]);
                    break;
                case 'edit':
                    if (hasError(msg, '', args[2], args[3], false, true)) break;
                    if (await hasData(args[2]) === 0) {
                        msg.channel.send('That game does not exist')
                        break;
                    }
                    editData(msg, args[2], args[3]);
                    break;
                default: break;
            }
            break;
        case 'help':
            const helpEmbed = new Discord.MessageEmbed()
            .setTitle('GentleBot Help')
            .addField('Queueing Commands', 'e.g. .cs')
            .addField('Reset', '.reset to clear all lineups\n .reset <game> to clear specific lineup. e.g. .reset dota')
            .addField('Lineup', '.lineup <game> to see specific lineup. e.g. .lineup dota')
            .addField('Invite', '.invite to send invite for lineups you are part of.\n .invite <game> to send specific invite. e.g. .invite dota')
            .addField('Leave', '.leave to leave all lineups.\n .leave <game> to leave specific lineup. e.g. .leave dota')
            .addField('Game', '.game, .game <game>')
            .addField('Add', '.add <game> <user> to add user to game')
            .addField('Kick', '.kick <game> <user> to kick user from game')
            .addField('Game List', '.gamelist to see list of available games')
            .addField('Game adding, editing, removing', '.game add <command> <role> <count>\n.game edit <role> <count>\n.game remove <role>')
            msg.channel.send(helpEmbed);
            break;
        case 'gamelist':
            let temp = '';
            temp = gameList.join();
            temp = temp.replace(/,/g, '\n');
            const gameEmbed = new Discord.MessageEmbed()
            .setTitle('Game list')
            .addField('Current available games', temp)
            msg.channel.send(gameEmbed);
            break;
        case 'botpic':
            const image = msg.attachments.first().url;
            bot.user.setAvatar(image);
            break;
        default:
            if (gameList.indexOf(args[0]) > -1) addToQueue(msg, args[0]);
            break;
    }
    
}

function reset(game){
    if(game) {
        remaining[game] = countList[game];
        lineup[game] = [];
        players[game] = [];
        full[game] = false;
    }
    else {
        initData(true);
    }
}

bot.login(process.env.BOT_TOKEN);

