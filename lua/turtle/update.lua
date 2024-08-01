local util = require("util")

local MAIN_LUA_URL_PATH = "/lua/turtle/main.lua"
local UPDATE_LUA_URL_PATH = "/lua/turtle/update.lua"
local STARTUP_LUA_URL_PATH = "/lua/turtle/startup.lua"

local MAIN_LUA_PATH = "/main.lua"

if util.file_exists(MAIN_LUA_PATH) then
  print("main.lua exists... Updating\n")
  shell.run("rm " .. MAIN_LUA_PATH)
end

shell.run("clear")
print("Starting update...\n\n\n")

print("Removing all files...\n\n")
shell.run("rm " .. util.UTIL_LUA_PATH)
shell.run("rm " .. util.UPDATE_LUA_PATH)
shell.run("rm " .. util.STARTUP_LUA_PATH)



print("Downloading all files...\n\n")
shell.run("wget " .. util.get_latest_url(MAIN_LUA_URL_PATH) .. " " .. MAIN_LUA_PATH)
shell.run("wget " .. util.get_latest_url(UPDATE_LUA_URL_PATH) .. " " .. util.UPDATE_LUA_PATH)
shell.run("wget " .. util.get_latest_url(STARTUP_LUA_URL_PATH) .. " " .. util.STARTUP_LUA_PATH)

print("Rebooting in 5 seconds")
os.sleep(5)
shell.run("reboot")
