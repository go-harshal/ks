const env = require('./config/env');
const app = require('./app');
const { connect } = require('./db/connect');

async function start() {
  await connect();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`API listening on :${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start API', err);
  process.exit(1);
});
