import { Configuration, OpenAIApi } from "openai";
import { Client, Message } from 'discord.js';
import { CommandInputs } from './processCommand.js';
import { sendDebugErrorMessage, sendMessage, sendRawMessage } from '../utils/index.js';

function openAiPrompt(commandInputs : CommandInputs) {
    const {
        args, bot, message
    } : {
        args : Array<string>, bot : Client, message : Message,
    } = commandInputs;

    if (args.length === 0) {
        const content = {
            'No text': 'No text entered after the command',
        };
        sendMessage(message.channel, content, 'error', 'User View');
        return;
    }
    const userPrompt = args.join(' ')

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