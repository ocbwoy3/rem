// const cl = console.log; const cw = console.warn; const ce = console.error
// console.log = function(x) { cl("[STDOUT]",x) }; console.warn = function(x) { cw("[STDWRN]",x) }; console.error = function(x) { ce("[STDERR]",x) }

/*

⠀⠀⠀⢰⠶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠶⠲⣄⠀
⠀⠀⣠⡟⠀⠈⠙⢦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⡶⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠾⠋⠁⠀⠀⢽⡄
⠀⠀⡿⠀⠀⠀⠀⠀⠉⠷⣄⣀⣤⠤⠤⠤⠤⢤⣷⡀⠙⢷⡄⠀⠀⠀⠀⣠⠞⠉⠀⠀⠀⠀⠀⠈⡇
⠀⢰⡇⠀⠀⠀⠀⠀⠀⠀⠉⠳⣄⠀⠀⠀⠀⠀⠈⠁⠀⠀⠹⣦⠀⣠⡞⠁⠀⠀⠀⠀⠀⠀⠀⠀⡗
⠀⣾⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣻⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣏
⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡇
⠀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⠂
⠀⢿⠀⠀⠀⠀⣤⣤⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⣤⣤⣤⣤⡀⠀⠀⠀⠀⠀⣸⠇⠀
⠀⠘⣇⠀⠀⠀⠀⠉⠉⠛⠛⢿⣶⣦⠀⠀⠀⠀⠀⠀⢴⣾⣟⣛⡋⠋⠉⠉⠁⠀⠀⠀⠀⣴⠏⠀⠀
⢀⣀⠙⢷⡄⠀⠀⣀⣤⣶⣾⠿⠋⠁⠀⢴⠶⠶⠄⠀⠀⠉⠙⠻⠿⣿⣷⣶⡄⠀⠀⡴⠾⠛⠛⣹⠇
⢸⡍⠉⠉⠉⠀⠀⠈⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⣬⠷⣆⣠⡤⠄⢀⣤⠞⠁⠀
⠈⠻⣆⡀⠶⢻⣇⡴⠖⠀⠀⠀⣴⡀⣀⡴⠚⠳⠦⣤⣤⠾⠀⠀⠀⠀⠀⠘⠟⠋⠀⠀⠀⢻⣄⠀⠀
⠀⠀⣼⠃⠀⠀⠉⠁⠀⠀⠀⠀⠈⠉⢻⡆⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⠀⠀
⠀⢠⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡀⠀⠀⢀⡇⠀⠀⠀⠀⠀⠀⠀⠀⣀⡿⠧⠿⠿⠟⠀⠀
⠀⣾⡴⠖⠛⠳⢦⣿⣶⣄⣀⠀⠀⠀⠀⠘⢷⣀⠀⣸⠃⠀⠀⠀⣀⣀⣤⠶⠚⠉⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⢷⡀⠈⠻⠦⠀⠀⠀⠀⠉⠉⠁⠀⠀⠀⠀⠹⣆⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⡴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢳⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢠⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⡄⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⢲⡗⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡆⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠋⠀⠀⠀⠀⠀⠀⠀

*/

import { configDotenv } from "dotenv";
configDotenv()

// Load Sentry
import * as Sentry from "@sentry/node";
import "./api/instrument";

import { version } from "../package.json";
import * as config from "../config.json";
import * as os from "node:os";
console.log(`[REM] Running REM version ${version}`)


import { addToLog, client as djs_client, setExecutionContext } from "./api/Bot";
import { Session } from "./api/Session";
import { RobloxMessage } from "./api/Types";
import { REMRuntime, setGlobalRuntime } from "./api/REMCore";
import { Client, Embed, TextChannel, APIEmbed, APIEmbedField, Channel } from "discord.js";
import { setCookie } from "noblox.js";

import * as server from "./api/Server"
import { prisma } from "./api/db/Prisma";
import { GetFFlag, InitFFlags } from "./api/db/FFlags";

const client: Client = djs_client

console.log("[REM/Runtime] Loading execution context")

const Runtime = new REMRuntime(client)
setExecutionContext(Runtime)
setGlobalRuntime(Runtime)

if ( config.LogStartup == true) {
	client.on('ready',async()=>{
		const logs_channel: TextChannel = (await client.channels.fetch(config.LogChannelId) as TextChannel)
		new Promise(async()=>{
			let embed: APIEmbed = {
				title: "REM has started!",
				color: 0x00ff00,
				fields: [
					({name:"Host",value:`${os.userInfo().username}@${os.hostname()}`,inline:false} as APIEmbedField),
					({name:"PID",value:process.pid.toString(),inline:false} as APIEmbedField)
				]
			}
			
			logs_channel.send({embeds:[embed]})
		})
	})
}

client.on('ready',async()=>{
	console.log("[REM/Roblox] Authenticating with ROBLOSECURITY token")
	const userinfo = await setCookie(process.env.ROBLOSECURITY as string)
	console.log(`[REM/Roblox] Logged in using token as ${userinfo.name} (${userinfo.id})`)
	await Runtime.setup()

	// await Runtime.createSession(11195100561,'d9b93c64-f1cd-41ce-ab05-7c33912fa688','192.168.1.1')
	
	server.startApp()
})

const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT']
let isKilling = false

signals.forEach((signal:string)=>{
	process.on(signal,async()=>{
		if (signal=="SIGINT") {process.stdout.write('\b\b')}
		if (isKilling) return;
		isKilling = true;
	
		addToLog("REM Stopped",{signal:signal},0xff0000)

		if (signal == "SIGINT") {
			console.log('[REM] Received CTRL+C signal, stopping.')
		} else {
			console.log(`[REM] Stopping. (Received ${signal} signal)`)
		}

		let embed: APIEmbed = {
			title: "Session Killed",
			description: `The REM host process received a \`${signal}\` signal.`,
			color: 0xff0000
		}

		try {
			const sessions = await Runtime.getSessions();
			for (let i in sessions) {
				const session = sessions[i];
				try { await session.channel?.send({embeds: [embed]}) } catch {};
				try { await session.EndSession() } catch {};
				await new Promise(resolve=>setTimeout(resolve,1000));
			}
		} catch {}

		try {
			await client.destroy();
		} catch {};
		console.log(`[REM] Stopping Prisma client`)
		await prisma.$disconnect()
		process.exit(0)
	})
})

const StartREM = async()=>{
	await InitFFlags()

	console.log("[REM/Runtime] Logging into Discord")
	client.login(process.env.TOKEN)
}

StartREM()

