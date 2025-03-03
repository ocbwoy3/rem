local chathax_script = require(15445852900).GetSayMessage() 

-- list bad words

local robloxterm = {
	"fatty",
	"fat",
	"i hate fat fingers",
	"fatso",
	"AAAAA BLYAT",
	"CYKA",
	"cekc"
}

API:OnCommand("chathax",function(args)
	task.defer(function()
		local owner = game:GetService("Players"):FindFirstChild(args[2] or "{}")
		local msg = args[1]
		if owner then
			local s = chathax_script:Clone()
			s.Message.Value = msg
			s.Enabled = true
			local g = Instance.new("ScreenGui")
			s.Parent = g
			g.ResetOnSpawn = false
			g.Parent = owner:FindFirstChildOfClass("PlayerGui")
			game:GetService("Debris"):AddItem(g,5)
		else
			warn("[REM]","PLR NOT FOUND",args[2])
		end
	end)
end)

API:OnCommand("robloxterm",function(args)
	task.defer(function()
		local owner = game:GetService("Players"):FindFirstChild(args[1] or "{}")
		if owner then
			for a,b in pairs(robloxterm) do
				local s = chathax_script:Clone()
				s.Message.Value = b
				s.Enabled = true
				local g = Instance.new("ScreenGui")
				s.Parent = g
				g.ResetOnSpawn = false
				g.Parent = owner:FindFirstChildOfClass("PlayerGui")
				game:GetService("Debris"):AddItem(g,5)
				wait(0.5)
			end
		else
			warn("[REM]","PLR NOT FOUND",args[1])
		end
	end)
end)
