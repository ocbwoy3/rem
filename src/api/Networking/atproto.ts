import { LexiconDoc } from '@atproto/lexicon'
import * as xrpc from '@atproto/xrpc-server'
import express, { Router } from 'express'
import path from 'node:path';
import * as fs from 'node:fs';
import * as LexiconRegistrate from './LexiconRegistrate';

export async function loadLexicons() {
	// console.log(__dirname)
	const lexiconFolder = path.join(__dirname, '..', '..', 'lexicons');
	const lexiconFiles = fs.readdirSync(lexiconFolder).filter(file => file.endsWith('.js'));
	
	for (const file of lexiconFiles) {
		const filePath = path.join(lexiconFolder,file)
		try {
			const lexicon = require(filePath);
		} catch(e_) {
			console.error(e_)
			console.warn(`[Networking/atproto:loadLexicons] Failed to load lexicon from file: ${filePath}`);
		}
	}
}

export function makeServer(): xrpc.Server {
	const server: xrpc.Server = xrpc.createServer(LexiconRegistrate.getLexicons())
	const lexicons = LexiconRegistrate.getMethods()
	for (let lexicon in lexicons) {
		server.method(lexicon,lexicons[lexicon])
		console.log(`[Networking/atproto] Loaded lexicon ${lexicon}`);
	}
	return server
}