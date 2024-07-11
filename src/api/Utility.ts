import { getPlayerThumbnail } from 'noblox.js';
import * as fs from 'node:fs';
import request from 'request';

const download = function(uri:string, filename:string, callback:any){
	request.head(uri, function(err, res, body){
		// console.log('content-type:', res.headers['content-type']);
		// console.log('content-length:', res.headers['content-length']);

		const file = fs.createWriteStream(filename);
		const req = request(uri);
		
		req.pipe((file as any));

		file.on('close', callback);
	});
};

export async function downloadFile(url:string,path:string): Promise<string> {
	return new Promise((resolve)=>{
		download(url,path,()=>{
			resolve(path);
		})
	})
}

let pfpCache: Map<string,string> = new Map()

export async function getProfilePicture(userid:string): Promise<string|undefined> {
	
	const cached = pfpCache.get(userid)
	if (cached) { return cached }
	
	try {
		const icon = (await getPlayerThumbnail([parseInt(userid)],'420x420','png',false,'headshot'))[0]
		
		if (!icon.imageUrl) return undefined;
		pfpCache.set(userid,icon.imageUrl)
		return icon.imageUrl

	} catch {}
	
	return undefined;
}