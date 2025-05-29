Documentation
1)Setup Instructions: 

Prerequisites:
•	Node.js (v14+)
•	MongoDB (v4+)
•	npm or yarn

Installation Steps:
1. Clone the repository:      git clone https://github.com/sandipan03ghosh/Whiteboard.git
                              cd Whiteboard
2. Server Setup:                  # Navigate to server directory
                                  cd server
                                  # Install dependencies
                                  npm install
                                  # Configure environment variables
                                  # Create a .env file with the following contents:
                                  # PORT=5000
                                  # MONGO_URI=mongodb://127.0.0.1:27017/whiteboard
                                  # Start the server
                                  npm run dev
3. Client Setup:                  # Navigate to client directory
                                  cd ../client
                                  # Install dependencies
                                  npm install
                                  # Start the client
                                  npm start


2)API Documentation:             REST Endpoints
                                 Room Management
Endpoint	                  Method	Description	                         Request Body	                  Response
/api/rooms/join	            POST	  Join or create a room	            { roomId: string }	 { roomId, createdAt, hasDrawings }
/api/rooms/:roomId	        GET	    Get room information		                -               { roomId, createdAt, lastActivity, drawingCount }
/api/rooms/:roomId/drawings	GET	    Get all drawing data for a room		      -               { drawingData: [] }


Socket.io Events
Client-emitted Events
Event	              Payload	                        Description
join-room	          roomId	                        Join a specific whiteboard room
leave-room          roomId	                        Leave the current room
drawing	            { roomId, drawingData }	        Send drawing stroke data
cursor-move	        { roomId, position: { x, y } }	Update cursor position
request-user-count	roomId	                        Request the number of users in a room
clear-canvas	      roomId	                        Clear the entire canvas
load-drawings	      roomId	                        Request all existing drawings for a room

Server-emitted Events
Event	                       Payload	               Description
user-joined	                 userId	                 Notifies when a new user joins the room
user-disconnected	           userId	                 Notifies when a user leaves the room
user-count	                 number	                 Total number of users in the room
drawing	                     drawingData	           Broadcast drawing data to other users
cursor-move	                 { userId, position }	   Broadcast cursor position
clear-canvas	               -	                     Notify all clients to clear their canvas
load-drawings	               [drawingData]	         Send all existing drawings to a client

Architecture Overview

Technology Stack
Frontend: React.js
Backend: Node.js with Express.js
Database: MongoDB with Mongoose
Real-time Communication: Socket.io

System Components
┌──────────────┐      ┌────────────────┐      ┌─────────────┐
│   React.js   │ <──> │   Socket.io    │ <──> │   MongoDB   │
│   Frontend   │      │ Express Server │      │  Database   │
└──────────────┘      └────────────────┘      └─────────────┘
Component Breakdown
Frontend Components
App.js - Main application container
RoomJoin.js - Room selection and joining interface
Whiteboard.js - Main whiteboard container component
DrawingCanvas.js - Canvas drawing functionality
UserCursors.js - Displays other users' cursors 

Backend Components
server.js - Express server and Socket.io setup
rooms.js - REST API endpoints for room management
Room.js - MongoDB schema for rooms and drawings
index.js - Socket.io event handlers
db.js - Database connection setup

Data Flow
User joins/creates a room via the RoomJoin component
Socket connection established with unique room ID
Drawing actions captured by canvas events
Drawing data sent to server via Socket.io
Server broadcasts drawing data to all connected users
Server persists drawing data in MongoDB
New users receive existing drawings when joining a room

Deployment Guide
Update environment variables
   - In the `.env` file in the server directory with:
     MONGO_URI=mongodb_connection_string(obtained from MongoDB Atlas)
     PORT=5000
     NODE_ENV=development
     
Deployment to Heroku
1. Install Heroku CLI
2. Create a new Heroku app
   ```bash
   heroku create Whiteboard(app name)
3.Set environment variables on Heroku
heroku config:set MONGO_URI=mongodb_connection_string
heroku config:set NODE_ENV=production
4.Deploy the application
git push heroku main
