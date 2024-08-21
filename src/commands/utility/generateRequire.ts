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
import { GetFFlag } from "../../api/db/FFlags";

uploadREM()

function genEmbed(title: string, desc:string, col:number): APIEmbed {
	const embed: APIEmbed = {
		title: title,
		description: desc,
		color: col
	}

	return embed
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('script')
		.setDescription('Generate a require.'),
	async execute(interaction: CommandInteraction) {

		if ((await GetFFlag("DFFlagOrder66"))) {
			await interaction.reply({
				embeds: [genEmbed("Error","Cannot generate because of Order 66.",0xff0000)],
				ephemeral: true
			})
			return
		}

		await interaction.deferReply({ephemeral:true, fetchReply: true})

		const username: string = await getUsername(interaction.user.id)

		if (username === "REM_UNDEFINED_USERNAME") {
			await interaction.followUp({ content: "Your username is not set, please set it using the `/account` command.", ephemeral: true })
			return
		}

		const require = await generateRequire(username)

		await interaction.followUp({ content: `\`\`\`lua\n${require}\n\`\`\``, ephemeral: true })
	},
};
