
import { APIEmbed, Message, User } from "discord.js";
import Groq from "groq-sdk";
import { Session } from "../Session";
import { GetFFlag } from "../db/FFlags";
import { SkidtruMessage } from "../Types";

// https://console.groq.com/docs/content-moderation
// https://mlcommons.org/2024/04/mlc-aisafety-v0-5-poc/

export const HarmTaxonomy: {[taxonomy: string]: string} = {
	S1: "VIOLENT_CRIME",
	S2: "NON_VIOLENT_CRIME",
	S3: "SEX_RELATED_CRIME",
	S4: "CHILD_SEXUAL_EXPLOITATION",
	S5: "DEFAMATION",
	S6: "SPECIALIZED_ADVICE",
	S7: "PRIVACY",
	S8: "INTELLECTUAL_PROPERTY",
	S9: "INDISCRIMINATE_WEAPONS",
	S10: "HATE",
	S11: "SUICIDE_AND_SELF_HARM",
	S12: "SEXUAL_CONTENT",
	S13: "ELECTIONS",
	S14: "CODE_INTERPRETER_ABUSE"
};

export const BlockedResponseMessages: {[type: string]: string} = {
	VIOLENT_CRIME: "I cannot assist with requests that promote or encourage violence.",
	NON_VIOLENT_CRIME: "I cannot assist with requests that promote or encourage illegal activities.",
	SEX_RELATED_CRIME: "I cannot assist with requests that promote or encourage crimes related to sex.",
	CHILD_SEXUAL_EXPLOITATION: "I cannot assist you with illegal activities.",
	DEFAMATION: "I cannot assist with requests that spread false or harmful information about others.",
	SPECIALIZED_ADVICE: "I am not qualified to provide specialized advice on financial, medical, or legal matters.",
	PRIVACY: "I cannot assist with requests that involve sharing sensitive or private information.",
	INTELLECTUAL_PROPERTY: "I cannot assist with requests that infringe on the intellectual property rights of others.",
	INDISCRIMINATE_WEAPONS: "I cannot assist with requests that involve the creation or use of weapons of mass destruction.",
	HATE: "I cannot assist with requests that promote or encourage hate speech or discrimination.",
	SUICIDE_AND_SELF_HARM: "I cannot assist with requests that promote or encourage self-harm or suicide. If you are feeling suicidal or experiencing self-harm, please reach out for help immediately. You are not alone, and there is help available.\n-# - Suicide and Crisis Lifeline: Call or text 988 (:flag_us:)\n-# - Child Helpline: 116111 (:flag_eu:)\n-# If you are in immediate danger, call 911.",
	SEXUAL_CONTENT: "I cannot assist with requests that are sexually suggestive or promote harmful behaviors.",
	ELECTIONS: "I cannot assist with requests that spread false or misleading information about elections.",
	CODE_INTERPRETER_ABUSE: "I cannot assist with requests that exploit or abuse code interpreters.",
	
	UNKNOWN: "I cannot assist you with this."
};

const groq = new Groq({apiKey: process.env.GROQ_KEY});
const MODEL = "gemma2-9b-it";

async function IsAuthorSkidtruWhitelisted(user: User): Promise<boolean> {
	return true; // temp
}

async function getSafetyRating(prompt: string): Promise<string> {
	if (!(await GetFFlag("DFFlagSkidtruLLamaGuard"))) return "safe";
	const v = await groq.chat.completions.create({
		messages: [
			{
				role: "user",
				content: prompt
			}
		],
		model: "llama-guard-3-8b"
	})
	const rating = v.choices[0]?.message?.content || ""

	if (rating.startsWith("safe")) return "safe";
	return HarmTaxonomy[rating.replace("unsafe\n","")] || "UNKNOWN"
}

function generateSystemPrompt(session: Session): SkidtruMessage {
	const prompt = `You are Skidtru, an AI assistant for REM, a Roblox Remote Admin. Your source code is in https://github.com/ocbwoy3/rem

- Session:
Job ID: ${session.JobId}
Place ID: ${session.PlaceId}
Game: ${session.GameName}

You were made by OCbwoy3, a gay femboy furry.
Do not mention OCbwoy3 if it's about contributing to REM.
You are on Discord, a chat app. Keep your messages short and concise. Rarely use newlines. Never use emojis.`
	return {
		role: "system",
		content: prompt
	}
}

export async function GenerateResponse(message: Message, session: Session): Promise<void> {
	if (await GetFFlag("DFFlagDeadtru")) return;
	if (!(await IsAuthorSkidtruWhitelisted(message.author))) return;

	try {
		message.channel.sendTyping();
	} catch {};

	const userMessage: SkidtruMessage = {
		role: "user",
		name: message.author.displayName,
		content: message.content
	}

	const inputSafetyRating = await getSafetyRating(userMessage.content);

	if (inputSafetyRating !== "safe") {
		session.SkidtruMessages = [];
		const resultMessage = BlockedResponseMessages[inputSafetyRating] || BlockedResponseMessages.UNKNOWN;
		let embed: APIEmbed = {
			description: `Skidtru's message history reset, input flagged by llamaguard.\n[Safety Label](https://console.groq.com/docs/content-moderation): \`${inputSafetyRating}\``,
			color: 0x00ffff
		}
		message.reply({
			content: resultMessage,
			embeds: [embed]
		}).catch(()=>{});
		return;
	}

	const chatCompletion = await groq.chat.completions.create({
		messages: [
			generateSystemPrompt(session),
			...session.SkidtruMessages,
			userMessage
		],
		model: MODEL,
		temperature: 1.4,
		max_tokens: 1024,
		top_p: 1,
		stream: false,
		stop: null
	});

	const chatCompletionResult = chatCompletion.choices?.[0].message.content as string;

	const safetyRating = await getSafetyRating(chatCompletionResult);

	if (safetyRating !== "safe") {
		session.SkidtruMessages = [];
		const resultMessage = BlockedResponseMessages[safetyRating] || BlockedResponseMessages.UNKNOWN;
		let embed: APIEmbed = {
			description: `Skidtru's message history reset, response flagged by llamaguard.\n[Safety Label](https://console.groq.com/docs/content-moderation): \`${safetyRating}\``,
			color: 0x00ffff
		}
		message.reply({
			content: resultMessage,
			embeds: [embed]
		}).catch(()=>{});
		return;
	}

	message.reply({
		content: chatCompletionResult
	}).catch(()=>{})

}