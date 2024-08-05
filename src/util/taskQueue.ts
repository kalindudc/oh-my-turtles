import path from 'path';

import { config } from '../config';
import createTaggedLogger from '../logger/logger';

const MAX_CONCURRENT_TASKS = config.tasks.maxConcurrency;

const logger = createTaggedLogger(path.basename(__filename));

// Define separate task queues
const taskQueues: { [key: string]: (() => Promise<void>)[] } = {};
const activeTasks: { [key: string]: number } = {};
const waitingTasks: { [key: string]: (() => Promise<void>)[] } = {};

const initializeQueue = (queueName: string) => {
  if (!taskQueues[queueName]) {
    taskQueues[queueName] = [];
    activeTasks[queueName] = 0;
    waitingTasks[queueName] = [];
  }
};

const processQueue = async (queueName: string) => {
  logger.info(`Processing queue: ${queueName}`);

  const queue = taskQueues[queueName];
  while (queue.length > 0 && activeTasks[queueName] < MAX_CONCURRENT_TASKS) {
    const task = queue.shift();
    if (task) {
      activeTasks[queueName]++;

      try {
        await task();
      } catch (error) {
        logger.error(`Error processing task: ${error}`);
      } finally {
        activeTasks[queueName]--;

        // Process waiting tasks if any
        if (waitingTasks[queueName].length > 0) {
          logger.info(`Found waiting tasks: ${queueName}`);
          const nextTask = waitingTasks[queueName].shift();
          if (nextTask) {
            taskQueues[queueName].push(nextTask);
            processQueue(queueName);
          }
        }
      }
    }
  }
};

export const addTask = (queueName: string, task: () => Promise<void>) => {
  initializeQueue(queueName);

  if (activeTasks[queueName] < MAX_CONCURRENT_TASKS) {
    taskQueues[queueName].push(task);
    processQueue(queueName);
  } else {
    logger.info(`Task added to waiting list: ${queueName}`);
    waitingTasks[queueName].push(task);
  }
};
