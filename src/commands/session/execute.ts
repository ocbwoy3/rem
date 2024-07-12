import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed,
	SlashCommandStringOption,
	CommandInteractionOption
} from "discord.js";
import { PrikolsHubRuntime, getGlobalRuntime } from "../../api/PrikolsHubCore";
import { Session } from "../../api/Session";

const runtime: PrikolsHubRuntime = (getGlobalRuntime() as PrikolsHubRuntime)

module.exports = {
	data: new SlashCommandBuilder()
		.setName('execute')
		.setDescription('Executes code on the server')
		.addStringOption(builder=>builder.setName("code").setDescription("The code to execute on the server.").setRequired(true)),
	async execute(interaction: CommandInteraction) {

		let not_session_embed: APIEmbed = {
			title: ":warning: Error",
			description: `This command can only be ran inside a session channel.`,
			color: 0xffff00
		}

		let embed: APIEmbed = {
			title: "Execute",
			description: `Attempting to execute code on the server.`,
			color: 0x0000ff
		}
		
		const ses: Session = (await runtime.getSessionByChannelId(interaction.channelId) as any)
		
		if (!ses) {
			await interaction.reply({ embeds: [not_session_embed], ephemeral: true })
			return;
		}

		await interaction.reply({ embeds: [embed], ephemeral: true })
		
		const code: string = (interaction.options.get('code')?.value as string)
		
		ses.queueCommands("execute",[code])

	},
};
