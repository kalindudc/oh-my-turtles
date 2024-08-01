local STARTUP_LUA_PATH = "/startup.lua"
local STARTUP_LUA_PATH_ON_DISK = "/disk/startup.lua"

local UPDATE_LUA_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/main/lua/update.lua"
local UPDATE_LUA_PATH = "/update.lua"

local function file_exists(path)
  local file = io.open(path, "r")
  if file then
    io.close(file)
    return true
  else
    return false
  end
end

-- check if entrypoint_on_disc exists and if so copy it to entrypoint
if not file_exists(STARTUP_LUA_PATH) and file_exists(STARTUP_LUA_PATH_ON_DISK) then
  print("startup.lua does not exist... Copying from disk")
  fs.copy(STARTUP_LUA_PATH_ON_DISK, STARTUP_LUA_PATH)
end


if not file_exists(UPDATE_LUA_PATH) then
  print("update.lua does not exist... Creating")
  shell.run("wget " .. UPDATE_LUA_URL .. " " .. UPDATE_LUA_PATH)
  shell.run("update")
end

shell.run("main")
