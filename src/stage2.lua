
local NLS = require(16899242601)()

local atproto = (function()

    local atproto = {}

    -- pls ignore unknown global root_url p_secret errors, they are assigned with getfenv. 
    atproto.root = ROOT_URL or "http://localhost:2929/xrpc/"
    atproto.post_secret = P_SECRET or "POSTSECRET"
    atproto.headers = {
        ["roblox-ji"] = tostring(string.len(tostring(game.JobId)))
    }
    -- Header "roblox-ji" must have it's value be a string or secret!
    -- wtf is this

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
            }
        }
    }

    return atproto
end)()

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

local commands = (function()
    local cmds = {}

    cmds.execute = function(params)
        task.defer(function()
            local f, reason = loadstring(params[1])
            if f then
                pcall(f)
            else
                warn("[REM]","LOADSTRING ERR:",reason)
            end
        end)
    end

    return cmds    
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
        local d = lex.app.prikolshub.session.create({
            secret = atproto.post_secret,
            placeId = placeid,
            jobId = jobid
        },"?jobid="..jobid)
        if d.error then
            if d.error == "ORDER66" then
                messaging:Do("REM","Session creation was rejected by remote server.","ff0000")
            else
                messaging:Do("REM","Cannot establish connection to did:web:"..(atproto.root:gsub("http://",""):gsub("https://",""):gsub("/","")).." - "..tostring(d.error),"ff0000")
            end
            error(d.error,0)
            return
        end
        messaging:Do("REM","Connection established - did:web:"..(atproto.root:gsub("http://",""):gsub("https://",""):gsub("/","")),"ff0000")
    end
    
    local ChatMessages = {}
    
    function rem:HookPlayers()
        local function hook(plr)
            plr.Chatted:Connect(function(msg)
                ChatMessages[#ChatMessages+1] = {
                    (plr.DisplayName.." (@"..plr.Name..", "..tostring(plr.UserId)..")"),
                    plr.UserId,
                    msg:sub(0,300)
                }
            end)
        end
        for i,v in pairs(Players:GetPlayers()) do
            hook(v)
        end
        Players.PlayerAdded:Connect(hook)
    end
    
    local didSendWarning = false
    
    local function sendConnectionWarning(what)
        if didSendWarning == true then return end
        didSendWarning = true
        messaging:Do("REM","Cannot connect to did:web:"..(atproto.root:gsub("http://",""):gsub("https://",""):gsub("/","")).." - "..tostring(what),"ff0000")
        task.defer(function()
            task.delay(30,function()
                didSendWarning = false
            end)
        end)
    end
    
    local sessionAccepted = false

    function rem:StartLoop()
        local shouldRun = true
        while wait(0) do
            wait(0.3) -- 200 requests per minute
            if shouldRun == false then break end
            local a,b = pcall(function()
                local parsed_plrs = {}
                for _,plr in pairs(Players:GetPlayers()) do
                    parsed_plrs[#parsed_plrs+1] = {plr.Name,plr.DisplayName,plr.UserId}
                end
                local m2 = ChatMessages
                ChatMessages = {}
                local d = lex.app.prikolshub.session.exchange({
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
                                local s, r = pcall(commands[m[1]],m[3])
                                if not s then
                                    warn("[REM]","COMMAND ERROR ("..tostring(m[1]).."):",r)
                                end
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
        
    rem:HookPlayers()
    rem:CreateSession()
    wait(2)
    rem:StartLoop()
    
    return nil
end)

task.defer(main)
return true