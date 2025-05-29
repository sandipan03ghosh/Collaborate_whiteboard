const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

router.post('/join', async (req, res) => {
  const { roomId } = req.body;

  if (!roomId || roomId.length < 6 || roomId.length > 8) {
    return res.status(400).json({ error: 'Room ID must be 6-8 characters long.' });
  }

  try {
    let room = await Room.findOne({ roomId });

    if (!room) {
      room = new Room({ roomId });
      await room.save();
      console.log(`Created new room via API: ${roomId}`);
    }

    return res.json({ 
      roomId: room.roomId,
      createdAt: room.createdAt,
      hasDrawings: room.drawingData.length > 0
    });
  } catch (err) {
    console.error('Error in room join:', err);
    return res.status(500).json({ error: 'Server error joining room' });
  }
});

router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    return res.json({
      roomId: room.roomId,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
      drawingCount: room.drawingData.length,
    });
  } catch (err) {
    console.error('Error getting room info:', err);
    return res.status(500).json({ error: 'Server error retrieving room info' });
  }
});

router.get('/:roomId/drawings', async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    return res.json({
      drawingData: room.drawingData
    });
  } catch (err) {
    console.error('Error getting room drawings:', err);
    return res.status(500).json({ error: 'Server error retrieving drawings' });
  }
});

module.exports = router;
