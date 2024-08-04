
import { readFileSync } from "fs"

export const generateSetup = (data: {host: string, port: string} ): string => {
  const setupFile = readFileSync("src/templates/_setup.lua", "utf8");

  return eval(`\`${setupFile}\``);
};
