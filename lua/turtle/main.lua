local util = require("util")

local VERSION_FILE_URL_PATH = "/lua/turtle/VERSION"


local function get_version()
  return http.get(util.get_latest_url(VERSION_FILE_URL_PATH)).readAll():gsub("\n$", "")
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
