import React, { useState, useEffect } from 'react';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';
import socket from './socket';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  
  const handleJoinRoom = (newRoomId) => {
    setRoomId(newRoomId);
  };
  
  const handleLeaveRoom = () => {
    if (roomId) {
      socket.emit('leave-room', roomId);
      console.log(`Leaving room: ${roomId}`);
    }
    setRoomId('');
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomId) {
        socket.emit('leave-room', roomId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (roomId) {
        socket.emit('leave-room', roomId);
      }
    };
  }, [roomId]);

  return (
    <div className="App">
      {roomId === '' ? (
        <RoomJoin onJoin={handleJoinRoom} />
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px' }}>
            <h3>Room: {roomId}</h3>
            <p>Share this room code with others to collaborate!</p>
            <button onClick={handleLeaveRoom}>Leave Room</button>
          </div>
          <Whiteboard roomId={roomId} />
        </div>
      )}
    </div>
  );
}

export default App;
