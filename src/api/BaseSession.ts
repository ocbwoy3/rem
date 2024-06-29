import { PlaceInformation, getPlaceInfo } from "noblox.js"
import { IncomingSessionMsgRequest, IncomingSessionMsgRequestResponse, QueuedDiscordMessage, RobloxMessage, SessionPlayer } from "./Types"

export interface SessionData {
	GameName: string,
	SessionRegion: string,
	ServerIPAddress: string
	JobId: string,
	PlaceId: number,
}

export abstract class BaseSession implements SessionData {
	public GameName: string = "<Uninitalized Session>"
	public SessionRegion: string = "<Uninitalized Setup()>"
	public ServerIPAddress: string = "<Uninitalized Session>"
	public JobId: string = "<Uninitalized Session>"
	public PlaceId: number = -2
	public SessionAccepted: boolean = false

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
			const place: PlaceInformation = (await getPlaceInfo(this.PlaceId))[0]
			this.GameName = place.name
		} catch (e_) {
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
	public async AcceptSession(): Promise<void> {
		this.SessionAccepted = true
	}

	/**
	 * Processes a message.
	 * @param msg The message to process.
	 */
	private async processMessage(msg: RobloxMessage): Promise<void> {
		console.log(`[PrikolsHub/Session] R[${this.JobId.slice(0,5)}] <${msg[0]}> ${msg[2]}`)
	}

	/**
	 * Processes the incoming POST request to this session/ 
	 * @param data Message sent from the Roblox server.
	 * @returns Response to be sent back to the Roblox server.
	 */
	public async ProcessRequest(data: IncomingSessionMsgRequest): Promise<IncomingSessionMsgRequestResponse> {
		if (this.SessionAccepted == false) {
			return ({
				error: "SessionNotAccepted"
			} as IncomingSessionMsgRequestResponse)
		}

		const dat = Object.assign({},this.QueuedDiscordMessages)
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
		console.log(`[PrikolsHub/Session] S[${this.JobId.slice(0,5)}] <${displayName}> ${messageContent.slice(0,500)}`)
		this.QueuedDiscordMessages.push([displayName,nameColor,messageContent.slice(0,500)])
	}

	/**
	 * Queues a message as the server
	 * @param messageContent The message to queue
	 */
	public async queueSystemMessage(messageContent:string): Promise<void> {
		this.QueuedDiscordMessages.push(["PrikolsHub","ff0000",messageContent])
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

