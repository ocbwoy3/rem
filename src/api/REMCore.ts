import { ActionRow, ActionRowBuilder, APIEmbed, APIEmbedField, Attachment, ButtonBuilder, ButtonStyle, Client, NewsChannel, RawFile, TextChannel } from "discord.js";
import { Session } from "./Session";
import * as config from "../../config.json";
import { downloadFile } from "./Utility";
import { tmpdir } from "os";
import * as fs from 'node:fs';
import { GetFFlag } from "./db/FFlags";
import { addToLog } from "./Bot";

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

		const join_session = new ButtonBuilder()
			.setLabel('Roblox')
			.setURL(newSession.gameUrl)
			.setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder()
			.addComponents(accept_session, decline_session, join_session);

		// download the thumbnail
		const filepath = await downloadFile(newSession.thumbnailUrl,`${tmpdir()}/rem-temp-${Date.now()}.png`)

		let embed: APIEmbed = {
			title: newSession.GameName,
			color: 0x00ff00,
			fields: [
				({name:"Job ID",value:jobId,inline:false} as APIEmbedField),
				({name:"IP Address",value:ipAddress,inline:false} as APIEmbedField)
			]
		}

		addToLog("Session Request",{session:newSession,ipAddress:newSession.ServerIPAddress},0x00ff00)

		if (this.SessionRequestsChannel) {
			await this.SessionRequestsChannel.send({
				components: ([row] as any),
				files: [filepath],
				embeds: [embed]
			});
		} else {
			console.error("SessionRequestsChannel is undefined");
		}

		(async()=>{
			await new Promise(f => setTimeout(f, 10000));
	
			fs.rmSync(filepath)
		})()
	}

}

let runtime: REMRuntime|null = null

export function setGlobalRuntime(new_runtime:REMRuntime): void {
	runtime = new_runtime
}

export function getGlobalRuntime(): REMRuntime|null {
	return runtime
}