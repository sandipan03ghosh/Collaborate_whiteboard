import React, { useRef, useEffect, useState, useCallback } from 'react';
import socket from '../socket';
import throttle from 'lodash.throttle';
import UserCursors from './UserCursors';

function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [strokeStyle, setStrokeStyle] = useState('black');
  const [lineWidth, setLineWidth] = useState(3);
  const containerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [userCount, setUserCount] = useState(0);

  const throttledCursorMove = useCallback(
    throttle((roomId, position) => {
      socket.emit('cursor-move', { roomId, position });
    }, 10),
    [roomId]
  );

  const emitDrawing = useCallback((roomId, drawingData) => {
    socket.emit('drawing', { roomId, drawingData });
  }, []);

  useEffect(() => {
    socket.emit('join-room', roomId);
    console.log(`Joined room: ${roomId}`);
    
    socket.emit('request-user-count', roomId);

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;

    socket.emit('load-drawings', roomId);
    
    socket.on('load-drawings', (drawings) => {
      console.log(`Received ${drawings.length} drawings from server`);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drawings.forEach(item => {
        if (item.type === 'stroke' && item.data) {
          const { x0, y0, x1, y1, color, width } = item.data;
          ctx.beginPath();
          ctx.strokeStyle = color || 'black';
          ctx.lineWidth = width || 3;
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.closePath();
        }
      });
      
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
    });

    const handleConnect = () => {
      setIsConnected(true);
      if (roomId) {
        socket.emit('join-room', roomId);
        socket.emit('request-user-count', roomId);
        socket.emit('load-drawings', roomId);
      }
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    socket.on('user-count', (count) => {
      console.log('Received user count update:', count);
      setUserCount(count);
      setTimeout(() => {
        console.log('Current user count state:', userCount);
      }, 100);
    });

    socket.on('drawing', (drawingData) => {
      drawFromData(drawingData);
    });

    socket.on('clear-canvas', () => {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    const handleResize = () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);
      
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.8;
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      
      ctx.drawImage(tempCanvas, 0, 0);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      socket.off('drawing');
      socket.off('clear-canvas');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('user-count');
      socket.off('load-drawings');
      window.removeEventListener('resize', handleResize);
      console.log('Cleaning up socket listeners');
    };
  }, [roomId]);

  useEffect(() => {
    const userCountHandler = (count) => {
      console.log('Setting user count to:', count);
      setUserCount(count);
    };

    socket.on('user-count', userCountHandler);
    
    if (socket.connected) {
      console.log('Requesting current user count for room:', roomId);
      socket.emit('request-user-count', roomId);
    }

    return () => {
      socket.off('user-count', userCountHandler);
    };
  }, [roomId]);

  const drawFromData = ({ x0, y0, x1, y1, color = 'black', width = 3 }) => {
    const ctx = ctxRef.current;
    const originalStyle = ctx.strokeStyle;
    const originalWidth = ctx.lineWidth;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
    
    ctx.strokeStyle = originalStyle;
    ctx.lineWidth = originalWidth;
  };

  const startDrawing = ({ nativeEvent }) => {
    drawing.current = true;
    const { offsetX, offsetY } = nativeEvent;
    lastPos.current = { x: offsetX, y: offsetY };
  };

  const draw = ({ nativeEvent }) => {
    if (!drawing.current) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = ctxRef.current;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    ctx.closePath();

    const drawingData = {
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: offsetX,
      y1: offsetY,
      color: strokeStyle,
      width: lineWidth
    };
    
    emitDrawing(roomId, drawingData);
    lastPos.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-canvas', roomId);
  };

  const clearMyDrawings = () => {
    socket.emit('clear-user-drawings', roomId);
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    throttledCursorMove(roomId, {
      x: e.clientX,
      y: e.clientY
    });
  };

  useEffect(() => {
    if (ctxRef.current) {
      const ctx = ctxRef.current;
      
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
    }
  }, [strokeStyle, lineWidth]);

  return (
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
          <button onClick={clearCanvas} style={{ marginRight: '10px' }}>Clear All</button>
          <button onClick={clearMyDrawings} style={{ marginRight: '10px' }}>Clear My Drawings</button>
          <select 
            value={strokeStyle}
            onChange={(e) => setStrokeStyle(e.target.value)}
            style={{ marginRight: '10px' }}
          >
            <option value="black">Black</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
          </select>
          <input 
            type="range" 
            min="1" 
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            style={{ marginRight: '10px' }}
          />
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%', 
            backgroundColor: isConnected ? '#4CAF50' : '#F44336',
            marginRight: '10px'
          }}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          <span>Users: {userCount}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
              handleMouseMove(e);
              draw(e);
            }}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ border: '1px solid black', cursor: 'crosshair' }}
          />
          <UserCursors roomId={roomId} />
        </div>
      </div>
    </div>
  );
}

export default Whiteboard;
