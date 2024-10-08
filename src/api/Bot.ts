import { version } from "../../package.json";
import * as config from "../../config.json";

import {
	Client,
	GatewayIntentBits,
	User,
	REST,
	Routes,
	RESTPostAPIApplicationCommandsJSONBody,
	Events,
	Collection,
	Interaction,
	APIEmbed,
	APIEmbedField,
	ForumChannel,
	GuildForumThreadCreateOptions,
	MessageCreateOptions,
	ThreadChannel,
	StartThreadOptions,
	MessagePayload,
	Message,
	DefaultWebSocketManagerOptions,
	ActivityType,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	TextChannel
} from "discord.js";
import { CommandModuleExports, SessionPlayer } from "./Types";
import * as fs from "node:fs";
import * as path from "node:path";
import { REMRuntime } from "./REMCore";
import { Blacklist } from "../../config.json";
import { Session } from "./Session";
import { downloadFile } from "./Utility";
import { tmpdir } from "node:os";
import { message } from "noblox.js";
import { checkUserModStatus, getAnonymous, getUserInfo, ModerationReport } from "./db/Prisma";
import { GetFFlag } from "./db/FFlags";
import { GenerateResponse } from "./skidtru/ResponseGenerator";
import { Console, error } from "node:console";

const intents = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent
]

const { DefaultWebSocketManagerOptions: { identifyProperties }} = require("@discordjs/ws");

identifyProperties.browser = "Discord iOS"; // trick for bot on mobile

export const client: any = (new Client({
	intents: intents,
	presence: {
		status: 'idle',
		activities: [
			{
				name: "gay remote admin :3",
				type: ActivityType.Playing
			}
		]
	},
	ws: {
		properties: {
			$browser: "Discord iOS"
		}
	} as any
}) as Client)

export async function addToLog(title: string, data:{[a:string]: (User|Session|string)}, color?: number): Promise<void> {
	if (!color) { color = 0x5a5a5a };
	const logs_channel: TextChannel = (await client.channels.fetch(config.LogChannelId) as TextChannel)
	
	let things: APIEmbedField[] = [];

	Object.keys(data).forEach((a:string)=>{
		const v: User|Session|string = data[a];

		if (v instanceof Session) {
			things.push({name: a, value: `${v.GameName} (${v.PlaceId}/${v.JobId.slice(0,8)})`, inline :false});
			return;
		}
		if (v instanceof User) {
			things.push({name: a, value: `<@${v.id}>`, inline: false});
			return;
		}
		things.push({name: a, value: v.toString(), inline: false});
	})

	await new Promise(async()=>{
		let embed: APIEmbed = {
			title: title,
			color: color,
			fields: things
		}
		
		logs_channel.send({embeds:[embed]})
	})
}

async function registerCommands() {
	client.commands = new Collection()

	const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
	// Grab all the command folders from the commands directory you created earlier
	const foldersPath = path.join(__dirname, '..', 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		// Grab all the command files from the commands directory you created earlier
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command: CommandModuleExports = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
				client.commands.set(command.data.name, command)
			} else {
				console.warn(`[REM/Bot:registerCommands] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(process.env.TOKEN as string);

	// and deploy your commands!
	await (async () => {
		try {
			console.log(`[REM/Bot:registerCommands] Started refreshing ${commands.length} command(s).`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationCommands(process.env.APP_ID as string),
				{ body: commands },
			);

			console.log(`[REM/Bot:registerCommands] Successfully reloaded ${(data as any).length} command(s).`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
}

client.on('ready', async () => {
	console.log(`[REM/Bot:onReady] Logged in as ${(client.user as User).tag}`);
	await client.application.fetch()
	try {
		await registerCommands()
	} catch (e_: any) {
		console.warn(`[REM/Bot:onReady] Failed to register commands: ${e_.toString()}`)
	}
	console.log(`[REM/Bot:onReady] Bot successfully loaded!`)
});

var executionContext: REMRuntime | null = null;

export function setExecutionContext(newContext: REMRuntime | null): void {
	executionContext = newContext
}
2
client.on(Events.MessageCreate, async(message: Message) => {
	if (message.author.id.toString() in Blacklist) return;
	if (message.author.id === message.client.user.id) return;
	if (message.webhookId) return;
	const ses = await executionContext?.getSessionByChannelId(message.channelId)
	// console.log('ses',ses);
	if (!ses) return;
	// console.log('membr',message.member)
	const cont = message.content.trim().slice(0,2000)
	if (cont.length > 2000) return;
	if (cont.length === 0) return;
	if (message.mentions.has(message.client.user)) {
		GenerateResponse(message,ses).catch((error)=>{
			console.error("[REM/Skidtru]","SKIDTRU GEN ERROR",error)
			message.reply({ content: `[SKIDTRU GEN ERROR]\n\`\`\`\n${error}\n\`\`\`` }).catch(()=>{});
		})
	}
})

client.on(Events.MessageCreate, async(message: Message) => {
	try {
		// random attempts at debugging, realizing i forgot to set the channel in the session class after init
		// console.log(`${message.member?.nickname || message.author.displayName} - ${message.content}`);
		if (message.author.id.toString() in Blacklist) return;
		if (message.webhookId) return;
		const ses = await executionContext?.getSessionByChannelId(message.channelId)
		// console.log('ses',ses);
		if (!ses) return;
		// console.log('membr',message.member)
		const cont = message.content.trim().slice(0,2000)
		if (cont.length > 2000) return;
		if (cont.length === 0) return;
		
		if ((await getAnonymous(message.author.id)) && !(await GetFFlag("DFFlagCIA"))) {
			await ses.queueMessage(
				"Anonymous",
				"ff0000",
				cont
			)
		} else {
			let nick = (message.member?.displayName.slice(0,50) || "rem_undefined_nick")
			if ((await GetFFlag("DFFlagChatMessageHandles")) === true) {
				const ud = await getUserInfo(message.author.id)
				nick = `@${ud.atprotoHandle}`
			}
			await ses.queueMessage(
				nick,
				(message.member?.displayHexColor.slice(1) || "ff0000"),
				cont
			)
		}
	} catch(e_) {
		console.error(e_)
	}
})

const playerSelectorArgumentNames = ["player","owner","victim","target"]

client.on(Events.InteractionCreate, async(interaction: Interaction) => {
	try {
		try {

			// PLAYER AUTOCOMPLETE LOGIC

			if (interaction.isAutocomplete()) {

				const search = interaction.options.getFocused(true);

				// console.log(search,playerSelectorArgumentNames,playerSelectorArgumentNames.includes(search.name))

				if (!playerSelectorArgumentNames.includes(search.name)) return;
				if (!interaction.channel) return interaction.respond([]).catch(()=>{});

				const session = await executionContext?.getSessionByChannelId(interaction.channel?.id);

				if (!session) return interaction.respond([]).catch(()=>{});

			
				let plrs: {name: string, value: string}[] = [];
				session.GetPlayers().forEach((p: SessionPlayer)=>{
					// if (plrs.length < 25) return;
					if (search.value.length > 0) {
						if (!(`${p[1]} (@${p[0]}, ${p[2]})`.toLowerCase().includes(search.value.toLocaleLowerCase()))) return;
					}
					plrs.push({ name: `${p[1]} (@${p[0]}, ${p[2]})`, value: p[0] }) 
				});

				// console.log(plrs, plrs.length)
				return interaction.respond(plrs);
			};

			// MODERATION LOGIC

			const modStatus: ModerationReport|null = await checkUserModStatus(interaction.user.id)

			if (modStatus != null) {

				async function doIt(ms: ModerationReport) {
					// Twitch's poor UX..

					let embed: APIEmbed = {
						title: ":warning: You are banned.",
						// top tier discord://-/users/1
						// intentionally being vague about how we ban (user id's) by lying to end user so they dont know
						description: `**Banned using account descriptor.**\nYou are unable to use REM until a moderator unbans you. You may be able to request an unban at https://ocbwoy3.dev/appeal or by DMing the [owner]( <discord://-/users/${(client as any).application?.owner?.owner?.id || (client as Client).application?.owner?.id}>) of this bot.`,
						color: 0xff0000,
						fields: [
							({ name: "Reason", value: ms.reason, inline: false } as APIEmbedField),
							({ name: "Moderator", value: `<@${ms.moderatorId}>`, inline: false } as APIEmbedField)
						]
					}
					if (!interaction.isRepliable()) return;
					await interaction.reply({ embeds: [embed], ephemeral: true })
				}

				if (!interaction.isChatInputCommand()) {
					await doIt(modStatus);
					return;
				};

				const command = client.commands.get(interaction.commandName);
				if (!(command.moderation_bypass)) {
					await doIt(modStatus);
					return;
				}
				
			}

			if (interaction.isButton()) {
				// Parse customId
				const customid = ((interaction as any).customId as string)
				// console.log(interaction, customid)
				if (customid.startsWith('accept_mksession|')) {
					const session: Session | null | undefined = await executionContext?.getSessionByJobId(customid.split('|')[1]);
					if (!session) return;

					// CREATE THE CHANNEL!!!!

					const forum: ForumChannel = (await client.channels.fetch(config.SessionForumChannelId) as ForumChannel);

					// download the thumbnail
					const filepath = await downloadFile(session.thumbnailUrl, `${tmpdir()}/rem-temp-${Date.now()}.png`);

					const join_session = new ButtonBuilder()
						.setLabel('Roblox')
						.setURL(session.gameUrl)
						.setStyle(ButtonStyle.Link);

					const row = new ActionRowBuilder()
						.addComponents(join_session);

					const ud = await getUserInfo(interaction.user.id)
					
					let embed: APIEmbed = {
						title: session.GameName,
						color: 0x00ff00,
						fields: [
							({name:"Job ID",value:session.JobId,inline:false} as APIEmbedField),
							({name:"IP Address",value:session.ServerIPAddress,inline:false} as APIEmbedField),
							({name:"Actor DID",value:`\`${ud.atprotoDid}\``,inline:false} as APIEmbedField),
							({name:"Actor",value:`\`@${ud.atprotoHandle}\``,inline:false} as APIEmbedField)
						]
					}

					addToLog("Session Accepted",{session: session, userWhoAccepted: interaction.user},0x00ff00)

					const thread: ThreadChannel = await forum.threads.create({
						name: `${session.JobId.slice(0,5)} - ${session.GameName.slice(0,30)}`,
						message: {
							files: [filepath],
							embeds: [embed],
							components: [row] as any
						},
						appliedTags: []
					});

					await session.AcceptSession(thread);
					await interaction.reply({ content: 'Accepted!', ephemeral: true });
					try {await interaction.message.delete()} catch {}

					setTimeout(() => {
						const instanceThing = `did:web:${config.RootURL
							.replace("http://","")
							.replace("https://","")
							.replace("/","/")
						}`
						// session.queueMessage("REM","ff0000",`Instance DID: ${instanceThing}`).catch(()=>{})
						session.queueMessage("REM","ff0000",`Session accepted by @${ud.atprotoHandle}\nActor DID: ${ud.atprotoDid}`).catch(()=>{});
					}, 5000);

					new Promise(async () => {
						await new Promise(f => setTimeout(f, 10000));
						fs.rmSync(filepath);
					})

					return;
				}
				if (customid.startsWith('reject_mksession|')) {
					let session: Session | null | undefined = await executionContext?.getSessionByJobId(customid.split('|')[1]);
					if (!session) return;

					executionContext?.deleteSessionByJobId(session.JobId)

					addToLog("Session Declined",{session: session, userWhoDeclined: interaction.user},0xff0000)

					await interaction.reply({ content: 'Declined', ephemeral: true });
					try {await interaction.message.delete()} catch {}

					return;
				}
				return;
			}

			if (!interaction.isChatInputCommand()) return;

			const command = client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`[REM/Bot:interactionHandler] No command matching "${interaction.commandName}" was found, something shady is going on!`);
				await interaction.reply({
					content: `[REM] Cannot find command in \`client.commands\`, something shady is going on!`,
					ephemeral: true
				})
				return;
			}

			try {
				await command.execute(interaction, executionContext);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: `REM encountered an error. If this persists, report this issue [on our GitHub](<https://github.com/ocbwoy3/rem>) unless this is a fork. \n\`\`\`\n${error}\n\`\`\``, ephemeral: true });
				} else {
					await interaction.reply({ content: `REM encountered an error. If this persists, report this issue [on our GitHub](<https://github.com/ocbwoy3/rem>) unless this is a fork. \n\`\`\`\n${error}\n\`\`\``, ephemeral: true });
				}
			}

		} catch(e_) {
			console.error(e_)
			if (interaction.isAutocomplete()) return;
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: `REM encountered an error. If this persists, report this issue [on our GitHub](<https://github.com/ocbwoy3/rem>) unless this is a fork. \n\`\`\`\n${e_}\n\`\`\``, ephemeral: true });
				} else {
					await interaction.reply({ content: `REM encountered an error. If this persists, report this issue [on our GitHub](<https://github.com/ocbwoy3/rem>) unless this is a fork. \n\`\`\`\n${e_}\n\`\`\``, ephemeral: true });
				}
			} catch {}
		}
	} catch {}
});