import { Message } from "discord.js";
import { MSG_TIME_DEL } from "../common/constants";

/**
 * Delete message after a certain amount of time
 * @param sentMessage - message object to be deleted
 * @param timeout - amount of time before deleting message. MSG_TIME_DEL by default (~3s)
 */
export default function deleteMessage(
    sentMessage : Message,
    timeout : number = MSG_TIME_DEL,
) {
    sentMessage.delete({ timeout });
}