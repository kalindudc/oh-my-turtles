local OH_MY_TURTLES_API_URL = "https://api.github.com/repos/kalindudc/oh-my-turtles/commits"
local OH_MY_TURTLES_REPO_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/"

local STARTUP_LUA_PATH = "/startup.lua"
local STARTUP_LUA_PATH_ON_DISK = "/disk/startup.lua"

local UPDATE_LUA_PATH = "/update.lua"

local UTIL_LUA_URL_PATH = "/lua/util.lua"
local UTIL_LUA_PATH = "/util.lua"



local _M = {
  OH_MY_TURTLES_API_URL = OH_MY_TURTLES_API_URL,
  OH_MY_TURTLES_REPO_URL = OH_MY_TURTLES_REPO_URL,
  STARTUP_LUA_PATH = STARTUP_LUA_PATH,
  STARTUP_LUA_PATH_ON_DISK = STARTUP_LUA_PATH_ON_DISK,
  UPDATE_LUA_PATH = UPDATE_LUA_PATH,
  UTIL_LUA_PATH = UTIL_LUA_PATH,
}

function _M.file_exists(path)
  local file = io.open(path, "r")
  if file then
    io.close(file)
    return true
  else
    return false
  end
end

function _M.get_latest_commit_sha()
  local repo_updates = http.get(OH_MY_TURTLES_API_URL).readAll()
  return textutils.unserializeJSON(repo_updates)[1]["sha"]
end

function _M.get_latest_url(url_path)
  return OH_MY_TURTLES_REPO_URL .. _M.get_latest_commit_sha() .. url_path
end

return _M
