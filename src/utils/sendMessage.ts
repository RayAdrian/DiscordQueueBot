import { DMChannel, NewsChannel, TextChannel } from "discord.js";

const defaultOnError = (error : any) => {
    console.log(error);
};

export default function sendMessage(
    channel : TextChannel | DMChannel | NewsChannel,
    content : any,
    onSuccess : Function = () => {},
    onError : Function = defaultOnError,
) {
    channel.send(content)
        .then(sentMessage => onSuccess(sentMessage))
        .catch(error => onError(error));
}
