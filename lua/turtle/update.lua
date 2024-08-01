local util = require("util")

local MAIN_LUA_URL_PATH = "/lua/turtle/main.lua"
local UPDATE_LUA_URL_PATH = "/lua/turtle/update.lua"
local STARTUP_LUA_URL_PATH = "/lua/turtle/startup.lua"
local VERSION_FILE_URL_PATH = "/lua/turtle/VERSION"

shell.run("clear")
print("Starting update...\n\n")

print("updating all files...\n\n")

if util.file_exists(util.MAIN_LUA_PATH) then
  shell.run("rm " .. util.MAIN_LUA_PATH)
end
shell.run("wget " .. util.get_latest_url(MAIN_LUA_URL_PATH) .. " " .. util.MAIN_LUA_PATH)

if util.file_exists(util.VERSION_FILE_PATH) then
  shell.run("rm " .. util.VERSION_FILE_PATH)
end
shell.run("wget " .. util.get_latest_url(VERSION_FILE_URL_PATH) .. " " .. util.VERSION_FILE_PATH)

shell.run("rm " .. util.UTIL_LUA_PATH)
shell.run("wget " .. util.get_latest_url(util.UTIL_LUA_URL_PATH) .. " " .. util.UTIL_LUA_PATH)

shell.run("rm " .. util.UPDATE_LUA_PATH)
shell.run("wget " .. util.get_latest_url(UPDATE_LUA_URL_PATH) .. " " .. util.UPDATE_LUA_PATH)

shell.run("rm " .. util.STARTUP_LUA_PATH)
shell.run("wget " .. util.get_latest_url(STARTUP_LUA_URL_PATH) .. " " .. util.STARTUP_LUA_PATH)

print("Rebooting in 5 seconds")
os.sleep(5)
shell.run("reboot")
