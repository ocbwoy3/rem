local NLS = require(16899242601)()

local messaging = (function()
	local messageModes = {}

	local deps = require(15445852900)

	local modes = {
		Chat = function(PrefixText,Text,PrefixColor)
			pcall(function()
				deps.SendMessage(PrefixText," "..Text,PrefixColor)
			end)
		end,
		Hint = function(PrefixText,Text,PrefixColor) -- Fix VSB2 preventing SetCore, temp solution
			pcall(function()
				local h = Instance.new("Hint")
				h.Text = "[ "..PrefixText.." ] "..Text
				h.Parent = game:GetService("Workspace")
				task.delay(5,function()
					pcall(function()
						h:Destroy()
					end)
				end)
			end)
		end,
		Message = function(PrefixText,Text,PrefixColor) -- same as hint
			pcall(function()
				local h = Instance.new("Message")
				h.Text = "[ "..PrefixText.." ]\n"..Text
				h.Parent = game:GetService("Workspace")
				task.delay(5,function()
					pcall(function()
						h:Destroy()
					end)
				end)
			end)
		end,
		SkidShield = function(PrefixText,Text,PrefixColor) -- same as hint
			pcall(function()
				deps.SkidShield(PrefixText,Text,PrefixColor)
			end)
		end
	}

	messageModes.current_chatmode = "Chat"

	local force_skidshield_on_vsb = false

	local isvsb2 = false
	if force_skidshield_on_vsb == true then
		pcall(function()
			local gameinfo = game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId, Enum.InfoType.Asset)
			if gameinfo.Name:lower():find("void script builder") then
				isvsb2 = true
			end
		end)
	end

	function messageModes:Do(pfx,txt,pfxc)
		if isvsb2 == true then
			pcall(modes.SkidShield,pfx,txt,pfxc)
		else
			pcall(function()
				modes[messageModes.current_chatmode](pfx,txt,pfxc)
			end)
		end
	end

	function messageModes:Set(funcName)
		local methodv = modes[funcName] or nil
		if methodv then messageModes.current_chatmode = funcName end
	end

	return messageModes
end)()

local atproto = (function()

	local atproto = {}

	-- ignore these errors :3
	atproto.root = ROOT_URL or "http://localhost:2929/xrpc/"
	atproto.post_secret = P_SECRET or "POSTSECRET"
	atproto.headers = {
		["roblox-ji"] = tostring(string.len(tostring(game.JobId))),
		["token"] = atproto.post_secret
	}

	local HttpService = game:GetService("HttpService")

	local lex = {
		get = function(lexicon,raw)
			if not raw then raw = false end
			return function(params)
				local a, retval = pcall(function()
					return HttpService:GetAsync(atproto.root..lexicon..(params or ""),true,atproto.headers)
				end)
				if not a then
					error(retval,0)
				end
				if raw == true then
					return retval
				else
					return HttpService:JSONDecode(retval)
				end
			end
		end,
		post = function(lexicon, raw)
			if not raw then raw = false end
			return function(data,params)
				local pd = HttpService:JSONEncode(data)
				local a, retval = pcall(function()
					return HttpService:PostAsync(atproto.root..lexicon..(params or ""),pd,Enum.HttpContentType.ApplicationJson,true,atproto.headers)
				end)
				if not a then
					error(retval,0)
				end
				if raw == true then
					return retval
				else
					return HttpService:JSONDecode(retval)
				end
			end
		end
	}

	atproto.lex = {
		loader = {
			rem = {
				modules = {
					list = lex.get("loader.rem.modules.list"),
					download = lex.get("loader.rem.modules.download",true)
				}
			}
		},
		app = {
			rem = {
				session = {
					create = lex.post("app.rem.session.create"),
					exchange = lex.post("app.rem.session.exchange"),
					getInfo = lex.get("app.rem.session.getInfo")
				}
			}
		},
		com = {
			atproto = {
				server = {
					describeServer = lex.get("com.atproto.server.describeServer")
				}
			}
		}
	}

	return atproto
end)()

local API = (function()
	local api = {
		_OnCommandEvent = Instance.new("BindableEvent")
	}

	function api:LoadAddons()
		local allModules = atproto.lex.loader.rem.modules.list()
		for a,b in pairs(allModules) do
			local success,reason = pcall(function()

				local success, fileContent = pcall(function()
					return atproto.lex.loader.rem.modules.download("?file="..tostring(b))
				end)
				if not success then
					messaging:Do("REMAddonLoader","atp lexicon loader.rem.modules.download?file="..tostring(b).." errored - "..tostring(fileContent),"ff0000")
					return
				end

				-- print(fileContent)
				local func, err = loadstring(fileContent)
				if not func then error(err,0) end

				getfenv(func).atproto = atproto
				getfenv(func).API = api
				getfenv(func).messaging = nil
				getfenv(func).main = nil
				getfenv(func).script = script

				func()
			end)
			if not success then
				messaging:Do("REMAddonLoader","Failed to load addon "..tostring(b).." - "..tostring(reason),"ff0000")
				warn("[REMAddonLoader]","AddonLoader Error ("..b.."):",reason)
			end
		end
	end

	function api:OnCommand(name,func)
		print("[REMAddonLoader]","Registered callback for command:",name)
		api._OnCommandEvent.Event:Connect(function(commandName,args)
			if commandName == name then
				task.defer(function()
					local success, reason = pcall(func,args)
					if not success then
						warn("[REM]","OnCommand Error ("..name.."):",reason)
					end
				end)
			end
		end)
	end

	return api

end)()

local main = (function()

	local lex = atproto.lex
		
	-- Config
	
	local placeid = game.PlaceId -- 69420
	local jobid = game.JobId --"00000000-0000-0000-000000000000"
	
	local Players = game:GetService("Players")
	
	-- Define the Interface
	
	local rem = {}
	
	function rem:CreateSession()
		local d = lex.app.rem.session.create({
			secret = atproto.post_secret,
			placeId = placeid,
			jobId = jobid
		},"?jobid="..jobid)
		if d.error then
			if d.error == "ORDER66" then
				messaging:Do("REM","Session creation was rejected by remote server.","ff0000")
			else
				messaging:Do("REM","Cannot connect to did:web:"..(atproto.root:gsub("http://",""):gsub("https://",""):gsub("/xrpc",""):gsub("/","")).." - "..tostring(d.error),"ff0000")
			end
			error(d.error,0)
			return
		end
		messaging:Do("REM","Connection Established - did:web:"..(atproto.root:gsub("http://",""):gsub("https://",""):gsub("/xrpc",""):gsub("/","")),"ff0000")
	end
	
	local ChatMessages = {}
	
	function rem:HookPlayers()
		local function hook(plr: Player)
			plr.Chatted:Connect(function(msg)
				ChatMessages[#ChatMessages+1] = {
					(plr.DisplayName.." (@"..plr.Name..", "..tostring(plr.UserId)..")"),
					plr.UserId,
					msg:gsub(">","​>"):gsub("@","@​"):gsub(":",":​"):gsub("http:​//","http​://"):gsub("https:​//","https​://"):sub(0,300)
				}
			end)
			local con
			con = plr.Changed:Connect(function(prop)
				if prop == "Parent" and plr.Parent ~= Players then
					con:Disconnect()
					ChatMessages[#ChatMessages+1] = {
						"REM",
						1,
						"> **"..(plr.DisplayName.." (@"..plr.Name..", "..tostring(plr.UserId)..")").."** left the game."
					}
				end
			end)
		end
		for i,v in pairs(Players:GetPlayers()) do
			task.defer(hook,v)
		end
		Players.PlayerAdded:Connect(function(plr)
			ChatMessages[#ChatMessages+1] = {
				"REM",
				1,
				"> **"..(plr.DisplayName.." (@"..plr.Name..", "..tostring(plr.UserId)..")").."** joined the game."
			}
			task.defer(hook,plr)
		end)
	end
	
	local didSendWarning = false
	
	local function sendConnectionWarning(what)
		if didSendWarning == true then return end
		didSendWarning = true
		messaging:Do("REM","Connection Failed: "..tostring(what),"ff0000")
		task.defer(function()
			task.delay(30,function()
				didSendWarning = false
			end)
		end)
	end
	
	local sessionAccepted = false

	game:BindToClose(function()
		ChatMessages[#ChatMessages+1] = {
			"REM",
			1,
			"> Server stopped! (BindToClose)"
		}
		wait(10)
	end)
	

	function rem:StartLoop()
		local shouldRun = true
		while wait(0) do
			wait(0.3) -- 200 requests per minute
			if shouldRun == false then break end
			local a,b = pcall(function()
				local parsed_plrs = {}
				for _,plr in pairs(Players:GetPlayers()) do
					parsed_plrs[#parsed_plrs+1] = {plr.DisplayName,plr.Name,plr.UserId}
				end
				local m2 = ChatMessages
				ChatMessages = {}
				local d = lex.app.rem.session.exchange({
					secret = atproto.post_secret,
					messages = m2,
					players = parsed_plrs
				},"?jobid="..jobid)
				if d.error then
					if d.error == "SESSION_NOT_FOUND" then
						if sessionAccepted == false then
							messaging:Do("REM","Session was declined by remote server.","ff0000")
						else
							messaging:Do("REM","Session closed.","ff0000")
						end
						shouldRun = false
						return
					end
					if d.error == "KILL_REM" then
						messaging:Do("REM","Request was rejected by remote server.","ff0000")
						shouldRun = false
						return
					end
					return
				end
				
				if sessionAccepted == false then
					sessionAccepted = true
					messaging:Do("REM","Session accepted!","ff0000")
				end

				pcall(function()
					
					--// Process Stuff
					
					for _,m in pairs(d.messages) do
						if type(m[2])=="string" then
							messaging:Do(m[1],m[3],m[2])
						end
						if type(m[2])=="boolean" then
							task.spawn(function()
								API._OnCommandEvent:Fire(m[1],m[3])
							end)
						end
						
					end
				
				end)
			end)
			if not a then
				warn("uh oh...",b)
				sendConnectionWarning(b)
			end
		end
	end
	
	task.defer(pcall,atproto.lex.com.atproto.server.describeServer)

	-- Main
	
	API:LoadAddons()

	rem:HookPlayers()
	rem:CreateSession()
	wait(2)
	rem:StartLoop()
	
	return nil
end)

return main