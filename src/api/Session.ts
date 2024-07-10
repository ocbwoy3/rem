import { Channel, ForumChannel, ThreadChannel, ThreadOnlyChannel, Webhook } from "discord.js";
import { BaseSession } from "./BaseSession";
import * as config from "../../config.json";

export interface DiscordSessionData {
	channel?: ThreadChannel
	webhook?: Webhook
	channelId: string
}

export class Session extends BaseSession implements DiscordSessionData {
	public channelId: string = "-2";
	public channel?: ThreadChannel

	public async AcceptSession(forumThread:ThreadChannel): Promise<void> {
		this.channel = forumThread;
		this.channelId = forumThread.id;

		const forumChannel: ForumChannel = (await forumThread.client.channels.fetch(config.SessionForumChannelId) as ForumChannel)

		const webhook: Webhook = await forumChannel.createWebhook({
			name: `PrikolsHub_${Date.now()}`,
			reason: `${this.GameName}`
		})

		await webhook.send({
			threadId: forumThread.id,
			username: "PrikolsHub Testing!!!!!",
			content: "prikolshub testing!!!!!!!"
		})

		// some housekeeping here or something
		super.AcceptSession() // TODO: Use an alternative for prod
	}
}
