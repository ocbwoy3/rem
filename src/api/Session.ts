import { APIEmbed, ActionRowBuilder, ButtonBuilder, ButtonStyle, Channel, ComponentType, ForumChannel, Interaction, ThreadChannel, ThreadOnlyChannel, Webhook } from "discord.js";
import { BaseSession } from "./BaseSession";
import * as config from "../../config.json";
import { RobloxMessage, SkidtruMessage } from "./Types";
import { getProfilePicture } from "./Utility";

export interface DiscordSessionData {
	channel?: ThreadChannel
	channelId: string
}

export class Session extends BaseSession implements DiscordSessionData {
	public channelId: string = "-2";
	public channel?: ThreadChannel
	protected webhook?: Webhook

	public SkidtruMessages: SkidtruMessage[] = [];

	public async EndSession(): Promise<void> {
		await this.webhook?.delete("session ended")
		await super.EndSession()

		new Promise(async()=>{
			// buttons

			const keepsesbtn_d = `rem_temp-${Date.now()}-keep`
			const delsesbtn_d = `rem_temp-${Date.now()}-delete`
			
			const keepButton = new ButtonBuilder()
				.setLabel('Keep')
				.setStyle(ButtonStyle.Primary)
				.setCustomId(keepsesbtn_d)

			const deleteButton = new ButtonBuilder()
				.setLabel('Delete')
				.setStyle(ButtonStyle.Danger)
				.setCustomId(delsesbtn_d)

			const row = new ActionRowBuilder()
				.addComponents(keepButton, deleteButton);

			let embed: APIEmbed = {
				title: "Session Ended",
				description: `This session has been closed by a user. You may choose to keep or end the session. It will automatically be kept if no user action was received for 60 seconds.`,
				color: 0x00ffff
			}

			const reply = await this.channel?.send({
				embeds: [embed],
				components: ([row] as any)
			})

			const collector = reply?.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 60_000
			})

			collector?.on('collect', async (interaction: Interaction) => {
				try {

					if (interaction.isAutocomplete()) return;

					const customid = ((interaction as any).customId as string)
					if (customid == keepsesbtn_d) {
						collector.stop()
						await interaction.reply({ content: 'Keeping session' })
						keepButton.setDisabled(true)
						deleteButton.setDisabled(true)
						await reply?.edit({
							components: ([row] as any)
						})
						return;
					}
					if (customid == delsesbtn_d) {
						collector.stop()
						await interaction.reply({ content: 'Deleting session' })
						this.channel?.delete()
						return
					}

				} catch {}
			})

			collector?.on('end', async() => {
				try {
					keepButton.setDisabled(true)
					deleteButton.setDisabled(true)
					await reply?.edit({
						components: ([row] as any)
					})
				} catch {}
			})

		})

	}

	protected async processMessage(msg: RobloxMessage): Promise<void> {

		try {
			this.webhook?.send({
				threadId: this.channel?.id,
				username: msg[0],
				content: msg[2].slice(0,500),
				avatarURL: await getProfilePicture(msg[1].toString())
			})
		} catch(e_) { console.error(e_) }

		super.processMessage(msg)
	}

	public async AcceptSession(forumThread:ThreadChannel): Promise<void> {
		this.channel = forumThread;
		this.channelId = forumThread.id;

		const forumChannel: ForumChannel = (await forumThread.client.channels.fetch(config.SessionForumChannelId) as ForumChannel)

		const webhook: Webhook = await forumChannel.createWebhook({
			name: `REM_${Date.now()}`,
			reason: `${this.GameName}`
		})

		this.webhook = webhook

		// await webhook.send({
		// 	threadId: forumThread.id,
		// 	username: "usernamehere",
		// 	content: "rem content"
		// })

		// some housekeeping here or something
		super.AcceptSession() // TODO: Use a better alternative for prod
	}
}
