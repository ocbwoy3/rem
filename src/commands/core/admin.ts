import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	InteractionDeferReplyOptions,
	Client,
	APIEmbed,
	Attachment,
	APIEmbedField,
	AttachmentBuilder
} from "discord.js";
import { banUser, getUserAdmin, prisma, setUserAdmin, unbanUser } from "../../api/db/Prisma";
import { rm, rmSync } from "node:fs";
import { downloadFile } from "../../api/Utility";
import { BotOwner, RootURL } from "../../../config.json";
import { AllFFlagDoc, FFlagDoc, GetAllFFlags, GetFFlag, GetFFlagUnsafe, SetFFlag } from "../../api/db/FFlags";
import e from "express";

module.exports = {
	moderation_bypass: true,
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Control REM')

		.addSubcommandGroup(group => group
			.setName("db")
			.setDescription("Manage the database")
			
			.addSubcommand(subcommand => subcommand
				.setName("export")
				.setDescription("Export the database")
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("did_keypair")
				.setDescription("Obtain a user's DID keypair.")
				.addStringOption(did=>did
					.setName("did")
					.setDescription("The DID of the user")
					.setRequired(true)
				)
			)

		)

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

		const subcommandG = (interaction.options as any).getSubcommandGroup();
		const subcommand = (interaction.options as any).getSubcommand();

		// console.log(`atproto ${subcommandG} ${subcommand}`)

		let embed: APIEmbed = {
			title: "Admin Only",
			description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
			color: 0xff0000
		}

		// did:plc:s7cesz7cr6ybltaryy4meb6y

		await interaction.deferReply({ fetchReply: true, ephemeral: true});

		switch (subcommandG) {
			case "db": {
				if (interaction.user.id != BotOwner) {
					let embed2: APIEmbed = {
						title: "Owner Only",
						description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
						color: 0xff0000
					}
					return interaction.followUp({ embeds: [embed2] });
				}
				switch (subcommand) {
					case "export": {
						const allUsers = await prisma.user.findMany();
						const usersfile = new AttachmentBuilder(Buffer.from(JSON.stringify(allUsers,undefined,"\t")),{name:"SPOILER_users.json"});

						const allBans = await prisma.prikolsHubServiceBan.findMany();
						const bansfile = new AttachmentBuilder(Buffer.from(JSON.stringify(allBans,undefined,"\t")),{name:"SPOILER_bans.json"});

						const allFFlags = await prisma.featureFlag.findMany();
						const fflagsfile = new AttachmentBuilder(Buffer.from(JSON.stringify(allFFlags,undefined,"\t")),{name:"SPOILER_fflags.json"});

						return interaction.followUp({
							content: `all data from prisma db\n**DO NOT SHARE/DISTRIBUTE**`,
							files: [usersfile, bansfile, fflagsfile]
						});
					}
					case "did_keypair": {
						const did: string = (interaction.options.get('did') as any).value
						const ud = await prisma.user.findFirst({
							where: {
								atprotoDid: { equals: did }
							}
						})
						if (!ud) {
							let embed: APIEmbed = {
								title: "Error",
								description: `User with given DID is not in the database!`,
								color: 0xff0000
							}
							return interaction.followUp({ embeds: [embed] });
						}
						const file = new AttachmentBuilder(Buffer.from(ud.atprotoPrivateKey),{name:"privatekey.bin"});
						return interaction.followUp({ content: `atproto did private key (stored in current db) - \`${ud.atprotoDid}\` (\`@${ud.atprotoHandle}\`)\n**DO NOT SHARE/DISTRIBUTE**`, files: [file] });
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}
				
				return;
			}
			case "moderation": {
				if ( (await getUserAdmin(interaction.user.id)) === false) {
					await interaction.followUp( { embeds: [embed] } );
					return;
				} 
				switch (subcommand) {
					case "ban": {
						await banUser((interaction.options.get('user') as any).value,(interaction.options.get('reason') as any).value,interaction.user.id);
						await interaction.followUp({ content: `Sucessfully banned <@${(interaction.options.get('user') as any).value}> from REM!` });
						return;
					}
					case "unban": {
						await unbanUser((interaction.options.get('user') as any).value);
						await interaction.followUp({ content: `Sucessfully unbanned <@${(interaction.options.get('user') as any).value}> from REM!` });
						return;
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
						let fields: APIEmbedField[] = [];
					
						const doc: FFlagDoc = AllFFlagDoc;
						const fflags = await GetAllFFlags();
					
						Object.keys(doc).forEach((name: string) => {
							const docdesc = doc[name].desc;
							const docdef = doc[name].default;
							const doccur = fflags[name];
							fields.push({ name: `${name} (${doccur}, D: ${docdef})`, value: docdesc, inline: false } as APIEmbedField);
						});
					
						let AllEmbeds: APIEmbed[] = [];
					
						while (fields.length > 0) {
							let f: APIEmbedField[] = [];
							for (let i = 0; i < 4 && fields.length > 0; i++) {
								f.push(fields.shift()!);
							}
							let embed: APIEmbed = {
								color: 0xff0000,
								fields: f
							};
							AllEmbeds.push(embed);
						}
					
						AllEmbeds[0].title = "FFlag Doc";
						AllEmbeds[0].description = `This is a list of FFlags. You can view all of their meanings at ${RootURL}/api/fflag_doc.json`;
					
						await interaction.followUp({ embeds: AllEmbeds });
						return;
					}
					case "set": {
						const fflag = (interaction.options.get('fflag') as any).value;
						const value = (interaction.options.get('value') as any).value;
						const current = await GetFFlagUnsafe(fflag);
						if (current === null) {
							await interaction.followUp({ content: `FFlag doesn't exist!` });
							return;
						}
						if (current === value) {
							await interaction.followUp({ content: `${fflag} value is already ${value}` });
							return;
						}
						await SetFFlag(fflag,value);
						await interaction.followUp({ content: `Success. ${fflag}: ${current} -> ${value}` });
						return;
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}
			}
			default: { await interaction.followUp({ content:"unknown subcommand group" }) }
		}
	},
};
