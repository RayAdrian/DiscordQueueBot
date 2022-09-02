const Discord = require('discord.js');
const mongoose = require('mongoose');
const Report = require('./models/report.js');
const Quote = require('./models/quote.js');
const User = require('./models/user.js');
var cron = require('node-cron');

const express = require('express');

const app = express();
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Hello world listening on port', port);
});

const bot = new Discord.Client();
// const GAME_TAG = '<@&547735369475555329>';  //Main server
const PUNISH_TAG = '<@&747740479638208532>';
const PUNISH_ID = '747740479638208532'

const MSG_TIME_DEL = 3000;
const PUNISH_TIME_DEL = 500;
const MSG_TIME_FULL_DEL = 7000;
const CHANNEL_ID = process.env.CHANNEL_ID; //Pro-Gaming Channel
// const CHANNEL_ID = '1006242505584562326';   //Test server
let enablePunish = false

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

function punish(msg, isCommand = false) {
    if(!isCommand) {
        if (enablePunish) {
            msg.channel.send(PUNISH_TAG).then(sentMessage => {
                deleteMessage(sentMessage, true);
            });
        }
    }
    else {
        msg.channel.send(`hoy ${PUNISH_TAG}`)
    }
}

function toggle(msg) {
    if (!msg.member.roles.cache.has(PUNISH_ID)) enablePunish = !enablePunish
}

bot.on('ready', async () => {
    console.log('Bot is online');
    bot.user.setActivity(".help | Sup gamers");

    // await mongoose.connect('mongodb://localhost/Reports');
    await mongoose.connect(process.env.DB_URL);

    const date = new Date()
    // if (date.getHours() !== 6 && date.getMinutes() !== 0) {
    //     bot.channels.cache.get(CHANNEL_ID).send('GentleBot was reset by Heroku. Please rejoin the lineups');
    // }

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
    }
   
});

function getGameTag(game) {
    return gameTag[game];
}

function addToQueue(msg, game){
    punish(msg)
    let sameUser = 0;
    //check if sender is already in lineup
    console.log(players);
    players[game].forEach(function(item) {
        if (item === msg.author.toString()){
            sameUser = 1;
        }
    });

    if(sameUser === 1){
        msg.channel.send(`You are already in the ${game} lineup`).then(sentMessage => {
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
            msg.channel.send(`${game} lineup already full`).then(sentMessage => {
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
                msg.channel.send(`Added you to the ${game} lineup`).then(sentMessage => {
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
            msg.channel.send(`Added you to the ${game} lineup`).then(sentMessage => {
                deleteMessage(sentMessage);
            });
        }

    }
}

function addToQueues(msg, games) {
    const playerResponseMessages = [];
    const mainChannelMessages = [];
    const msgAuthor = msg.author.toString();

    games.filter(game => gameList.includes(game)).forEach((game) => {
        const sameUser = players[game].includes(msgAuthor);
        const gameDisplayName = game.toUpperCase();
        const gameTag = getGameTag(game);

        if (sameUser) { // already in the lineup
            playerResponseMessages.push(`You are already in the ${gameDisplayName} lineup`);
            console.log(`User ${msgAuthor} already in the ${full[game] && 'full '}${gameDisplayName} lineup`);
        } else if (!full[game]) { // check if slot in lineup is available
            // update the lineup
            console.log(`User ${msgAuthor} to be added to the ${gameDisplayName} lineup`);
            players[game].push(msgAuthor);
            lineup[game] = players[game].join();
            remaining[game] -= 1;

            if (remaining[game] == 0 && !isInfinite(game)) { // if this player completes the lineup
                console.log(`User ${msgAuthor} completes ${gameDisplayName} lineup`);
                mainChannelMessages.push(`${gameDisplayName} Lineup Complete: ${lineup[game]}`);
                full[game] = true;
            } else if (isInfinite(game)) { // if the game lineup is infinite
                console.log(`User ${msgAuthor} added to limitless ${gameDisplayName} lineup`);
                playerResponseMessages.push(`Added you to the ${gameDisplayName} lineup`);
                if (remaining[game] == -1) { // ping game tag if this player is the first to join
                    mainChannelMessages.push(gameTag);
                }
            } else { // base case
                console.log(`User ${msgAuthor} added to ${gameDisplayName} lineup`);
                playerResponseMessages.push(`Added you to the ${gameDisplayName} lineup`);
                if (remaining[game] == (countList[game] - 1)) { // ping game tag if this player is the first to join
                    mainChannelMessages.push(`${gameTag} +${remaining[game]}`);
                }
            }
        }
        if (full[game]) { // if lineup is full
            console.log(`${gameDisplayName} lineup already full`);
            playerResponseMessages.push(`${gameDisplayName} lineup already full`);
        }
    })


    if (playerResponseMessages.length) {
        const playerResponseMessage = playerResponseMessages.join('\n');
        msg.channel.send(playerResponseMessage).then(sentMessage => {
            console.log('sentMessage', sentMessage);
            sentMessage.delete(MSG_TIME_FULL_DEL);
        });
    }
    if (mainChannelMessages.length) {
        const mainChannelMessage = mainChannelMessages.join('\n');
        bot.channels.cache.get(CHANNEL_ID).send(mainChannelMessage);
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

async function editData(msg, game, count) {
    const res = await Report.updateOne({ game }, { playerCount: count })
    if (res.n) {
        msg.channel.send('Game edited.');
    } else {
        msg.channel.send('An error occured.');
    }

    // Update all existing vars
    const role = gameTag[game];
    data = data.filter(obj => {
        return data.game !== game
    });

    data.push({
        game,
        gameId: role,
        playerCount: count
    });

    remaining = {
        ...remaining,
        [game]: count
    };
    countList = {
        ...countList,
        [game]: count
    };
    players = {
        ...players,
        [game]: []
    };
    lineup = {
        ...players,
    };
    full = {
        ...full,
        [game]: false
    };
    gameTag = {
        ...gameTag,
        [game]: role
    };
}

async function removeData(msg, game) {
    Report.deleteOne({ game })
    .then(result => {
        msg.channel.send('Game deleted.');
    })
    .catch(err => console.log(err));

    // Update all existing vars
    data = data.filter(obj => {
        return data.game !== game
    });
    const role = gameTag[game];
    gameList = gameList.filter((value, index, arr) => value !== game);
    
    delete remaining[game];
    delete countList[game];
    delete players[game];
    delete lineup[game];
    delete full[game];
    delete gameTag[game];
    delete gameNameList[role];
}

function deleteMessage (sentMessage, isPunish) {
    sentMessage.delete({ timeout: !isPunish ? MSG_TIME_DEL : PUNISH_TIME_DEL, reason: 'test' });
}

async function hasName(name) {
    const query = Report.find({ game: name })
    query.getFilter();
    const data = await query.exec();
    return data.length;
}

async function checkUserExists(id) {
    const query = User.find({ id })
    query.getFilter();
    const data = await query.exec();
    return !!data.length;
}

async function addToUserGames(msg, games) {
    const userExists = await checkUserExists(msg.author.id)
    if (userExists) {
        const query = User.find({ id: msg.author.id })
        query.getFilter();
        const data = await query.exec();
        const currentGames = data[0].games;

        const gamesToSave = games.filter(game => !currentGames.includes(game))

        User.findOneAndUpdate({ "id": msg.author.id }, { "$push": { "games": { "$each": gamesToSave }}})
        .then(_ => {
            msg.channel.send('Added to your bookmarked games');
        })
        .catch(err => console.log(err));
    } else {
        const user = new User({
            id: msg.author.id,
            games,
        });
        user.save()
        .then(_ => {
            msg.channel.send('Saved games updated');
        })
        .catch(err => console.log(err));
    }
}

async function removeFromUserGames(msg, game) {
    const userExists = await checkUserExists(msg.author.id)

    if (!userExists) {
        msg.channel.send('You don\'t have any saved games');
    } else {
        const query = User.find({ id: msg.author.id })
        query.getFilter();
        const data = await query.exec();
        const currentGames = data[0].games;

        const gamesToRetain = currentGames.filter(currentGame => currentGame !== game)

        User.findOneAndUpdate({ "id": msg.author.id }, { "games": gamesToRetain })
        .then(_ => {
            msg.channel.send(`Removed ${game} from your saved games`);
        })
        .catch(err => console.log(err));
    }
}

async function fetchUserGames(id) {
    const query = User.find({ id })
    query.getFilter();
    const data = await query.exec();
    return data[0].games;
}

function hasError(msg, name, role, count, isRemove = false, isEdit = false) {
    if ((!role || role[0] !== '<') && !isRemove && !isEdit) {
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
    let userExists = false;

    switch(args[0]){
        case 'reset':
            punish(msg)
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
            punish(msg)
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
            punish(msg)
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
            punish(msg)
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
            punish(msg)
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
            punish(msg)
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
            punish(msg)
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
            punish(msg)
            switch (args[1]) {
                case 'add':
                    //Error handling
                    if (hasError(msg, args[2], args[3], args[4], false)) break;
                    if (await hasName(args[2]) !== 0) {
                        msg.channel.send('That name is already in use.');
                        break;
                    }

                    addData(args[2], args[3], args[4], msg);
                    break;
                case 'remove':
                    if (hasError(msg, args[2], '', '', true)) break;
                    if (await hasName(args[2]) === 0) {
                        msg.channel.send('That game does not exist')
                        break;
                    }

                    removeData(msg, args[2]);
                    break;
                case 'edit':
                    if (hasError(msg, args[2], '', args[3], false, true)) break;
                    if (await hasName(args[2]) === 0) {
                        msg.channel.send('That game does not exist')
                        break;
                    }
                    editData(msg, args[2], args[3]);
                    break;
                default: break;
            }
            break;
        case 'help':
            punish(msg)
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
            .addField('Game adding, editing, removing', '.game add <command> <role> <count>\n.game edit <name> <count>\n.game remove <name>')
            .addField('Saved Games Feature', '.save <game1> <game2>... to add games to your saved games\n.join to automatically join lineups of saved games\n.savelist to view your currently saved games\n.removesave <game> to remove a saved game')
            msg.channel.send(helpEmbed);
            break;
        case 'supot':
            punish(msg, true)
            break;
        case 'toggle':
            toggle(msg)
            break;
        case 'gamelist':
            punish(msg)
            let temp = '';
            temp = gameList.join();
            temp = temp.replace(/,/g, '\n');
            const gameEmbed = new Discord.MessageEmbed()
            .setTitle('Game list')
            .addField('Current available games', temp)
            msg.channel.send(gameEmbed);
            break;
        case 'botpic':
            punish(msg)
            const image = msg.attachments.first().url;
            bot.user.setAvatar(image);
            break;
        case 'join':
            userExists = await checkUserExists(msg.author.id);
            if (!userExists) {
                msg.channel.send("You don't have any saved games yet. Add games using .bookmark <game1> <game2>...");
            } else {
                const games = await fetchUserGames(msg.author.id)
                punish(msg);
                addToQueues(msg, games);
            }
            break;
        case 'save':
            if (args.length >= 2) {
                args.shift()
                await addToUserGames(msg, args)
            } else {
                msg.channel.send("Indicate game to save.");
            }
            break;
        case 'savelist':
            userExists = await checkUserExists(msg.author.id);
            if (!userExists) {
                msg.channel.send("You don't have any saved games yet. Add games using .bookmark <game1> <game2>...");
            }
            const games = await fetchUserGames(msg.author.id) || []
            const embed = new Discord.MessageEmbed()
                .setTitle(`Saved Games - ${msg.author.username}`)
                .addField("Games", games.join("\n"));
                msg.channel.send(embed);
            break
        case 'admin':
            if (args.length >= 2) {
                args.shift()
                bot.channels.cache.get(CHANNEL_ID).send(args.join(" "));
            }
            break;
        case 'removesave':
            if (args.length >= 2) {
                await removeFromUserGames(msg, args[1])
            } else {
                msg.channel.send("Indicate game to remove.");
            }
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

