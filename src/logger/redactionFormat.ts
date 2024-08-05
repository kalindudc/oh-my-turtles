import { format } from 'winston';

const redactSensitiveInfo = (message: string): string => {
  // Define the regex pattern to find API keys or other sensitive data
  const apiKeyPattern = /"api_key":"[^"]*"/g;

  // Replace sensitive information with a redacted placeholder
  return message.replace(apiKeyPattern, '"api_key":"[REDACTED]"');
};

export const redactionFormat = format((level) => {
  // Apply redaction only to the message field
  if (level.message) {
    level.message = redactSensitiveInfo(level.message);
  }
  return level;
})();
