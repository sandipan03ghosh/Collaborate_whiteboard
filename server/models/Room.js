const mongoose = require('mongoose');

const DrawingCommandSchema = new mongoose.Schema({
  type: String,
  data: Object,
  userId: String,
  timestamp: { type: Date, default: Date.now },
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  drawingData: [DrawingCommandSchema],
});

RoomSchema.methods.addDrawing = function(drawingData) {
  this.drawingData.push(drawingData);
  this.lastActivity = Date.now();
  return this.save();
};

RoomSchema.methods.clearDrawings = function() {
  this.drawingData = [];
  this.lastActivity = Date.now();
  return this.save();
};

module.exports = mongoose.model('Room', RoomSchema);
