import { Configuration, OpenAIApi } from 'openai';
import { Client, Message } from 'discord.js';
import { CommandInputs } from './processCommand.js';
import { sendDebugErrorMessage, sendMessage, sendRawMessage } from '../utils/index.js';
import ServiceProvider from '../services/serviceProvider.js';
import { AI_COOLDOWN } from '../common/constants.js';

function openAiPrompt(commandInputs : CommandInputs) {
    const {
        args, bot, command, message, serviceProvider,
    } : {
        args : Array<string>, bot : Client, command : string, message : Message, serviceProvider : ServiceProvider,
    } = commandInputs;
    const { cooldownService } = serviceProvider;

    if (args.length === 0) {
        const content = {
            'No text': 'No text entered after the command',
        };
        sendMessage(message.channel, content, 'error', 'User View');
        return;
    }

    const userPrompt = args.join(' ');
    // TODO: Check if necessary, and if so, clean up userPrompt

    // check if in cooldown
    const userId = `<@${message.author.id}>`;
    const commandKey = 'gpt';

    cooldownService.getCooldown(userId, commandKey).then((endCooldown) => {
        const now = new Date();
        if (endCooldown && endCooldown > now) {
            const remainingDuration = ((endCooldown.getTime() - now.getTime()) / 1000).toFixed(0);
            const content = {
                'Command Cooldown': `.\`${command}\` is in cooldown for ${remainingDuration} more seconds.`,
            };
            sendMessage(message.channel, content, 'error', command);
            return;
        }

        return cooldownService.addCooldown(userId, commandKey, AI_COOLDOWN);
    }, (error : any) => {
        if (error instanceof Error) {
            throw error;
        }
        const content = { 'Error Notification': error };
        sendMessage(message.channel, content, 'error', command);
    }).then(() => {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        
        openai.createCompletion({
            model: "text-davinci-003",
            prompt: userPrompt,
            max_tokens: 4000,
        }).then(response => {
            const botResponse = `<@${message.author.id}>\nQuestion: ${userPrompt}\n\nAnswer: ${response.data.choices[0].text}`
            sendRawMessage(message.channel, botResponse, () => {});
        }).catch((error:Error) => {
            sendDebugErrorMessage(bot, error)
        });
    }).catch((error : Error) => sendDebugErrorMessage(bot, error));;
}

/**
 * Commands for OpenAI
 */
const openAiCommands = [{
    name: 'OpenAI prompt',
    aliases: ['gpt', 'chatgpt'],
    run: openAiPrompt,
    formats: ['gpt <text>'],
    descriptions: ['Ask OpenAI a question, or a text'],
}];

export default openAiCommands;