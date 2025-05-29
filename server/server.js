const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path'); 
const socketSetup = require('./socket');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
app.use(cors());

app.use(express.json());

const roomRoutes = require('./routes/rooms');
app.use('/api/rooms', roomRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

socketSetup(io);


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  connectDB().then(connected => {
    if (!connected) {
      console.warn('Server running without MongoDB connection. Some features may not work properly.');
    }
  });
});