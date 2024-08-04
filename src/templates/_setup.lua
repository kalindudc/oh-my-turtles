local pretty = require "cc.pretty"

local function read_local_file(path)
  if fs.exists(path) then
    local file = fs.open(path, "r")
    local data = file.readAll():gsub("\\n$", "")
    file.close()
    return data
  end

  return ""
end

local function write_local_file(path, data)
  local file = fs.open(path, "w")
  file.write(data)
  file.close()
end

local API_KEY = read_local_file("/APIKEY")
local WORLD_ID = read_local_file("/WORLDID")
local ID = tostring(os.getComputerID())

local function log(...)
  local date = os.date("%Y-%m-%d %H:%M:%S")

  local args = {...}
  local msg = ""
  for i,v in ipairs(args) do
    msg = msg .. pretty.pretty(v) .. " "
  end

  print("[" .. date .. "] - " .. msg)
end

local function get_current_inventory()
  local inventory = {}
  for i = 1, 16 do
    local item = turtle.getItemDetail(i)
    if item then
      table.insert(inventory, item)
    else
      table.insert(inventory, {})
    end
  end
  return inventory
end

----- COMMANDS START

local function inspect(ws, command, initiated_client)
  log("Inspecting block...")
  local turtle_inspect_fns = {
    ["inspect"] = turtle.inspect,
    ["inspect_up"] = turtle.inspectUp,
    ["inspect_down"] = turtle.inspectDown,
  }

  local turtle_detect_fns = {
    ["inspect"] = turtle.detect,
    ["inspect_up"] = turtle.detectUp,
    ["inspect_down"] = turtle.detectDown,
  }

  local success_inspect, data = turtle_inspect_fns[command]()
  local solid = turtle_detect_fns[command]()

  local block_data = {
    name = nil,
    isSolid = solid,
  }
  if success_inspect then
    block_data.name = data.name
  end

  ws.send(textutils.serialiseJSON({
    type = 'data',
    clientType = 'machine',
    id = ID,
    payload = {
      type = 'turtle',
      command = 'command_result',
      origin_command = command,
      origin_initiated_client = initiated_client,
      success = true,
      world_id = WORLD_ID,
      block = block_data,
      fuel = turtle.getFuelLevel(),
      inventory = get_current_inventory(),
    },
    api_key = API_KEY
  }))
end

----- COMMANDS END

local MOVEMENT_COMMANDS = {
  ["forward"] = turtle.forward,
  ["backward"] = turtle.back,
  ["up"] = turtle.up,
  ["down"] = turtle.down,
  ["left"] = turtle.turnLeft,
  ["right"] = turtle.turnRight,
}

local COMMANDS = {
  ["inspect"] = inspect,
  ["inspect_up"] = inspect,
  ["inspect_down"] = inspect,
}

local function move(ws, command, initiated_client)
  local success, err = MOVEMENT_COMMANDS[command]()
  if not success then
    log("Error: ", err)
  end
  ws.send(textutils.serialiseJSON({
    type = 'data',
    clientType = 'machine',
    id = ID,
    payload = {
      type = 'turtle',
      command = 'command_result',
      origin_command = command,
      origin_initiated_client = initiated_client,
      success = success,
      world_id = WORLD_ID,
      error = err,
      fuel = turtle.getFuelLevel(),
      inventory = get_current_inventory(),
    },
    api_key = API_KEY
  }))
end

local ws = nil
local function main_loop()
  local ws_url = "ws://${data.host}:${data.port}"
  log("Using URL: ", ws_url)

  ws = http.websocket(ws_url)

  local payload = {
    type = 'register',
    clientType = 'machine',
    id = ID,
    payload = {
      type = 'turtle',
      world_id = WORLD_ID,
      fuel = turtle.getFuelLevel(),
      inventory = get_current_inventory(),
    },
    api_key = API_KEY
  }

  ws.send(textutils.serialiseJSON(payload))
  local packet = ws.receive()
  log('Packet: ', packet)
  local received = textutils.unserialiseJSON(packet)
  log('Received: ', received)

  if received.type == 'error' then
    error("Error: " .. received.error)
  end

  if not received.success then
    error("Could not register, retry later...")
  end

  local name = received.name
  os.setComputerLabel(name)
  log("Registered as: ", name)

  while true do
    log("Waiting for command...")
    local packet = ws.receive()
    log('Packet: ', packet)
    local received = textutils.unserialiseJSON(packet)
    log('Received: ', received)

    if received.type == 'error' then
      log("Error: " .. received.error)
    else
      if received.type == 'command' then
        local command = received.command
        local initiated_client = received.initiated_client

        log("Received command: ", command, ", initiated by: ", initiated_client)
        if MOVEMENT_COMMANDS[command] then
          move(ws, command, initiated_client)
        elseif COMMANDS[command] then
          COMMANDS[command](ws, command, initiated_client)
        end
      end
    end
  end

end

local function intiate()
  log("Intiating...")
  local ws = http.websocket("ws://${data.host}:${data.port}")

  log ("Requesting API key and state...")
  local payload = {
    type = 'initiate',
    clientType = 'machine',
    id = ID,
    payload = {
      type = 'turtle',
    },
  }
  ws.send(textutils.serialiseJSON(payload))

  local packet = ws.receive()
  log('Packet: ', packet)
  if not packet then
    error("Could not get API key, retry later...")
  end

  local received = textutils.unserialiseJSON(packet)
  log('Received: ', received)
  --[[
  {
    "type": "initiate",
    "success": true,
    "api_key": "API_KEY"
    "world_id": "WORLD_ID"
  }
  --]]

  if not received.success then
    error("Could not get API key, retry later...")
  end

  local world_id = received.world_id
  local api_key = received.api_key

  write_local_file("/APIKEY", api_key)
  log("API key saved to /APIKEY")

  write_local_file("/WORLDID", world_id)
  log("World ID saved to /WORLDID")

  API_KEY = api_key
  WORLD_ID = world_id
end

local function handle_graceful_socker(ws)
  log("Gracefully closing socket...")
  if ws then
    log("Closing websocket...")
    local ok, errorMessage = pcall(ws.close)
    if not ok then
      log("Error clossing websocket: ", errorMessage)
    else
      log("Websocket closed")
    end
  end
end

if not API_KEY or API_KEY == "" or not WORLD_ID or WORLD_ID == "" then
  local ws = nil
  local ok, errorMessage = pcall(intiate)
  handle_graceful_socker(ws)
  if not ok then
    log("Error: ", errorMessage)
  end
end

local ok, errorMessage = pcall(main_loop)
handle_graceful_socker(ws)

if not ok then
  log("Error: ", errorMessage)
end
