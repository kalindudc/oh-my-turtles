// src/utils/logger.ts
const log = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message);
  }
};

const error = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(message);
  }
};

export default {
  log,
  error,
};
