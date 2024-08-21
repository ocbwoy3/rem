import { PlaceInformation, ThumbnailRequest, getPlaceInfo, getThumbnails } from "noblox.js";
import * as noblox from "noblox.js";
import { IncomingSessionMsgRequest, IncomingSessionMsgRequestResponse, QueuedDiscordMessage, RobloxMessage, SessionPlayer } from "./Types"
import { REMRuntime, getGlobalRuntime } from "./REMCore";
import { GetFFlag } from "./db/FFlags";

export interface SessionData {
	GameName: string,
	SessionRegion: string,
	ServerIPAddress: string
	JobId: string,
	PlaceId: number,
	thumbnailUrl: string,
	gameUrl: string
}

export class BaseSession implements SessionData {
	public GameName: string = "<Uninitalized Session>"
	public SessionRegion: string = "<Uninitalized Setup()>"
	public ServerIPAddress: string = "<Uninitalized Session>"
	public JobId: string = "<Uninitalized Session>"
	public PlaceId: number = -2
	public SessionAccepted: boolean = false
	public thumbnailUrl: string = ""
	public gameUrl: string = "";

	private QueuedDiscordMessages: QueuedDiscordMessage[] = []
	private SessionPlayers: SessionPlayer[] = []

	constructor(placeId:number,jobId:string,ipAddress:string) {
		this.PlaceId = placeId
		this.JobId = jobId,
		this.ServerIPAddress = ipAddress
	}

	/**
	 * Fetches unavaiable information about the session. 
	 */
	public async SetupSession(): Promise<void> {
		try {
			const place: PlaceInformation = (await noblox.getPlaceInfo([this.PlaceId]))[0]
			this.GameName = place.name
			this.gameUrl = place.url
			// console.log(place)
			const thumbnails = await getThumbnails([({
				type: 'GameThumbnail',
				targetId: place.placeId,
				format: 'png',
				size: '768x432' // the biggest size roblox allows us to fetch
			} as ThumbnailRequest)])
			// console.log(thumbnails)
			this.thumbnailUrl = thumbnails[0].imageUrl || ""
		} catch (e_) {
			console.error(e_)
			this.GameName = "<Failed to fetch name>"
		}
	}

	/**
	 * Gets the players in the server: [userName, displayName, userId][]
	 * @returns The players in the session as an array.
	 */
	public GetPlayers(): SessionPlayer[] {
		return this.SessionPlayers
	}

	/**
	 * Accepts the session.
	 */
	public async AcceptSession(...anything:any): Promise<void> {
		// HACK: Fix Target sig provides too few args by adding ...anything:any to base func!!!
		// TODO: Figure out an alternative in prod
		console.log(`[REM/Chat] (${this.JobId.slice(0,5)}) Session Accepted - ${this.GameName}`)
		this.SessionAccepted = true
	}

	/**
	 * Ends the session.
	 */
	protected async EndSession(...anything:any): Promise<void> {
		this.SessionAccepted = false
		const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)
		await runtime.deleteSessionByJobId(this.JobId)
	}

	/**
	 * Processes a message.
	 * @param msg The message to process.
	 */
	protected async processMessage(msg: RobloxMessage): Promise<void> {
		console.log(`[REM/Chat] R[${this.JobId.slice(0,5)}] <${msg[0].replace(/ \(@(.*)/giu,'')}> ${msg[2]}`)
	}

	/**
	 * Processes the incoming POST request to this session/ 
	 * @param data Message sent from the Roblox server.
	 * @returns Response to be sent back to the Roblox server.
	 */
	public async ProcessRequest(data: IncomingSessionMsgRequest): Promise<IncomingSessionMsgRequestResponse> {
		if (this.SessionAccepted == false) {
			return ({
				error: "SESSION_NOT_ACCEPTED"
			} as IncomingSessionMsgRequestResponse)
		}

		const dat = Object.assign([],this.QueuedDiscordMessages)
		this.QueuedDiscordMessages = [] // HACK

		for (let i=0; i<data.messages.length; i++) {
			new Promise(async()=>{
				this.processMessage(data.messages[i])
			})
		}
		return ({
			messages: dat
		} as IncomingSessionMsgRequestResponse)
	}

	/**
	 * Queues a message to be sent to the Roblox server.
	 * @param displayName The User's nickname
	 * @param nameColor The User's highest role color (hexadecimal)
	 * @param messageContent The message's content
	 */
	public async queueMessage(displayName:string,nameColor:string,messageContent:string): Promise<void> {
		if (await GetFFlag("DFFlag1941")) {
			return
		}
		console.log(`[REM/Chat] D[${this.JobId.slice(0,5)}] <${displayName}> ${messageContent.slice(0,500)}`)
		this.QueuedDiscordMessages.push([displayName,nameColor,messageContent.slice(0,500)])
	}

	/**
	 * Queues a global message as the system user
	 * @param messageContent The message to queue
	 */
	public async queueGlobalMessage(messageContent:string): Promise<void> {
		this.QueuedDiscordMessages.push(["REM","ff0000",messageContent])
	}

	/**
	 * Queues a message as the system user
	 * @param messageContent The message to queue
	 */
	public async queueSystemMessage(messageContent:string): Promise<void> {
		console.log(`[REM/Chat] S[${this.JobId.slice(0,5)}] <REM> ${messageContent.slice(0,500)}`)
		this.QueuedDiscordMessages.push(["REM","ff0000",messageContent])
	}

	/**
	 * Queues a command to be sent to the server
	 * @param command The name of the command to be sent
	 * @param params Optional parameters to be sent to the server
	 */
	public async queueCommands(command:string,params:string[]=[]): Promise<void> {
		this.QueuedDiscordMessages.push([command,true,params])
	}	

}

