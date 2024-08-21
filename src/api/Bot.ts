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
	ActivityType
} from "discord.js";
import { CommandModuleExports } from "./Types";
import * as fs from "node:fs";
import * as path from "node:path";
import { REMRuntime } from "./REMCore";
import { Blacklist } from "../../config.json";
import { Session } from "./Session";
import { downloadFile } from "./Utility";
import { tmpdir } from "node:os";
import { message } from "noblox.js";
import { checkUserModStatus, ModerationReport } from "./db/Prisma";

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
		status: 'dnd',
		activities: [
			{
				name: "REM, the real thing",
				type: ActivityType.Playing
			}
		]
	}
}) as Client)

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
		
		await ses.queueMessage(
			(message.author.displayName.slice(0,50) || "rem_undefined_nick"),
			(message.member?.displayHexColor.slice(1) || "ff0000"),
			cont
		)
	} catch(e_) {
		console.error(e_)
	}
})

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	try {
		try {

			if (interaction.isAutocomplete()) return;

			const modStatus: ModerationReport|null = await checkUserModStatus(interaction.user.id)

			if (modStatus != null) {

				async function doIt(ms: ModerationReport) {
					// Twitch's "Banned from ..." UX is poorly made, I guess. So remake it!

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

					const thread: ThreadChannel = await forum.threads.create({
						name: `${session.JobId.slice(0,5)} - ${session.GameName.slice(0,30)}`,
						message: {
							content: 
								`# [\`${session.GameName}\`]( <${session.gameUrl}> )
								**Job Id:** \`${session.JobId}\`
								**Server IP:** \`${session.ServerIPAddress}\``.replace(/\t/g,''),
							files: [filepath]
						},
						appliedTags: []
					});

					await session.AcceptSession(thread);
					await interaction.reply({ content: 'Accepted!', ephemeral: true });
					try {await interaction.message.delete()} catch {}

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
					await interaction.followUp({ content: `\`\`\`\n${error}\n\`\`\``, ephemeral: true });
				} else {
					await interaction.reply({ content: `\`\`\`\n${error}\n\`\`\``, ephemeral: true });
				}
			}

		} catch(e_) {
			console.error(e_)
			if (interaction.isAutocomplete()) return;
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: `\`\`\`\n${e_}\n\`\`\``, ephemeral: true });
				} else {
					await interaction.reply({ content: `\`\`\`\n${e_}\n\`\`\``, ephemeral: true });
				}
			} catch {}
		}
	} catch {}
});