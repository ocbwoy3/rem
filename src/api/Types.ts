import * as xrpc from '@atproto/xrpc-server'
import express from 'express'
import { SlashCommandBuilder } from "discord.js"

export type CommandModuleExports = {
	gdpr?: boolean, // Defines if the command is GDPR-related (will only allow European users to use)
	moderation_bypass?: boolean, // Defines if the user should be allowed to use the command if they are banned
	data: SlashCommandBuilder,
	execute: Function
}

export type QueuedDiscordMessage = [
	string,
	string|boolean,
	string|string[]
]

export type RobloxMessage = [
	string, // displayName (@userName, userId)
	number, // userId
	string  // messageContent
]

export type SessionPlayer = [
	string, // userName
	string, // displayName
	number  // userId
]

export interface IncomingSessionMsgRequest {
	messages: RobloxMessage[],
	players: SessionPlayer[]
}

export interface IncomingSessionMsgRequestResponse {
	error?: string,
	messages?: QueuedDiscordMessage[]
}

export interface XRPCContext {
	auth: xrpc.HandlerAuth | undefined
	params: xrpc.Params
	input: xrpc.HandlerInput | undefined
	req: express.Request
	res: express.Response
}

export type SkidtruMessage = {
	role: "system" | "user" | "assistant",
	name?: string,
	content: string
}