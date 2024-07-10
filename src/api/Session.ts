import { Channel, ForumChannel, ThreadChannel, ThreadOnlyChannel, Webhook } from "discord.js";
import { BaseSession } from "./BaseSession";
import * as config from "../../config.json";
import { RobloxMessage } from "./Types";

export interface DiscordSessionData {
	channel?: ThreadChannel
	channelId: string
}

export class Session extends BaseSession implements DiscordSessionData {
	public channelId: string = "-2";
	public channel?: ThreadChannel
	private webhook?: Webhook

	protected async processMessage(msg: RobloxMessage): Promise<void> {

		try {
			this.webhook?.send({
				threadId: this.channel?.id,
				username: msg[0],
				content: msg[2].slice(0,500)
			})
		} catch(e_) { console.error(e_) }

		super.processMessage(msg)
	}

	public async AcceptSession(forumThread:ThreadChannel): Promise<void> {
		this.channel = forumThread;
		this.channelId = forumThread.id;

		const forumChannel: ForumChannel = (await forumThread.client.channels.fetch(config.SessionForumChannelId) as ForumChannel)

		const webhook: Webhook = await forumChannel.createWebhook({
			name: `PrikolsHub_${Date.now()}`,
			reason: `${this.GameName}`
		})

		this.webhook = webhook

		await webhook.send({
			threadId: forumThread.id,
			username: "PrikolsHub Testing!!!!!",
			content: "prikolshub testing!!!!!!!"
		})

		// some housekeeping here or something
		super.AcceptSession() // TODO: Use an alternative for prod
	}
}
