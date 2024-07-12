// SecLoad 

import { SecloadClient } from 'secload';

export const client = new SecloadClient()
client.login(process.env.SECLOAD_KEY as string)

export async function uploadPrikolsHub() {
    try {
        await client.createScript('prikolshub','-- testing')
    } catch {}
    await client.overwriteScript('prikolshub',
        `
        -- PrikolsHub Loader
        const url = "https://prikolshub.ocbwoy3.dev/xrpc/loader.prikolshub.secload.stage2"

        

        `.trim().replace(/\t/g,'').trim()
    )
}

export async function generateRequire(username:string) {
    const require = await client.generateKey('prikolshub_ts',5,username)
}