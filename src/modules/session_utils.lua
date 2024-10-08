API:OnCommand("execute",function(args)
	task.defer(function()
		local owner = game:GetService("Players"):FindFirstChild(args[2] or "{}")
		local success, reason = loadstring(args[1])
		if success then
			getfenv(success).owner = owner
			getfenv(success).API = nil
			getfenv(success).atproto = nil
			getfenv(success).ROOT_URL = nil
			getfenv(success).P_SECRET = nil
			getfenv(success).script = Instance.new("Script")
			success()
		else
			warn("[REM]","LOADSTRING ERROR",reason)
		end
	end)
end)

API:OnCommand("kick",function(args)
	task.defer(function()
		local owner = game:GetService("Players"):FindFirstChild(args[1] or "{}")
		local reason = args[2]
		if owner then
			owner:Kick(reason)
		end
	end)
end)