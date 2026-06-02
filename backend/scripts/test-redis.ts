import { createClient } from 'redis';

async function testRedis() {
  const client = createClient({
    url: 'redis://your-redis-host:6379'
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  try {
    await client.connect();
    console.log('âœ… Connected to Redis successfully');
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log('âœ… Redis GET/SET working. Value:', value);
    await client.del('test_key');
    await client.disconnect();
  } catch (err) {
    console.error('âŒ Redis Connection Failed:', err);
    process.exit(1);
  }
}

testRedis();

