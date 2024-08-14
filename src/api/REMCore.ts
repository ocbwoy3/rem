import { ActionRow, ActionRowBuilder, Attachment, ButtonBuilder, ButtonStyle, Client, NewsChannel, RawFile, TextChannel } from "discord.js";
import { Session } from "./Session";
import * as config from "../../config.json";
import { downloadFile } from "./Utility";
import { tmpdir } from "os";
import * as fs from 'node:fs';
import { GetFFlag } from "./db/FFlags";

export class REMRuntime {

	private Sessions: Session[] = []
	private DiscordClient: Client|undefined = undefined
	private SessionRequestsChannel: TextChannel|undefined = undefined

	/**
	 * Sets up the Runtime, the library handling everything in the Remote Admin.
	 * @param discordClient The discord.js client of the bot.
	 */
	constructor(discordClient: Client) {
		this.DiscordClient = discordClient
	}

	public async setup(): Promise<void> {
		this.SessionRequestsChannel = (await this.DiscordClient?.channels.fetch(config.SessionRequestsChannelId)) as TextChannel
	}
	
	public async getSessionByJobId(jobId:string): Promise<Session|null> {
		for (let i = 0; i < this.Sessions.length; i++) {
			if (this.Sessions[i].JobId == jobId) {
				return this.Sessions[i];
			}
		}
		return null;
	}
	public async deleteSessionByJobId(jobId:string): Promise<void> {
		for (let i=0; i < this.Sessions.length; i++) {
			if (this.Sessions[i].JobId == jobId) {
				delete this.Sessions.splice(i,1)[1];
				console.log(`[REM/Runtime] Deleted session "${jobId}"`)
				// console.log(this.Sessions)
			}
		}
	}

	public async getSessionByChannelId(channelId:string): Promise<Session|null> {
		for (let i = 0; i < this.Sessions.length; i++) {
			if (this.Sessions[i].channel?.id == channelId) {
				return this.Sessions[i];
			}
		}
		return null;
	}

	public async getSessions(): Promise<Session[]> {
		return this.Sessions
	}

	public async createSession(placeId:number,jobId:string,ipAddress:string): Promise<void> {
		if ((await GetFFlag("DFFlagOrder66"))) {
			console.log(`[REM/Runtime] ORDER66 DENY: ${placeId} - ${jobId} (IP: ${ipAddress})`)
			return
		}

		const newSession = new Session(placeId,jobId,ipAddress)
		await newSession.SetupSession()
		this.Sessions.push(newSession)
		console.log(`[REM/Runtime] New session request from "${newSession.GameName}" - ${newSession.PlaceId} (IP: ${newSession.ServerIPAddress})`)

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
		const filepath = await downloadFile(newSession.thumbnailUrl,`${tmpdir()}/rem-temp-${Date.now()}.png`)

		await this.SessionRequestsChannel?.send({
			content: `# [\`${newSession.GameName}\`]( <${newSession.gameUrl}> )
			**Job Id:** \`${jobId}\`
			**Server IP:** \`${ipAddress}\``.replace(/\t/g,''),
			components: ([row] as any),
			files: [filepath]
		})

		await new Promise(f => setTimeout(f, 10000));

		fs.rmSync(filepath)
	}

}

let runtime: REMRuntime|null = null

export function setGlobalRuntime(new_runtime:REMRuntime): void {
	runtime = new_runtime
}

export function getGlobalRuntime(): REMRuntime|null {
	return runtime
}