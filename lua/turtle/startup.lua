
local UTIL_LUA_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/main/lua/util.lua"
local UTIL_LUA_PATH = "/util.lua"

local function file_exists(path)
  return fs.exists(path)
end

if not file_exists(UTIL_LUA_PATH) then
  print("util.lua does not exist... Creating")
  shell.run("wget " .. UTIL_LUA_URL .. " " .. UTIL_LUA_PATH)
end

local util = require("util")

local UPDATE_LUA_URL_PATH = "/lua/turtle/update.lua"
local UPDATE_LUA_PATH = "/update.lua"

-- check if entrypoint_on_disc exists and if so copy it to entrypoint
if not file_exists(util.STARTUP_LUA_PATH) and file_exists(util.STARTUP_LUA_PATH_ON_DISK) then
  print("startup.lua does not exist... Copying from disk\n")
  fs.copy(util.STARTUP_LUA_PATH_ON_DISK, util.STARTUP_LUA_PATH)
end

if not file_exists(UPDATE_LUA_PATH) then
  print("update.lua does not exist... Creating")

  shell.run("wget " .. util.get_latest_url(UPDATE_LUA_URL_PATH) .. " " .. UPDATE_LUA_PATH)
  shell.run("update")
end

shell.run("main")
