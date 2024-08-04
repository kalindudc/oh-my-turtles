local pretty = require "cc.pretty"

local MOVEMENT_COMMANDS = {
  ["forward"] = turtle.forward,
  ["backward"] = turtle.back,
  ["up"] = turtle.up,
  ["down"] = turtle.down,
  ["left"] = turtle.turnLeft,
  ["right"] = turtle.turnRight
}

local API_KEY = nil
if fs.exists("/APIKEY") then
  local api_key_file = fs.open("/APIKEY", "r")
  API_KEY = api_key_file.readAll():gsub("\\n$", "")
  api_key_file.close()
end

local ID = tostring(os.getComputerID())
local WORLD_ID = "test_world" -- TODO: figure out how to generate

local function log(...)
  local date = os.date("%Y-%m-%d %H:%M:%S")

  local args = {...}
  local msg = ""
  for i,v in ipairs(args) do
    msg = msg .. pretty.pretty(v) .. " "
  end

  print("[" .. date .. "] - " .. msg)
end

local function getCurrentInventor()
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
      worldId = WORLD_ID,
      fuel = turtle.getFuelLevel(),
      inventory = getCurrentInventor(),
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
        local args = received.args

        if MOVEMENT_COMMANDS[command] then
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
              success = success,
              error = err,
              fuel = turtle.getFuelLevel(),
              inventory = getCurrentInventor(),
            },
            api_key = API_KEY
          }))
        end
      end
    end
  end

end

if not API_KEY or API_KEY == "" then
  local ws = http.websocket("ws://${data.host}:${data.port}")

  log ("Requesting API key...")
  local payload = {
    type = 'initiate',
    clientType = 'machine',
    id = ID,
    payload = {
      type = 'turtle',
    },
  }
  ws.send(textutils.serialiseJSON(payload))

  local api_key_data = ws.receive()
  if not api_key_data or api_key_data == "REJECTED" then
    error("Could not get API key, retry later...")
  end

  local api_key_file = fs.open("/APIKEY", "w")
  api_key_file.write(api_key_data)
  api_key_file.close()
  log("API key saved to /APIKEY")

  ws.close()

  API_KEY = api_key_data
end

if not API_KEY or API_KEY == "" then
  error("Could not get API key")
end

local ok, errorMessage = pcall(main_loop)

if ws then
  log("Closing websocket...")
  local ok, errorMessage = pcall(ws.close)
  if not ok then
    log("Error clossing websocket: ", errorMessage)
  else
    log("Websocket closed")
  end
end

if not ok then
  log("Error: ", errorMessage)
end
