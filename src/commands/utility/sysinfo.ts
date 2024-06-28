import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions
} from "discord.js";

import * as os from 'os';
import * as fs from 'node:fs';

let osrel = fs.readFileSync('/etc/os-release', 'utf-8')
let opj: {[a: string]: string} = {}

osrel?.split('\n')?.forEach((line, index) => {
	let words = line?.split('=')
	let key = words[0]?.toLowerCase()
	if (key === '') return
	let value = words[1]?.replace(/"/g,'')
	opj[key] = value
})

// console.log(opj)

let osPrettyName = `**Linux Distribution:** ${opj.pretty_name || opj.name || "Unknown"}`
if (os.platform() == 'win32') {
	osPrettyName = "**OS:** Windows"
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sysinfo')
		.setDescription('Provides information about the device PrikolsHub is running on.'),
	async execute(interaction: CommandInteraction) {
		await interaction.deferReply(({ephemeral: false,fetchReply: false} as InteractionDeferReplyOptions))
		
		const msg =
			`### **${os.userInfo().username}@${os.hostname()}**\n`+
			`${osPrettyName}\n`+
			`**NodeJS PID:** ${process.pid}`
		await interaction.followUp(msg);
	},
};
