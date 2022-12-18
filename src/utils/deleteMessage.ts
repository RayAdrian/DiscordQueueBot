import { Message } from "discord.js";
import { DEFAULT_MSG_TIME_DEL } from "../common/constants.js";

/**
 * Delete message after a certain amount of time
 * @param sentMessage - message object to be deleted
 * @param timeout - amount of time before deleting message. DEFAULT_MSG_TIME_DEL by default (~5s)
 */
export default function deleteMessage(
    sentMessage : Message,
    timeout : number = DEFAULT_MSG_TIME_DEL,
) {
    sentMessage.delete({ timeout });
}