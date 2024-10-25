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
import { banUser, getUserAdmin, getUserInfo, prisma, setUserAdmin, unbanUser } from "../../api/db/Prisma";
import { rm, rmSync } from "node:fs";
import { downloadFile } from "../../api/Utility";
import { BotOwner, RootURL, atproto_url } from "../../../config.json";
import { AllFFlagDoc, FFlagDoc, GetAllFFlags, GetFFlag, GetFFlagUnsafe, SetFFlag } from "../../api/db/FFlags";
import e from "express";
import { addToLog } from "../../api/Bot";
import { exec } from "node:child_process";
import { getGlobalRuntime, REMRuntime } from "../../api/REMCore";
import { updateHandle } from "../../api/atproto/DIDHandleResolver";
import { getLinkingData } from "../../api/atproto/BlueskyHandleLinkingHelper";
import { randomUUID } from "node:crypto";

export default {
	moderation_bypass: true,
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('Control REM')

		.addSubcommandGroup(group => group
			.setName("dev")
			.setDescription("Manage the bot")
			
			.addSubcommand(subcommand => subcommand
				.setName("fake_session")
				.setDescription("Creates a fake session")
			)

			.addSubcommand(subcommand => subcommand
				.setName("eval")
				.setDescription("Executes bash code on the computer running REM")
				.addStringOption(stdin=>stdin
					.setName("stdin")
					.setDescription("Code to execute")
					.setRequired(true)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName("linking_data")
				.setDescription("Gets the bluesky handle linking data for a given DID")
				.addStringOption(did=>did
					.setName("did")
					.setDescription("DID to get linking data for")
					.setRequired(true)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName("bypass_identity")
				.setDescription("Updates your handle bypassing all restrictions")
				.addStringOption(newhandle=>newhandle
					.setName("new_handle")
					.setDescription("The new handle")
					.setRequired(true)
				)
				.addUserOption(user=>user
					.setName("user")
					.setDescription("The user to update")
					.setRequired(false)
				)
			)

		)

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
			case "dev": {
				if (interaction.user.id != BotOwner) {
					let embed2: APIEmbed = {
						title: "Owner Only",
						description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
						color: 0xff0000
					}
					return interaction.followUp({ embeds: [embed2] }).catch(()=>{});
				}
				switch (subcommand) {
					case "bypass_identity": {
						const new_handle = interaction.options.get('new_handle')?.value as string
						const user: string = (interaction.options.get('user')?.value || interaction.user.id) as string;
						const ud = await getUserInfo(user)

						prisma.user.update({
							where: {
								discordUserId: user.toString()
							},
							data: {
								atprotoHandle: new_handle
							}
						}).then(async()=>{
							addToLog("Handle Changed (Check Bypass)",{user: interaction.user, targetUser: `<@${user}>`, oldHandle: ud.atprotoHandle, newHandle: new_handle});

							updateHandle(ud.atprotoDid,ud.atprotoPrivateKey,new_handle);
	
							const stupid = `You'll need to add a DNS record to your domain:
	Name: \`_atproto.${new_handle}\`
	Type: \`TXT\`
	Content: \`did=${ud.atprotoDid}\`
	
	Or add a file to your site:
	Path: \`https://${new_handle}/.well-known/atproto-did\`
	Content: \`${ud.atprotoDid}\`
							`
	
							let embed: APIEmbed = {
								title: "Success",
								description: stupid.replace(/\t/g,'').trim(),
								color: 0x00ff00
							}
	
							if (new_handle.endsWith(atproto_url.replace("*",""))) {
								let embed: APIEmbed = {
									title: "Success",
									description: `Your handle has been successfully changed.\nYour new handle is under \`${atproto_url}\`, the record management was successful.`,
									color: 0x00ff00
								}
								return interaction.followUp({ embeds: [embed], ephemeral: true }).catch(()=>{});
							}
	
							return interaction.followUp({ embeds: [embed], ephemeral: true }).catch(()=>{});
						}).catch((err: string)=>{
							let embed: APIEmbed = {
								title: "Error",
								description: `Could not update your handle. Most likely it's in use by a different user.\n\`\`\`\n${err}\n\`\`\``,
								color: 0xff0000
							}
							return interaction.followUp({ embeds: [embed], ephemeral: true }).catch(()=>{});
						});
						return;
					};
					case "eval": {
						const stdin = (interaction.options.get('stdin') as any).value;
						addToLog("Child Process Executed",{user: interaction.user, stdin: `${(interaction.options.get('stdin') as any).value}`},0x0000ff);
						interaction.followUp({ content: `executing code` }).catch(()=>{});
						exec(stdin,async(_,stdout:string)=>{
							interaction.channel?.send(stdout).catch(()=>{});
						})
						return;
					}
					case "fake_session": {
						const runtime = getGlobalRuntime() as REMRuntime;
						const PLACE_IDS = [
							11510416200,
							15918403591
						];
						runtime.createSession(PLACE_IDS[Math.floor(Math.random()*PLACE_IDS.length)],randomUUID(),'128.116.0.0').catch(()=>{}) // https://bgp.he.net/AS22697#_prefixes
						return interaction.followUp({ content: `ok` }).catch(()=>{});
					}
					case "linking_data": {
						const did = (interaction.options.get('did') as any).value;
						await getLinkingData(did) // did:plc:s7cesz7cr6ybltaryy4meb6y
						return interaction.followUp({ content: `output` }).catch(()=>{});
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}
				return;
			}
			case "db": {
				if (interaction.user.id != BotOwner) {
					let embed2: APIEmbed = {
						title: "Owner Only",
						description: `You cannot access this command!`.replace(/\t/g,'').replace(/\n/g,' ').trim(),
						color: 0xff0000
					}
					return interaction.followUp({ embeds: [embed2] }).catch(()=>{});
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
						}).catch(()=>{});
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
							return interaction.followUp({ embeds: [embed] }).catch(()=>{});
						}
						const file = new AttachmentBuilder(Buffer.from(ud.atprotoPrivateKey),{name:"privatekey.bin"});
						return interaction.followUp({ content: `atproto did private key (stored in current db) - \`${ud.atprotoDid}\` (\`@${ud.atprotoHandle}\`)\n**DO NOT SHARE/DISTRIBUTE**`, files: [file] }).catch(()=>{});
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
						addToLog("User Banned from REM",{moderator: interaction.user, userBanned: `<@${(interaction.options.get('user') as any).value}>`},0xff0000);
						await banUser((interaction.options.get('user') as any).value,(interaction.options.get('reason') as any).value,interaction.user.id);
						await interaction.followUp({ content: `Sucessfully banned <@${(interaction.options.get('user') as any).value}> from REM!` });
						return;
					}
					case "unban": {
						addToLog("User Unbanned from REM",{moderator: interaction.user, userUnbanned: `<@${(interaction.options.get('user') as any).value}>`},0x00ff00);
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
						addToLog("FFlag Set",{user: interaction.user, fflag: fflag, oldState: `${current}`, newState: `${value}`},0x0000ff);
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
