local atproto = (function()

	local atproto = {}

	-- pls ignore unknown global root_url p_secret errors, they are assigned with getfenv. 
	atproto.root = ROOT_URL or "http://localhost:2929/xrpc/"
	atproto.post_secret = P_SECRET or "POSTSECRET"
	atproto.headers = {
		["roblox-ji"] = tostring(string.len(tostring(game.JobId)))
	}

	local HttpService = game:GetService("HttpService")

	local lex = {
		get = function(lexicon)
			return function(params)
				local a, retval = pcall(function()
					return HttpService:GetAsync(atproto.root..lexicon..(params or ""),true,atproto.headers)
				end)
				if not a then
					error(retval,0)
				end
				return HttpService:JSONDecode(retval)
			end
		end,
		post = function(lexicon)
			return function(data,params)
				local pd = HttpService:JSONEncode(data)
				local a, retval = pcall(function()
					return HttpService:PostAsync(atproto.root..lexicon..(params or ""),pd,Enum.HttpContentType.ApplicationJson,true,atproto.headers)
				end)
				if not a then
					error(retval,0)
				end
				return HttpService:JSONDecode(retval)
			end
		end
	}

	atproto.lex = {
		loader = {
			prikolshub = {
				modules = {
					listAll = lex.get("loader.prikolshub.modules.listAll")
				}
			}
		},
		app = {
			prikolshub = {
				session = {
					create = lex.post("app.prikolshub.session.create"),
					exchange = lex.post("app.prikolshub.session.exchange"),
					getInfo = lex.get("app.prikolshub.session.getInfo")
				}
			}
		},
		com = {
			atproto = {
				server = {
					describeServer = lex.get("com.atproto.server.describeServer")
				}
			},
			ocbwoy3 = {
				gbans = {
					getBans = lex.get("com.ocbwoy3.gbans.getBans")
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

	function api:OnCommand(name,func)
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

end)()