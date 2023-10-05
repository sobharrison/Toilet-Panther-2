const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

///// Express //////////////////////////////////////////

// Define the directory containing your static files (e.g., HTML, CSS, JavaScript).
app.use(express.static(__dirname + '/webcontent'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

// start server on port
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

///// Socket IO ////////////////////////////////////////

class User {
  constructor(id, nickname) {
    this.id = id;
    this.nickname = nickname;
  }
}

var users = {};

io.on('connection', (socket) => {
  console.log(`User connected with socket ID: ${socket.id}`);
  users[socket.id] = new User(socket.id, "test");
  console.log(users);

  socket.on('move', (data) => {
    io.emit('updateGameState', updatedGameState);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected with socket ID: ${socket.id}`);
    delete users[socket.id];
    console.log(users);
  });
});
