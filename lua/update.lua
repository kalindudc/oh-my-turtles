local OH_MY_TURTLES_API_URL = "https://api.github.com/repos/kalindudc/oh-my-turtles/commits"
local OH_MY_TURTLES_REPO_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/"

local MAIN_LUA_URL_PATH = "/lua/main.lua"
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

local function get_latest_url(url_path)
  print("Getting latest commit sha...")
  local repo_updates = http.get(OH_MY_TURTLES_API_URL).readAll()
  local latest_commit_sha = textutils.unserializeJSON(repo_updates)[1]["sha"]
  print("Latest commit sha: " .. latest_commit_sha)

  return OH_MY_TURTLES_REPO_URL .. latest_commit_sha .. url_path
end

if file_exists(MAIN_LUA_PATH) then
  print("main.lua exists... Updating\n")
  shell.run("rm " .. MAIN_LUA_PATH)
end

print("Downloading main.lua")
shell.run("wget " .. get_latest_url(MAIN_LUA_URL_PATH) .. " " .. MAIN_LUA_PATH)

print("Rebooting in 5 seconds")
os.sleep(5)
shell.run("reboot")
