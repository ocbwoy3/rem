import { Channel, ThreadChannel } from "discord.js";
import { BaseSession } from "./BaseSession";

export interface DiscordSessionData {
    channel?: ThreadChannel
    channelId: number
}

export class Session extends BaseSession implements DiscordSessionData {
    channelId: number = -2;
}