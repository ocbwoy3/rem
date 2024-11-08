import EventEmitter from "events";

export enum SocketSendMessageType {
	ACK = 0,
	WELCOME = 1,
	MESSAGE = 2,
	NEW_SESSION = 3,
	USER_MSG = 4,
	COMMAND = 5
}

export enum SocketRecvMessageType {
	ACK = 0,
	USER_MSG = 1,
	COMMAND = 2
}

export const REMGlobalEventsWS = new EventEmitter();
REMGlobalEventsWS.setMaxListeners(128)

export type AnySocketEvent = 
	
	// ack
	| {ack: true}
	
	// welcome
	| {pds: string, did: string}
	
	// message
	| {ji: string, user: string, id: number, msg: string}
	
	// new_session
	| {jobid: string, placeid: string, game: string}
	
	// user_msg
	| {ji: string, discord_name: string, msg: string}
	
	// command
	| {ji: string, cmd: string, args: string[]}

export function EmitWSEvent(type:SocketSendMessageType,message:AnySocketEvent) {
	REMGlobalEventsWS.emit("send",{
		t: type,
		c: message
	})
}