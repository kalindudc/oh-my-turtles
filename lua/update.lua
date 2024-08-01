local MAIN_LUA_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/main/lua/main.lua"
local MAIN_LUA_PATH = "/main.lua"

local function file_exists(path)
  local file = io.open(path, "r")
  if file then
    io.close(file)
    return true
  else
    return false
  end
end

if file_exists(MAIN_LUA_PATH) then
  print("main.lua exists... Updating")
  shell.run("rm " .. MAIN_LUA_PATH)
end

print("Downloading main.lua")
shell.run("wget " .. MAIN_LUA_URL .. " " .. MAIN_LUA_PATH)
shell.run("reboot")
