local util = require("util")

local VERSION_FILE_URL_PATH = "/lua/turtle/VERSION"

local function get_version()
  return http.get(util.get_latest_url(VERSION_FILE_URL_PATH)).readAll():gsub("\n$", "")
end

local function get_current_version()
  if util.file_exists(util.VERSION_FILE_PATH) then
    return fs.open(util.VERSION_FILE_PATH, "r").readAll():gsub("\n$", "")
  end

  return "-1"
end

local function check_and_load_new_version(current_version)
  local new_version = get_version()

  if new_version ~= current_version then
    print("New version available: " .. new_version .. "\n\n")
    print("Updating in 5 secods...")
    os.sleep(5)
    shell.run("update")
  end
end

local current_version = get_current_version()
print ("Current version: " .. current_version)


local id = os.getComputerID()
local world_id = "test_world" -- TODO: figure out how to generate

local ws = assert(http.websocket("wss://localhost:8080"))
local payload = {
  type = 'register',
  clientType = 'machine',
  id = id,
  payload = {
    type = 'turtle',
    worldId = world_id
  }
}

ws.send(textutils.serialise(payload)) -- Send a message

local packet = ws.receive()
print(packet)

ws.close()

local received = textutils.unserialiseJSON(packet)
os.setComputerLabel(received.name)
