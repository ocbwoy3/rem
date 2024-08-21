import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed,
	Attachment
} from "discord.js";
import { banUser, getUserAdmin, setUserAdmin, unbanUser } from "../../api/db/Prisma";
import { rm, rmSync } from "node:fs";
import { downloadFile } from "../../api/Utility";
import { BotOwner, RootURL } from "../../../config.json";
import { GetFFlag, GetFFlagUnsafe, SetFFlag } from "../../api/db/FFlags";

module.exports = {
	moderation_bypass: true,
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Control REM')

		.addSubcommandGroup(group => group
			.setName("perm")
			.setDescription("Manage admins")
			
			.addSubcommand(subcommand => subcommand
				.setName("give")
				.setDescription("Give a user admin privileges")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to give admin")
					.setRequired(true)
				)
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("revoke")
				.setDescription("Remove admin from a user")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to remove admin from")
					.setRequired(true)
				)
			)

		)

		.addSubcommandGroup(group => group
			.setName("moderation")
			.setDescription("Moderate users")
			
			.addSubcommand(subcommand => subcommand
				.setName("ban")
				.setDescription("Ban a user from REM")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to ban")
					.setRequired(true)
				)
				.addStringOption(reason=>reason
					.setName("reason")
					.setDescription("The reason for the ban")
					.setRequired(true)
				)
				
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("unban")
				.setDescription("Unban a user from REM")
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to unban")
					.setRequired(true)
				)
			)

		)

		.addSubcommandGroup(group => group
			.setName("fflag")
			.setDescription("Modify FFlags")
			
			.addSubcommand(subcommand => subcommand
				.setName("list")
				.setDescription("List ALL FFlags")
				
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("set")
				.setDescription("Set's a FFlag")
				.addStringOption(flag=>flag
					.setName("fflag")
					.setDescription("The FFlag to set")
					.setRequired(true)
				)
				.addBooleanOption(value=>value
					.setName("value")
					.setDescription("The FFlag's new value")
					.setRequired(true)
				)

			)

		),

	async execute(interaction: CommandInteraction) {

		const subcommandG = (interaction.options as any).getSubcommandGroup()
		const subcommand = (interaction.options as any).getSubcommand()

		// console.log(`atproto ${subcommandG} ${subcommand}`)

		let embed: APIEmbed = {
			title: "Admin Only",
			description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
			color: 0xff0000
		}

		// did:plc:s7cesz7cr6ybltaryy4meb6y

		await interaction.deferReply({ fetchReply: true, ephemeral: true})

		switch (subcommandG) {
			case "moderation": {
				if ( (await getUserAdmin(interaction.user.id)) === false) {
					await interaction.followUp( { embeds: [embed] } )
					return
				} 
				switch (subcommand) {
					case "ban": {
						await banUser((interaction.options.get('user') as any).value,(interaction.options.get('reason') as any).value,interaction.user.id)
						await interaction.followUp({ content: `Sucessfully banned <@${(interaction.options.get('user') as any).value}> from REM!` })
						return
					}
					case "unban": {
						await unbanUser((interaction.options.get('user') as any).value)
						await interaction.followUp({ content: `Sucessfully unbanned <@${(interaction.options.get('user') as any).value}> from REM!` })
						return
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}
				return
			}
			case "perm": {
				if (interaction.user.id != BotOwner) {
					let embed2: APIEmbed = {
						title: "Owner Only",
						description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
						color: 0xff0000
					}
					await interaction.followUp({ embeds: [embed2] })
					return
				}
				switch (subcommand) {
					case "give": {
						await setUserAdmin((interaction.options.get('user') as any).value,true)
						await interaction.followUp({ content: `Sucessfully gave <@${(interaction.options.get('user') as any).value}> admin privileges!` })
						return
					}
					case "revoke": {
						await setUserAdmin((interaction.options.get('user') as any).value,false)
						await interaction.followUp({ content: `Sucessfully revoked admin privileges from <@${(interaction.options.get('user') as any).value}>!` })
						return
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}

				return
			}
			case "fflag": {
				if (interaction.user.id != BotOwner) {
					let embed2: APIEmbed = {
						title: "Owner Only",
						description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
						color: 0xff0000
					}
					await interaction.followUp({ embeds: [embed2] })
					return
				}
				switch (subcommand) {
					case "list": {
						await interaction.followUp({ content: `FFlag doc: ${RootURL}/api/fflag_doc.json\nALL FFlags: ${RootURL}/api/fflags.json` })
						return
					}
					case "set": {
						const fflag = (interaction.options.get('fflag') as any).value
						const value = (interaction.options.get('value') as any).value
						const current = await GetFFlagUnsafe(fflag)
						if (current === null) {
							await interaction.followUp({ content: `FFlag doesn't exist!` })
							return
						}
						if (current === value) {
							await interaction.followUp({ content: `${fflag} value is already ${value}` })
							return
						}
						await SetFFlag(fflag,value)
						await interaction.followUp({ content: `Success. ${fflag}: ${current} -> ${value}` })
						return
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}
			}
			default: { await interaction.followUp({ content:"unknown subcommand group" }) }
		}
	},
};
