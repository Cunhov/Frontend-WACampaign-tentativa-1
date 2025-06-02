const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);

  ws.on('message', (message) => {
    console.log('Received:', message);
    // Echo the message back to the client
    ws.send(message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  // Send initial connection success message
  ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 8080;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
}); 