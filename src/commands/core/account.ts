import {
	SlashCommandBuilder,
	CommandInteraction, APIEmbed
} from "discord.js";
import { getUserInfo, getUsername, prisma, setUsername } from "../../api/db/Prisma";
import { getGlobalRuntime, REMRuntime } from "../../api/REMCore";
import { addToLog } from "../../api/Bot";
import { captureException } from "@sentry/node";
import { generateUserLinkingHash, getBlueskyDetails, getLinkingData, PDS_DID } from "../../api/atproto/BlueskyHandleLinkingHelper";
import { resolveHandleToDid } from "../../api/atproto/DIDHandleResolver";
import assert from "node:assert";

function genEmbed(title: string, desc:string, col:number): APIEmbed {
	const embed: APIEmbed = {
		title: title,
		description: desc,
		color: col
	}

	return embed
}

const runtime: REMRuntime = (getGlobalRuntime() as REMRuntime)

export default {
	cooldown: 5,
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
		)
		
		.addSubcommandGroup(group => group
			.setName("bsky")
			.setDescription("Bluesky account linking")
			
			.addSubcommand(subcommand => subcommand
				.setName("unlink")
				.setDescription("Unlinks your Bluesky account from your REM account")
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("gen_proof")
				.setDescription("Generates the hash for linking")
			)
			
			.addSubcommand(subcommand => subcommand
				.setName("link")
				.setDescription("Links your Bluesky and REM accounts")
				.addStringOption(handle=>handle
					.setName("handle")
					.setDescription("Your Bluesky Handle")
					.setRequired(true)
				)

			)

		),

	// 20 chars: Exactlyy_TwentyChars

	async execute(interaction: CommandInteraction) {

		let subcommand = (interaction.options as any).getSubcommand()
		let subcommandG = (interaction.options as any).getSubcommandGroup();

		if (subcommandG === "bsky") {
			subcommandG = subcommand;
			subcommand = "bsky";
		}

		const account = await getUsername( interaction.user.id )
		
		if (subcommand === "bsky") {
			await interaction.deferReply({ fetchReply: true, ephemeral: true})
		} else {
			await interaction.deferReply({ fetchReply: true, ephemeral: false})	
		}

		switch (subcommand) {
			case "bsky": {
				if (interaction.user.id !== "486147449703104523") return interaction.followUp({ embeds: [genEmbed("Account","Bluesky account linking is WIP.",0xffff00)] }).catch(()=>{});
				switch (subcommandG) {
					case "unlink": {
						const userinfo = await getUserInfo(interaction.user.id);
						if (userinfo.bskyHandleDid === "") return interaction.followUp({ embeds: [genEmbed("Error","You don't have a linked Bluesky account!",0xff0000)] }).catch(()=>{});
						prisma.user.update({
							where: {
								discordUserId: interaction.user.id
							},
							data: {
								bskyHandle: "",
								bskyName: "",
								bskyHandleDid: "",
								bskyHandleProof: "",
								bskyHandlePDS: ""
							}
						}).then(()=>{
							return interaction.followUp({ embeds: [genEmbed("Success","You have successfully unlinked your Bluesky account!",0x00ff00)] }).catch(()=>{});
						}).catch((e)=>{
							captureException(e)
							return interaction.followUp({ embeds: [genEmbed("Error","Failed to unlink account!",0x00ff00)] }).catch(()=>{});
						})
						return;
					}
					case "gen_proof": {
						const h = await generateUserLinkingHash(interaction.user.id);
						const jc = JSON.stringify({
							$type: "dev.ocbwoy3.rem.connection",
							pds: PDS_DID,
							proof: h
						},undefined,"\t")
						const x = `Log into [PDSls](https://pdsls.dev) with your Bluesky account and create a record.\nColllection: \`dev.ocbwoy3.rem.connection\`\nRkey: \`self\`\nContent:\n\`\`\`json\n${jc}\n\`\`\``
						return interaction.followUp({ embeds: [genEmbed("Success",x,0x00ff00)] }).catch(()=>{});
					}
					case "link": {
						const newHandle: string|undefined = interaction.options.get("handle")?.value as string
						const userinfo = await getUserInfo(interaction.user.id);
						if (userinfo.bskyHandleDid !== "") return interaction.followUp({ embeds: [genEmbed("Error","You already have a linked Bluesky account!",0xff0000)] }).catch(()=>{});
						try {
							const lhProof = await generateUserLinkingHash(interaction.user.id);
							const didres = await resolveHandleToDid(newHandle);
							const ld = await getLinkingData(didres);
							assert(ld.proof === lhProof, "Handle Proof does not match hash!")
							const bskyd = (await getBlueskyDetails(didres)).data;
							prisma.user.update({
								where: {
									discordUserId: interaction.user.id
								},
								data: {
									bskyHandle: bskyd.handle,
									bskyName: bskyd.displayName,
									bskyHandleDid: bskyd.did,
									bskyHandleProof: lhProof,
									bskyHandlePDS: PDS_DID
								}
							}).then(()=>{
								return interaction.followUp({ embeds: [genEmbed("Success","You have successfully linked your Bluesky account!",0x00ff00)] }).catch(()=>{});
							}).catch((e)=>{
								captureException(e)
								return interaction.followUp({ embeds: [genEmbed("Error","Failed to link account!",0x00ff00)] }).catch(()=>{});
							})
						} catch(e) {
							return interaction.followUp({ embeds: [genEmbed("Error",`${e}`,0xff0000)] }).catch(()=>{});
						}
						return;
					}
					default: { await interaction.followUp({ content:"unknown subcommand" }) }
				}
				return;
			}
			case "info": {
				const ai = await getUserInfo(interaction.user.id);
				await interaction.followUp({
					embeds: [genEmbed("Account Info",`**REM**
-# **Roblox Username:** \`${ai.RobloxUsername}\`
-# **Skidtru Whitelist:** ${ai.skidtruWhitelist}

-# **DID:** \`${ai.atprotoDid}\`
-# **Handle:** \`${ai.atprotoHandle.slice(0,35)}\`

**Bluesky**
-# **DID:** ${ai.bskyHandleDid !== "" ? `\`${ai.bskyHandleDid.slice(0,35)}\`` : "N/A"}
-# **Handle:** ${ai.bskyHandle !== "" ? `\`${ai.bskyHandle.slice(0,35)}\`` : "N/A"}
-# **Name:** ${ai.bskyName !== "" ? `\`${ai.bskyName.slice(0,35)}\`` : "N/A"}`,0x00ff00)]
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
				return interaction.followUp({ embeds: [genEmbed("Account","Your username has been updated.",0x00ff00)] }).catch(()=>{});
			}
			default: { await interaction.followUp({ content:"unknown subcommand" }) }
		}
	}
}