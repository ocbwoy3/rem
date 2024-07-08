import { Channel, ThreadChannel } from "discord.js";
import { BaseSession } from "./BaseSession";

export interface DiscordSessionData {
	channel?: ThreadChannel
	channelId: number
}

export class Session extends BaseSession implements DiscordSessionData {
	public channelId: number = -2;
	public channel?: ThreadChannel

	public async AcceptSession(forumThread:ThreadChannel): Promise<void> {
		// some housekeeping here or something
		super.AcceptSession() // TODO: Use an alternative for prod
	}
}
