const mongoose = require('mongoose');
require('dotenv').config();

const connect = () => {
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
  }
  
  // MongoDB 연결 설정
  mongoose.connect('mongodb://tommy:0000@34.196.33.236:27017/admin', {
    dbName: 'seongyun',
    useNewUrlParser: true,
  }).then(() => {
    console.log("MongoDB connection successful");
  }).catch((err) => {
    console.error("MongoDB connection error", err);
  });
};

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error', error);
});

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB connection lost. Attempting to reconnect...');
  connect();
});

module.exports = connect;
