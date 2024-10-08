import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed,
	Attachment
} from "discord.js";
import { banUser, getUserAdmin, getUserInfo, getUsername, setUserAdmin, setUsername, unbanUser } from "../../api/db/Prisma";
import { rm, rmSync } from "node:fs";
import { downloadFile } from "../../api/Utility";
import { getGlobalRuntime, REMRuntime } from "../../api/REMCore";
import { Session } from "../../api/Session";
import { addToLog } from "../../api/Bot";

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
		.setName('account')
		.setDescription('Manage your REM account')
		
		.addSubcommand(subcommand => subcommand
			.setName("username")
			.setDescription("Set your Roblox username")
			.addStringOption(username=>username
				.setName("username")
				.setDescription("Your Roblox username")
				.setRequired(false)
			)
		)
		
		.addSubcommand(subcommand => subcommand
			.setName("info")
			.setDescription("Gets information about your account")
		),

	// 20 chars: Exactlyy_TwentyChars

	async execute(interaction: CommandInteraction) {

		const subcommand = (interaction.options as any).getSubcommand()

		const account = await getUsername( interaction.user.id )
		
		await interaction.deferReply({ fetchReply: true, ephemeral: false})

		switch (subcommand) {
			case "info": {
				const ai = await getUserInfo(interaction.user.id);
				await interaction.followUp({
					embeds: [genEmbed("Account Info",`**Roblox Username:** \`${ai.RobloxUsername}\`
**Handle:** \`${ai.atprotoHandle}\`
**Banned from changing handle:** ${ai.handleChangeBanned}
**DID:** \`${ai.atprotoDid}\`
**Skidtru Whitelist:** ${ai.skidtruWhitelist}
**Admin:** ${ai.isAdmin}
**Coins:** ${ai.coins}`,0x00ff00)]
				})
				return;
			}
			case "username": {
				const newUser: string|undefined = interaction.options.get("username")?.value as string

				if (!newUser) {
					if (account === "REM_UNDEFINED_USERNAME") {
						await interaction.followUp({
							embeds: [genEmbed("Account","Your username is not set.",0xff0000)]
						})
						return
					}
					await interaction.followUp({
						embeds: [genEmbed("Account",`Your Roblox Username is **${account.slice(0,20)}**`,0x00ff00)]
					})
					return
				}

				await setUsername(interaction.user.id,newUser.slice(0,20))

				addToLog("Username Changed",{user: interaction.user, oldUsername: account, newUsername: newUser.slice(0,20) });
				await interaction.followUp({ embeds: [genEmbed("Account","Your username has been updated.",0x00ff00)] })
				return
			}
			default: { await interaction.followUp({ content:"unknown subcommand" }) }
		}
	},
};
