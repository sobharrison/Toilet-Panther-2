"use strict";

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
const PLAYER_SIZE = 45;

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
    this.w = PLAYER_SIZE; // width (x)
    this.h = PLAYER_SIZE; // height (h)
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

///// GAME OBJECTS //////////

const mapWidth = 900;
const mapHeight = 900;
const gameSpeed = 50;
let gameState = 1;

const plungerSize = 50;
const maxPlungers = 10;
class Plunger {
  constructor() {
    this.sprite = "plunger",
    this.x = this.spawn(mapWidth),
    this.y = this.spawn(mapHeight),
    this.w = plungerSize,
    this.h = plungerSize
  }
  spawn(max) {
    return Math.max(Math.floor(Math.random() * max - plungerSize), 0);
  }
}

var plungers = [];

const oozeChance = 3;
const oozeNormal = 1;
const oozeBonus = 3;
const oozeSpriteNormal = "ooze";
const oozeSpriteBonus = "gooze";
const oozeSize = 50;
const oozeVelocityMax = 20;
const maxOozes = 10;
class Ooze {
  constructor() {
    this.sprite = oozeSpriteNormal,
    this.points = this.bonus(oozeChance),
    this.bonus = false,
    this.x = Math.floor(mapWidth / 2),
    this.y = Math.floor(mapHeight / 2),
    this.maxdx = this.velocity(oozeVelocityMax),
    this.maxdy = this.velocity(oozeVelocityMax),
    this.dx = 0;
    this.dy = 0;
    this.w = oozeSize,
    this.h = oozeSize
  }
  bonus(chance) {
    // 1 in (chance) times being a bonus ooze
    if ( Math.abs(Math.floor(Math.random() * chance)) === 0) {
      this.bonus = true;
      this.sprite = oozeSpriteBonus;
      return oozeBonus;
    } else {
      this.bonus = false;
      this.sprite = oozeSpriteNormal;
      return oozeNormal;
    }
  }
  velocity(max) {
    return Math.round(Math.random() * max * 2 - max);
  }
  move() {
    if (this.dx === 0 && this.dy === 0 && (Math.random()*10 > 9 ? true : false)) {
      this.dx = this.maxdx * (this.bonus ? 2 : 1);
      this.dy = this.maxdy * (this.bonus ? 2 : 1);
    }
    
    this.x = this.x + this.dx;
    this.y = this.y + this.dy;

    let tx = -Math.sign(this.dx);
    this.dx += tx;
    let ty = -Math.sign(this.dy);
    this.dy += ty;
  }
}

var oozes = [];

///// GAME LOOP //////////

function gameLoop () {
  let mapObjects = [];
  
  if (plungers.length < maxPlungers) {
    plungers.push(new Plunger());
  }

  if (oozes.length < maxOozes) {
    oozes.push(new Ooze());
  }

  for (var o=0;o < oozes.length; o++) {
    oozes[o].move();
    if ( outOfBounds(oozes[o]) ) {
      oozes.splice(o, 1);
      o--;
    }
  }

  for (var id in users) {
    //move(id);
    users[id].move();

    let sprite = "square";//temperary

    // plungers
    for (var p=0;p < plungers.length; p++) {
      if ( collision(users[id], plungers[p]) ) {
        users[id].ammo += 1;
        //console.log(users[id].nickname, users[id].ammo);
        sprite = "squareb"; // temporary
        plungers.splice(p, 1);
        p--;
      }
    }
    // oozes
    for (var o=0;o < oozes.length; o++) {
      if ( collision(users[id], oozes[o]) ) {
        if ( users[id].ammo >= 1 ) {
          users[id].points += oozes[o].points;
          users[id].ammo -= 1;
          sprite = "squareg";
          oozes.splice(o, 1);
          o--;
        } else {
          sprite = "squareg";
        }
      }
    }
    
    mapObjects.push({
      sprite: sprite,
      x: users[id].x,
      y: users[id].y,
      w: users[id].w,
      h: users[id].h
    });
  }

  mapObjects = mapObjects.concat(plungers);
  mapObjects = mapObjects.concat(oozes);

  //io.emit('gameState', mapObjects);

  for (var id in users) {
    let gameData = mapObjects.concat( users[id].clientData() );
    io.to(id).emit('gameState', gameData);
  }

  setTimeout(() => {
    gameLoop();
  }, gameSpeed);
}

setTimeout(() => {
  gameLoop();
}, 1000);

///// GAME FUNCTIONS //////////////
User.prototype.clientData = function () {
  return {
    you: true,
    nickname: this.nickname,
    sprite: "you",
    points: this.points,
    ammo: this.ammo,
    x: this.x,
    y: this.y,
    w: this.w,
    h: this.h
  };
}

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
  this.x = Math.max(0, Math.min(this.x + this.dx, mapWidth - this.w) );
  this.y = Math.max(0, Math.min(this.y + this.dy, mapHeight - this.h) );
}

// objects must have the properties x,y,w,h for size and position
function collision (object1, object2) {
  // https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
  if (
    object1.x < object2.x + object2.w &&
    object1.x + object1.w > object2.x &&
    object1.y < object2.y + object2.h &&
    object1.y + object1.h > object2.y
  ) {
    return true;
  } else {
    return false;
  }
}

function outOfBounds (object1) {
  if (
    object1.x + object1.w < 0 ||
    object1.x > mapWidth ||
    object1.y + object1.h < 0 ||
    object1.y > mapHeight
  ) {
    return true;
  } else {
    return false;
  }
}