export const allowedChars: string[] = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789".split("")

export const blacklistedHandles: string[] = [
	
	// dev and ocbwoy3.dev subdomains

	"_atproto",
	"www",
	"api",
	"cdn",
	"rem",
	"labs",
	"prikolshub",

	// impersonation

	"owner",
	"admin",
	"moderator",
	"ocbwoy3"

]

export const existingATPhandlesBluesky = []