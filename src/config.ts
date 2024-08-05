export const config = {
  server: {
    port: process.env.PORT || 8080,
    sessionSecret: process.env.SESSION_SECRET || 'AVERYCOOLSECRET',
  },
  websocket: {
    maxConcurrency: 5,
    messageQueueDuration: 1500,
  },
  database: {
    worlds: {
      path: 'src/db/world.json',
    },
    machines: {
      path: 'src/db/machine.json',
    },
    users: {
      path: 'src/db/user.json',
    },
  },
  worker: {
    timeout: 1500,
  },
  logger: {
    level: process.env.NODE_ENV == 'development' ? 'debug' : 'error',
  },
  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  },
  machine: {
    apiKey: process.env.MACHINE_API_KEY,
  },
};
