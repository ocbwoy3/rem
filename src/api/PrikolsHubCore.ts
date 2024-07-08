import { Client, TextChannel } from "discord.js";
import { Session } from "./Session";
import * as config from "../../config.json";

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
		this.Sessions.push(newSession)
		await this.SessionRequestsChannel?.send({
			content: `ph_debug NewSession ${placeId.toString()} ${jobId} ${ipAddress}`
		})
	}

}
