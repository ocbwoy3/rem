import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed
} from "discord.js";
import { generateRequire, uploadPrikolsHub } from "../../api/secload";

uploadPrikolsHub()

module.exports = {
	gdpr: true,
	moderation_bypass: true,
	data: new SlashCommandBuilder()
		.setName('script')
		.setDescription('Generate a require.')
		.addStringOption(builder=>builder.setName("username").setDescription("Your Roblox username.").setRequired(true)),
	async execute(interaction: CommandInteraction) {

		await interaction.deferReply({ephemeral:false, fetchReply: true})

		const username: string = (interaction.options.get('username')?.value as string)
		const require = await generateRequire(username)

		await interaction.followUp({ content: `\`\`\`lua\n${require}\n\`\`\`` })
	},
};
