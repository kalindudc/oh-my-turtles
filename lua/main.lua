local OH_MY_TURTLES_API_URL = "https://api.github.com/repos/kalindudc/oh-my-turtles/commits"
local OH_MY_TURTLES_REPO_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/"

local VERSION_FILE_URL_PATH = "/lua/VERSION"

local function get_latest_url(url_path)
  print("Getting latest commit sha...")
  local repo_updates = http.get(OH_MY_TURTLES_API_URL).readAll()
  local latest_commit_sha = textutils.unserializeJSON(repo_updates)[1]["sha"]
  print("Latest commit sha: " .. latest_commit_sha)

  return OH_MY_TURTLES_REPO_URL .. latest_commit_sha .. url_path
end

local function get_version()
  return http.get(get_latest_url(VERSION_FILE_URL_PATH)).readAll():gsub("\n$", "")
end

local current_version = get_version()
print ("Current version: " .. current_version)

local start_time = os.time("utc")
while true do
  local new_version = get_version()

  if new_version ~= current_version then
    local end_time = os.time("utc")
    local elapsed_time_in_seconds = (end_time * 3600) - (start_time * 3600)
    print("Elapsed time: " .. elapsed_time_in_seconds)

    print("New version available: " .. new_version)
    print("Updating...")
    shell.run("update")
  end

  os.sleep(1)
end
