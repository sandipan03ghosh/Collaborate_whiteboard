const Room = require('../models/Room');

module.exports = (io) => {
  const roomUsers = {};
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    let currentRoom = null;

    socket.on('join-room', async (roomId) => {
      socket.join(roomId);
      currentRoom = roomId;
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      if (!roomUsers[roomId]) {
        roomUsers[roomId] = new Set();
        
        try {
          let room = await Room.findOne({ roomId });
          if (!room) {
            room = new Room({ roomId });
            await room.save();
            console.log(`Created new room in database: ${roomId}`);
          }
        } catch (err) {
          console.error('Error checking/creating room in database:', err);
        }
      }
      roomUsers[roomId].add(socket.id);
      
      socket.to(roomId).emit('user-joined', socket.id);
      
      console.log(`Room ${roomId} now has ${roomUsers[roomId].size} users`);
      
      io.to(roomId).emit('user-count', roomUsers[roomId].size);
    });

    socket.on('leave-room', (roomId) => {
      console.log(`User ${socket.id} left room ${roomId}`);
      socket.leave(roomId);
      
      if (roomUsers[roomId]) {
        roomUsers[roomId].delete(socket.id);
        
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        io.to(roomId).emit('user-count', roomUsers[roomId].size);
        
        console.log(`Room ${roomId} now has ${roomUsers[roomId].size} users after leave`);
        
        if (roomUsers[roomId].size === 0) {
          delete roomUsers[roomId];
        }
      }
      
      if (currentRoom === roomId) {
        currentRoom = null;
      }
    });

    socket.on('drawing', async ({ roomId, drawingData }) => {
      console.log(`Received drawing data in room ${roomId} from ${socket.id}`);
      
      const enhancedData = {
        ...drawingData,
        senderId: socket.id
      };
      
      try {
        await Room.findOneAndUpdate(
          { roomId },
          { 
            $push: { 
              drawingData: { 
                type: 'stroke', 
                data: drawingData,
                timestamp: Date.now(),
                userId: socket.id
              }
            },
            $set: { lastActivity: Date.now() }
          }
        );
        console.log(`Saved drawing data to database for room ${roomId}`);
      } catch (err) {
        console.error('Error saving drawing data to database:', err);
      }
      
      socket.to(roomId).emit('drawing', enhancedData);
    });
    
    socket.on('load-drawings', async (roomId) => {
      try {
        const room = await Room.findOne({ roomId });
        if (room && room.drawingData && room.drawingData.length > 0) {
          console.log(`Sending ${room.drawingData.length} drawing items to user ${socket.id}`);
          socket.emit('load-drawings', room.drawingData);
        } else {
          console.log(`No existing drawings found for room ${roomId}`);
          socket.emit('load-drawings', []);
        }
      } catch (err) {
        console.error('Error loading drawings from database:', err);
        socket.emit('load-drawings', []);
      }
    });
    
    socket.on('cursor-move', ({ roomId, position }) => {
      socket.to(roomId).emit('cursor-move', {
        userId: socket.id,
        position
      });
    });
    
    socket.on('request-user-count', (roomId) => {
      console.log(`User ${socket.id} requested user count for room ${roomId}`);
      if (roomUsers[roomId]) {
        socket.emit('user-count', roomUsers[roomId].size);
      } else {
        socket.emit('user-count', 0);
      }
    });
    
    socket.on('clear-canvas', async (roomId) => {
      try {
        await Room.findOneAndUpdate(
          { roomId },
          { 
            $set: { 
              drawingData: [],
              lastActivity: Date.now() 
            }
          }
        );
        console.log(`Cleared canvas data in database for room ${roomId}`);
      } catch (err) {
        console.error('Error clearing canvas data in database:', err);
      }
      
      socket.to(roomId).emit('clear-canvas');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (currentRoom && roomUsers[currentRoom]) {
        roomUsers[currentRoom].delete(socket.id);
        
        console.log(`Room ${currentRoom} now has ${roomUsers[currentRoom].size} users after disconnect`);
        
        socket.to(currentRoom).emit('user-disconnected', socket.id);
        
        io.to(currentRoom).emit('user-count', roomUsers[currentRoom].size);
        
        if (roomUsers[currentRoom].size === 0) {
          delete roomUsers[currentRoom];
        }
      }
    });
  });
};
