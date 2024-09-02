import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed,
	Attachment
} from "discord.js";
import { banUser, getAnonymous, getUserAdmin, getUsername, setAnonymous, setUserAdmin, setUsername, unbanUser } from "../../api/db/Prisma";
import { rm, rmSync } from "node:fs";
import { downloadFile } from "../../api/Utility";
import { getGlobalRuntime, REMRuntime } from "../../api/REMCore";
import { Session } from "../../api/Session";

function genEmbed(title: string, desc:string, col:number): APIEmbed {
	const embed: APIEmbed = {
		title: title,
		description: desc,
		color: col
	}

	return embed
}

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

module.exports = {
	data: new SlashCommandBuilder()
		.setName('anonymous')
		.setDescription('Set your anonymous mode')
		
		.addStringOption(anon=>anon
			.setName("state")
			.setDescription("The new anonymous mode")
			.setRequired(false)
		),

	// 20 chars: Exactlyy_TwentyChars

	async execute(interaction: CommandInteraction) {

		await interaction.deferReply({ fetchReply: true, ephemeral: true})
		
		const anon = (interaction.options.get('anon') as any)?.value || !(await getAnonymous(interaction.user.id))
	
		await setAnonymous(interaction.user.id,anon)

		await interaction.followUp({content:`Successfully ${anon === true ? "enabled" : "disabled"} anonymous mode.`,ephemeral:true})

	}
};
