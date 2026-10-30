const mongoose = require('mongoose');
const env = require('../config/env');

mongoose.set('strictQuery', true);

async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(env.mongoUrl, { dbName: env.mongoDb, serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}

module.exports = { connect, mongoose };
