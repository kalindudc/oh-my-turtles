local VERSION_FILE_URL = "https://raw.githubusercontent.com/kalindudc/oh-my-turtles/main//lua/VERSION"


local current_version = http.get(VERSION_FILE_URL).readAll():gsub("\n$", "")

while true do
  print("Checking for updates...")
  local new_version = http.get(VERSION_FILE_URL).readAll():gsub("\n$", "")
  if new_version ~= current_version then
    print("New version available: " .. new_version)
    print("Updating...")
    shell.run("update")
  end

  os.sleep(1)
end
