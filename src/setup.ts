import { generateKeySync } from "crypto";
import { writeFileSync } from "fs";
import { generateAPIKey } from "secload";

function printREMName() {
	
	console.clear();
	
	console.log(` _____  ______ __  __ `);
	console.log(`|  __ \\|  ____|  \\/  |`);
	console.log(`| |__) | |__  | \\  / |`);
	console.log(`|  _  /|  __| | |\\/| |`);
	console.log(`| | \\ \\| |____| |  | |`);
	console.log(`|_|  \\_|______|_|  |_|`);
	console.log("");

}

async function ask(what: string, note?:string): Promise<string> {
	console.log(what);
	if (note) { console.log(`(${note})`) }
	return await new Promise((resolve, reject)=>{
		const readline = require('readline').createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		try {
			readline.question('> ', (res: string) => {
				readline.close();
				console.log('');
				resolve(res);
			});
		} catch {
			readline.close();
			reject(1);
		}
	}) as string
}

function makeid(len: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < len) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

console.log(makeid(5));

async function dotEnv(): Promise<void> {
	const prikolshub_sk = makeid(20)
	
	const discord: string = await ask("Enter your bot's token:");
	const discordApp: string = await ask("Enter your bot's App ID:");
	const groqKey: string = await ask("Enter your Groq API key:","https://console.groq.com/keys");
	
	let secload_key = "";
	try {
		secload_key = await generateAPIKey(64);
	} catch (e_) {
		console.warn("Failed to generate SecLoad API key. It's likely that your IP address owns more than 10 of them. What the fuck?");
		secload_key = `"${await ask("You'll have to input this shit manually:")}"`;
	}

	console.warn("");
	console.warn("     _______      _________      _____       ______     _ ");
	console.warn("    / _____ \\    |____ ____|    / ___ \\     | ____ \\   | |");
	console.warn("   / /     \\_\\       | |       / /   \\ \\    | |   \\ \\  | |");
	console.warn("   | |               | |      / /     \\ \\   | |   | |  | |");
	console.warn("   \\ \\______         | |      | |     | |   | |___/ /  | |");
	console.warn("    \\______ \\        | |      | |     | |   |  ____/   | |");
	console.warn("           \\ \\       | |      | |     | |   | |        | |");
	console.warn("    _      | |       | |      \\ \\     / /   | |        |_|");
	console.warn("   \\ \\_____/ /       | |       \\ \\___/ /    | |         _ ");
	console.warn("    \\_______/        |_|        \\_____/     |_|        |_|");
	console.warn("");
	console.warn("DO NOT USE YOUR PERSONAL ROBLOX ACCOUNT! By using your main account, if someone reads the .env file, they can gain easy entry into your account.");
	console.warn("You should use an alt-account or a throwaway account. You can make one or log into an existing account by making an SSH connection to this machine with the -D flag, then access roblox.com with a SOCKS4 or a SOCKS5 proxy.");
	console.warn("Read more about keeping your Roblox account safe at https://www.roblox.com/info/account-safety");
	console.warn("");

	const roblosecurity: string = await ask("Enter your .ROBLOSECURITY cookie:");
	
	/*
	if (!roblosecurity.startsWith("_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_")) {
		console.clear()
		console.error("Your provided .ROBLOSECURTY cookie does not begin with the warning text. What the fuck?")
		process.exit(1)
	}
	*/

	let dotenv = `# This is an autogenerated enviorment file made with REM's setup script
TOKEN=${discord}
APP_ID=${discordApp}
ROBLOSECURITY=${roblosecurity}
PRIKOLSHUB_SK="${prikolshub_sk}"
SECLOAD_KEY=${secload_key}
SENTRY_DSN=SENTRY_DSN
GROQ_KEY="${groqKey}"
# You can put your own Sentry DSN here, however REM would work perfectly fine without it.

# Don't touch this unless you know what you're doing!
DATABASE_URL="file:./dev.db"
`;
	writeFileSync("./.env",dotenv);
	console.log("Successfully wrote to .env!");
}

async function configJson(): Promise<void> {
	console.log(`Please make sure you enable "Developer Mode" in your discord settings.\n`)
	const ownerId: string = await ask("Enter your Discord User ID:", "This will be used to grant you admin privileges.");
	const guildId: string = await ask("Enter your Server's ID:");
	const logId: string = await ask("Enter your log channel's ID:", "This will be used for storing logs. (Regular channel)");
	const requestId: string = await ask("Enter your session request channel's ID:", "This will be used for session requests. (Regular channel)");
	const forumId: string = await ask("Enter your session channel's ID:", "This will be used for sessions. (Forum channel)");
	const rootUrl: string = await ask("Enter the URL your REM instance is hosted:", "This will be used to point the script to your REM instance.)\nThis looks something like: https://yourdomainhere.tld - This supports IP addresses (HTTP-Only) and subdomains. (Do not end with a slash!)");
	const atprotoUrl: string = await ask("Enter the URL where usernames are gonna go:", "Kinda similar to Bluesky. WILL ONLY WORK WITH WILDCARD. For example with ocbwoy3.dev, put *.ocbwoy3.dev");

	const jd = JSON.stringify({
		"BotOwner": ownerId,
		"GuildId": guildId,
		"LogChannelId": logId,
		"SessionRequestsChannelId": requestId,
		"SessionForumChannelId": forumId,
		"Blacklist": {},
		"LogStartup": false,
		"RootURL": rootUrl,
		"atproto_url": atprotoUrl

	},undefined,"\t");
	
	writeFileSync("./config.json",jd);
	console.log("Successfully wrote to config.json!");
}

new Promise(async()=>{
	printREMName()
	console.log("Welcome to the REM Setup Helper! This script will help you set up the REM remote admin.");
	console.log("You need to meet these prerequisites:\n - A Discord Server\n - A Discord Bot\n - Your own Domain");
	console.log("If you already set up REM before, feel free to press CTRL+C, unless the default config updated.");
	console.log("");
	await dotEnv();
	printREMName();
	await configJson();
})