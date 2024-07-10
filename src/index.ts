import { version } from "../package.json";
import * as config from "../config.json";
import * as os from "node:os";
console.log(`[PrikolsHub] PrikolsHub.ts version ${version}`)

import { configDotenv } from "dotenv";
configDotenv()

import { client as djs_client, setExecutionContext } from "./api/Bot";
import { Session } from "./api/Session";
import { RobloxMessage } from "./api/Types";
import { PrikolsHubRuntime, setGlobalRuntime } from "./api/PrikolsHubCore";
import { Client, Embed, TextChannel, APIEmbed, APIEmbedField, Channel } from "discord.js";
import { setCookie } from "noblox.js";

import * as server from "./api/Server"

const client: Client = djs_client

console.log("[PrikolsHub/Runtime] Loading execution context")

const Runtime = new PrikolsHubRuntime(client)
setExecutionContext(Runtime)
setGlobalRuntime(Runtime)

if ( config.LogStartup == true) {
	client.on('ready',async()=>{
		const logs_channel: TextChannel = (await client.channels.fetch(config.LogChannelId) as TextChannel)
		new Promise(async()=>{
			let embed: APIEmbed = {
				title: "PrikolsHub has started!",
				color: 0x00ff00,
				fields: [
					({name:"PrikolsHub.ts version",value:version.toString(),inline:false} as APIEmbedField),
					({name:"Hostname",value:os.hostname(),inline:false} as APIEmbedField),
					({name:"Current user",value:os.userInfo().username,inline:false} as APIEmbedField),
					({name:"NodeJS PID",value:process.pid.toString(),inline:false} as APIEmbedField)
				]
			}
			
			logs_channel.send({embeds:[embed]})
		})
	})
}

client.on('ready',async()=>{
	console.log("[PrikolsHub/Roblox] Authenticating with ROBLOSECURITY token")
	const userinfo = await setCookie(process.env.ROBLOSECURITY as string)
	console.log(`[PrikolsHub/Roblox] Logged in using token as ${userinfo.UserName} (${userinfo.UserID})`)
	await Runtime.setup()
	// await Runtime.createSession(11195100561,'d9b93c64-f1cd-41ce-ab05-7c33912fa688','128.116.63.71')
	server.startApp()
})

console.log("[PrikolsHub/Runtime] Logging into Discord")
client.login(process.env.TOKEN)
