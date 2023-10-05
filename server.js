const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;


// Define the directory containing your static files (e.g., HTML, CSS, JavaScript).
app.use(express.static(__dirname + '/webcontent'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

// start server on port
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle game-related events, such as player movements, actions, etc.
  // Example:
  socket.on('move', (data) => {
    // Handle player movement
    // Broadcast the updated game state to all connected clients
    io.emit('updateGameState', updatedGameState);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
