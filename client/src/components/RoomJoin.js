import React, { useState } from 'react';

function RoomJoin({ onJoin }) {
  const [roomInput, setRoomInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const roomCode = roomInput.trim() || 
      Math.random().toString(36).substring(2, 8).toUpperCase();
    
    onJoin(roomCode);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh' 
    }}>
      <h1>Join Whiteboard Room</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="Enter room code or leave blank for new room"
          style={{ padding: '10px', width: '300px', marginRight: '10px' }}
        />
        <button 
          type="submit"
          style={{ padding: '10px 20px' }}
        >
          Join Room
        </button>
      </form>
    </div>
  );
}

export default RoomJoin;
