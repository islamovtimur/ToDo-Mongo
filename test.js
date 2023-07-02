const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/testDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;

connection.on('error', console.error.bind(console, 'Connection error:'));
connection.once('open', function () {
  console.log('Connected to MongoDB');
  // Perform database operations or other tasks here
});
