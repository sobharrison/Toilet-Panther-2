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

const DEFAULT_AMMO = 3;

class User {
  constructor(id) {
    this.id = id;
    this.nickname = null;
    this.points = 0;
    this.ammo = DEFAULT_AMMO;
    this.x = 0; // position x
    this.y = 0; // position y
    this.dx = 0; // velocity x
    this.dy = 0; // velocity y
    this.keystates = {
      "up": false,
      "down": false,
      "left": false,
      "right": false
    };
  }
}

var users = {};

io.on('connection', (socket) => {
  console.log(`User connected with socket ID: `+ socket.id);
  users[socket.id] = new User(socket.id);
  //console.log(users);

  //socket.on('move', (data) => {
  //  io.emit('updateGameState', updatedGameState);
  //});

  socket.on('nickname', (data) => {
    users[socket.id].nickname = data;
    console.log('User: '+socket.id+' set nickname: '+data);
  });

  socket.on('keystate', (data) => {
    users[socket.id].keystates = data;
    //console.log(users[socket.id].nickname, users[socket.id].keystates);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected with socket ID: ` + socket.id);
    delete users[socket.id];
    //console.log(users);
  });
});

///// GAME LOOP //////////

const mapWidth = 900;
const mapHeight = 900;
const gameSpeed = 50;
let gameState = 1;

function gameLoop () {
  let mapObjects = [];
  

  for (var id in users) {
    //move(id);
    users[id].move();

    mapObjects.push({
      shape: "square",
      x: users[id].x,
      y: users[id].y
    });
  }

  io.emit('gameState', mapObjects);
  setTimeout(() => {
  gameLoop();
}, gameSpeed);
}

setTimeout(() => {
  gameLoop();
}, 1000);


///// GAME FUNCTIONS //////////////
User.prototype.move = function () {
  if (this.keystates.up) {
    this.dy = Math.min(this.dy - 1, 20);
  }
  if (this.keystates.down) {
    this.dy = Math.min(this.dy + 1, 20);
  }
  if (!this.keystates.up && !this.keystates.down) {
    let t = -Math.sign(this.dy);
    this.dy += t;
  }

  if (this.keystates.right) {
    this.dx = Math.min(this.dx + 1, 20);
  }
  if (this.keystates.left) {
    this.dx = Math.min(this.dx - 1, 20);
  }
  if (!this.keystates.right && !this.keystates.left) {
    let t = -Math.sign(this.dx);
    this.dx += t;
  }

  //this.x += this.dx;
  //this.y += this.dy;
  this.x = Math.max(0, Math.min(this.x + this.dx, mapWidth) );
  this.y = Math.max(0, Math.min(this.y + this.dy, mapHeight) );
}