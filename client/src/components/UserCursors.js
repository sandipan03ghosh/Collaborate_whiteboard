// client/src/components/UserCursors.js
import React, { useEffect, useState } from 'react';
import socket from '../socket';

function UserCursors({ roomId }) {
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    socket.on('cursor-move', ({ userId, position }) => {
      setCursors(prev => ({
        ...prev,
        [userId]: position
      }));
    });

    socket.on('user-disconnected', (userId) => {
      setCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[userId];
        return newCursors;
      });
    });

    socket.on('connect', () => {
      setCursors({});
    });

    return () => {
      socket.off('cursor-move');
      socket.off('user-disconnected');
      socket.off('connect');
    };
  }, []);

  return (
    <>
      {Object.entries(cursors).map(([userId, position]) => (
        <div
          key={userId}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <polygon 
              points="0,0 10,15 5,10" 
              fill="#FF5722" 
              stroke="black" 
              strokeWidth="1"
            />
          </svg>
          <div style={{ 
            background: '#333', 
            color: 'white', 
            padding: '2px 5px', 
            borderRadius: '3px', 
            fontSize: '12px',
            transform: 'translate(10px, -10px)'
          }}>
            {userId.substring(0, 6)}
          </div>
        </div>
      ))}
    </>
  );
}

export default UserCursors;
