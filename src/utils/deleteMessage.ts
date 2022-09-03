import { Message } from "discord.js";
import { MSG_TIME_DEL } from "../common/constants";

export default function deleteMessage (
    sentMessage : Message,
    timeout : number = MSG_TIME_DEL,
) {
    sentMessage.delete({ timeout });
}