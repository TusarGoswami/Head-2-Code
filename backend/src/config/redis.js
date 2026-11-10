const { createClient } = require('redis');

const redisOptions = {};

if (process.env.REDIS_HOST) {
    redisOptions.username = process.env.REDIS_USER || 'default';
    if (process.env.REDIS_PASS) redisOptions.password = process.env.REDIS_PASS;
    redisOptions.socket = {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379
    };
} else if (process.env.REDIS_PASS) {
    redisOptions.username = process.env.REDIS_USER || 'default';
    redisOptions.password = process.env.REDIS_PASS;
    redisOptions.socket = {
        host: 'redis-19934.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 19934
    };
} else {
    redisOptions.url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
}

const redisClient = createClient(redisOptions);

// Prevent unhandled error event from crashing the server if Redis disconnects
redisClient.on('error', (err) => {
    console.warn('⚠️ Redis Client Error:', err.message);
});

module.exports = redisClient;