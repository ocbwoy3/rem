import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed
} from "discord.js";
import { generateRequire, uploadREM } from "../../api/secload";
import { getUsername } from "../../api/db/Prisma";

uploadREM()

module.exports = {
	data: new SlashCommandBuilder()
		.setName('script')
		.setDescription('Generate a require.'),
	async execute(interaction: CommandInteraction) {

		await interaction.deferReply({ephemeral:false, fetchReply: true})

		const username: string = await getUsername(interaction.user.id)

		if (username === "REM_UNDEFINED_USERNAME") {
			await interaction.followUp({ content: "Your username is not set, please set it using the `/account` command.", ephemeral: true })
			return
		}

		const require = await generateRequire(username)

		await interaction.followUp({ content: `\`\`\`lua\n${require}\n\`\`\`` })
	},
};
