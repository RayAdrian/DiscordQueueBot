const Discord = require('discord.js');
const bot = new Discord.Client();
const GAME_TAG = '<@&547735369475555329>';  //Main server
const RESET = 5;
const MSG_TIME_DEL = 3000;
const MSG_TIME_FULL_DEL = 7000;
const CHANNEL_ID = process.env.CHANNEL_ID; //Pro-Gaming Channel 

const PREFIX = '.';
var remaining = RESET; 
var players = [];
var lineup = [];
var full = 0;

bot.on('ready', () => {
    console.log('Bot is online');
    bot.user.setActivity("CSbot; type .help for info");
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

function processCommand(msg,mentionList,mentionSize){

    let args  =  msg.content.substring(PREFIX.length).split(' ')
    args[0] = args[0].toLowerCase();

    switch(args[0]){
        case 'cs': 
            var sameUser = 0;
            //check if sender is already in lineup
            players.forEach(function(item, index, array) {
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
                if(full == 0){      //Do this if not full
                    console.log('User to be added to lineup');
                    //Proceed to this if not in lineup
                    players.push(msg.author.toString())
                    lineup = players.join();
                    remaining = remaining - 1; 
                    var today = new Date();
                    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                    console.log(msg.author.toString() + " invited to play at " + time);
                }
            }

            if(remaining == 0){
                if(full == 0){
                    //msg.channel.send('Lineup complete: ' + lineup);
                    bot.channels.get(CHANNEL_ID).send('Lineup complete: ' + lineup);
                    full = 1;
                }
                else{
                    msg.channel.send('Lineup already full :(. Check again later. A queue feature will be implemented in the future').then(sentMessage => {
                        sentMessage.delete(MSG_TIME_FULL_DEL);
                    });
                }
            }
            else{
                if(remaining == 4)
                    //msg.channel.send(GAME_TAG + ' +' + remaining);
                    bot.channels.get(CHANNEL_ID).send(GAME_TAG + ' +' + remaining);
                else{
                    if(sameUser == 0)
                    msg.channel.send('Added you to the lineup').then(sentMessage => {
                        sentMessage.delete(MSG_TIME_DEL);
                    });
                }

            }
            break;
        case 'leave':
            var pos = players.indexOf(msg.author.toString());
            if(pos < 0){
                console.log('Not in lineup');
                msg.channel.send("You're not in current lineup").then(sentMessage => {
                    sentMessage.delete(MSG_TIME_DEL);
                });
            }
            else{    
                players.splice(pos, 1);
                msg.channel.send('Removed you from the lineup').then(sentMessage => {
                    sentMessage.delete(MSG_TIME_DEL);
                });
                console.log('Removed from lineup');
                lineup = players.join();
                remaining = remaining + 1;
                full = 0;
            }
            break;
        case 'lineup':
             if(players.length == 0){
                    const embed = new Discord.RichEmbed()
                    .setTitle('CSGO')
                    .addField('Current lineup','No players in lineup');
                    msg.channel.send(embed);
                }
                else{
                    const lineupList = players.join('\n');
                    const embed = new Discord.RichEmbed()
                    .setTitle('CSGO')
                    .addField('Current Lineup', lineupList)
                    msg.channel.send(embed);
                }
            break;
        case 'add':
            if(mentionList == null)
                msg.channel.send('Mention user to add to lineup');
            else{
                var sameUser = 0;
                for(var i = 0; i < mentionSize; i++){
                    //check if sender is already in lineup
                    players.forEach(function(item, index, array) {
                        console.log('Player is '+ mentionList[i]);
                        if (item === mentionList[i]){
                            sameUser = 1;
                        }
                    });
                    if(sameUser === 1){
                        msg.channel.send('User ' + (i+1) + ' already added').then(sentMessage => {
                            sentMessage.delete(MSG_TIME_DEL);
                        });
                        console.log('User already in lineup');
                    }
                    else{
                        if(full == 0){
                            console.log('User to be added to lineup');
                            //Proceed to this if not in lineup
                            players.push(mentionList[i])
                            lineup = players.join();
                            remaining = remaining - 1; 
                            var today = new Date();
                            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                            console.log(msg.author.toString() + " invited to play at " + time);
                        }
                    }

                    if(remaining == 0){
                        if(full == 0){
                            //msg.channel.send('Lineup complete: ' + lineup);
                            bot.channels.get(CHANNEL_ID).send('Lineup complete: ' + lineup);
                            full = 1;
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
                        if(remaining == 4){
                            console.log(GAME_TAG + ' +' + remaining);
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
            if(mentionList == null)
                msg.channel.send('Mention user to kick from lineup');
            else{
                for(var i = 0; i < mentionSize; i++){
                    var pos = players.indexOf(mentionList[i]);
                    if(pos < 0){
                        console.log('Not in lineup');
                        if(mentionSize > 1)
                            msg.channel.send("User is not in current lineup");
                        else
                            msg.channel.send('User ' + (i+1) + ' is not in current lineup'); 
                    }
                    else{    
                        players.splice(pos, 1);
                        msg.channel.send('Removed from lineup').then(sentMessage => {
                            sentMessage.delete(MSG_TIME_DEL);
                        });
                        console.log('Removed from lineup');
                        lineup = players.join();
                        remaining = remaining + 1;
                        full = 0;
                    }  
                } 
            }
            break;
        case 'invite':
            //msg.channel.send(GAME_TAG + ' +' + remaining);
            bot.channels.get(CHANNEL_ID).send(GAME_TAG + ' +' + remaining);
            break;
        case 'reset':
            reset();
            msg.channel.send('Lineup cleared').then(sentMessage => {
                sentMessage.delete(MSG_TIME_DEL);
            });
            break;
        case 'g':
        case 'game':
        	if(remaining == 0)
        		bot.channels.get(CHANNEL_ID).send('tara g ' + lineup);
        	else{
        		msg.channel.send(remaining + ' slots remaining. Wait for lineup to be filled').then(sentMessage => {
                	sentMessage.delete(MSG_TIME_DEL);
            	});
        	}
        	break;
        case 'help':
            const helpEmbed = new Discord.RichEmbed()
            .setTitle('RaymundBot Help')
            .addField('Commands', 'Type: \n .cs to join lineup\n .leave to remove self from lineup\n .add to add players to lineup\n .kick to remove players from lineup\n .lineup to see current lineup\n .invite to invite players (wew)\n .game mentions all players in complete lineup\n .reset to clear lineup\n\n Players in lineup will automatically be notified when lineup is complete\n')
            msg.channel.send(helpEmbed);
            break;
    }
    console.log('Remaining:' + remaining);
    console.log('Players: ');
    players.forEach(function(item, index, array) {
        console.log(players);
    });
    
}

function reset(){
    remaining = RESET;
    lineupList = [];
    lineup = [];
    players = [];
    full = 0;
}

bot.login(process.env.BOT_TOKEN);
