import { ActionRow, ActionRowBuilder, Attachment, ButtonBuilder, ButtonStyle, Client, NewsChannel, RawFile, TextChannel } from "discord.js";
import { Session } from "./Session";
import * as config from "../../config.json";
import { downloadFile } from "./Utility";
import { tmpdir } from "os";
import * as fs from 'node:fs';

export class PrikolsHubRuntime {

	private Sessions: Session[] = []
	private DiscordClient: Client|undefined = undefined
	private SessionRequestsChannel: TextChannel|undefined = undefined

	/**
	 * Sets up the PrikolsHub Runtime, the library handling everything in the Remote Admin.
	 * @param discordClient The discord.js client of the bot.
	 */
	constructor(discordClient: Client) {
		this.DiscordClient = discordClient
	}

	public async setup(): Promise<void> {
		this.SessionRequestsChannel = (await this.DiscordClient?.channels.fetch(config.SessionRequestsChannelId)) as TextChannel
	}
	
	public async getSessionByJobId(jobId:string): Promise<Session|null> {
		for (let i=0; i < this.Sessions.length; i++) {
			if (this.Sessions[i].JobId == jobId) {
				return this.Sessions[i];
			}
		}
		return null;
	}

	public async deleteSessionByJobId(jobId:string): Promise<void> {
		for (let i=0; i < this.Sessions.length; i++) {
			if (this.Sessions[i].JobId == jobId) {
				delete this.Sessions[i];
				console.log(`[PrikolsHub/Session] Deleted session "${jobId}"`)
			}
		}
	}

	public async getSessionByChannelId(channelId:number): Promise<Session|null> {
		for (let i=0; i < this.Sessions.length; i++) {
			if (this.Sessions[i].channelId == channelId) {
				return this.Sessions[i];
			}
		}
		return null;
	}

	public async getSessions(): Promise<Session[]> {
		return this.Sessions
	}

	public async createSession(placeId:number,jobId:string,ipAddress:string): Promise<void> {
		const newSession = new Session(placeId,jobId,ipAddress)
		await newSession.SetupSession()
		this.Sessions.push(newSession)
		console.log(`[PrikolsHub/Session] New session from "${newSession.GameName}" - ${newSession.PlaceId} (IP: ${newSession.ServerIPAddress})`)

		const accept_session = new ButtonBuilder()
			.setCustomId(`accept_mksession|${jobId}`)
			.setLabel('Accept')
			.setStyle(ButtonStyle.Success);

		const decline_session = new ButtonBuilder()
			.setCustomId(`reject_mksession|${jobId}`)
			.setLabel('Decline')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(accept_session, decline_session);

		// download the thumbnail
		const filepath = await downloadFile(newSession.thumbnailUrl,`${tmpdir()}/prikolshub-temp-${(new Date()).getMilliseconds().toString()}.png`)

		await this.SessionRequestsChannel?.send({
			content: `# [\`${newSession.GameName}\`]( <${newSession.gameUrl}> )
			**JobId:** \`${jobId}\`
			**lang.session_requests.server_ip:** \`${ipAddress}\``.replace(/\t/g,''),
			components: ([row] as any),
			files: [filepath]
		})

		await new Promise(f => setTimeout(f, 10000));

		await fs.rmSync(filepath)
	}

}
