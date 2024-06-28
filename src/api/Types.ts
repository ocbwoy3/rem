import { SlashCommandBuilder } from "discord.js"

export type CommandModuleExports = {
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