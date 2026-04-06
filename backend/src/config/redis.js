const redis = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    ...(process.env.REDIS_PASSWORD
      ? { password: process.env.REDIS_PASSWORD }
      : {})
    // maxRetriesPerRequest: null, // Important for BullMQ
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',  
      delay: 2000, // Start with 2s, then 4s, 8s
    },
    removeOnComplete: {
      age: 4 * 60 * 60, // Keep completed jobs for 4 hours (in seconds)
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 24 * 60 * 60, // Keep failed jobs for 1 days (in seconds)
    },
  },
};

export default redis;