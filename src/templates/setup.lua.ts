
export const generateSetup = (data: {host: string, port: string} ): string => {
  return `

local API_KEY = nil
if fs.exists("/APIKEY") then
  local api_key_file = fs.open("/APIKEY", "r")
  API_KEY = api_key_file.readAll():gsub("\\n$", "")
  api_key_file.close()
end

local id = tostring(os.getComputerID())
local world_id = "test_world" -- TODO: figure out how to generate

if not API_KEY or API_KEY == "" then
  local ws = http.websocket("ws://${data.host}:${data.port}")

  print ("Requesting API key...")
  local payload = {
    type = 'initiate',
    clientType = 'machine',
    id = id,
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

  ws.close()

  API_KEY = api_key_data
end

if not API_KEY or API_KEY == "" then
  error("Could not get API key")
end

local ws_url = "ws://${data.host}:${data.port}"
print(ws_url)

local ws = http.websocket(ws_url)
local payload = {
  type = 'register',
  clientType = 'machine',
  id = id,
  payload = {
    type = 'turtle',
    worldId = world_id
  },
  api_key = API_KEY
}

ws.send(textutils.serialiseJSON(payload))

local packet = ws.receive()
print(packet)

packet = ws.receive()
print(packet)

ws.close()

local received = textutils.unserialiseJSON(packet)
os.setComputerLabel(received.name)
  `;
};
