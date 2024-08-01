local STARTUP_LUA_PATH = "/startup.lua"
local STARTUP_LUA_PATH_ON_DISK = "/disk/startup.lua"

local OH_MY_TURTLES_API_URL = "https://api.github.com/repos/kalindudc/oh-my-turtles/commits"
local OH_MY_TURTLES_REPO_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/"

local UPDATE_LUA_URL_PATH = "/lua/update.lua"
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

local function get_latest_url(url_path)
  print("Getting latest commit sha...")
  local repo_updates = http.get(OH_MY_TURTLES_API_URL).readAll()
  local latest_commit_sha = textutils.unserializeJSON(repo_updates)[1]["sha"]
  print("Latest commit sha: " .. latest_commit_sha)

  return OH_MY_TURTLES_REPO_URL .. latest_commit_sha .. url_path
end

-- check if entrypoint_on_disc exists and if so copy it to entrypoint
if not file_exists(STARTUP_LUA_PATH) and file_exists(STARTUP_LUA_PATH_ON_DISK) then
  print("startup.lua does not exist... Copying from disk\n")
  fs.copy(STARTUP_LUA_PATH_ON_DISK, STARTUP_LUA_PATH)
end

if not file_exists(UPDATE_LUA_PATH) then
  print("update.lua does not exist... Creating")

  shell.run("wget " .. get_latest_url(UPDATE_LUA_URL_PATH) .. " " .. UPDATE_LUA_PATH)
  shell.run("update")
end

shell.run("main")
