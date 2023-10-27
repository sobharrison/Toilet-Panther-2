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
    this.sprite = "square";
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
    users[socket.id].spawnCircle();
    io.to(socket.id).emit('pregame', {
      "text": "<-- Press Start button!",
      "nickname": data
    });
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

  socket.on('start', () => {
    if (gameState === 0) {
      gameState = 1;
      countdown = startCountDown;
      setTimeout(() => {
        startSequence();
      }, 1000);
    }
  });
});

///// GAME OBJECTS //////////

const mapWidth = 900;
const mapHeight = 900;
const gameSpeed = 50;
let gameState = 0;

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

///// GAME START SEQUENCE //////

const startCountDown = 20;
let countdown = startCountDown;

function startSequence () {
  io.emit('pregame', {
    "text": "Start: "+countdown
  });
  
  if (countdown < 1) {
    gameState = 1;
    countdown = startCountDown;
    gameLoop();
  } else {
    countdown--;
    setTimeout(() => {
      startSequence();
    }, 1000);
  }
}


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

    users[id].sprite = "square";//temperary

    // plungers
    for (var p=0;p < plungers.length; p++) {
      if ( collision(users[id], plungers[p]) ) {
        users[id].ammo += 1;
        //console.log(users[id].nickname, users[id].ammo);
        users[id].sprite = "squareb"; // temporary
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
          users[id].sprite = "squareg";
          oozes.splice(o, 1);
          o--;
        } else {
          users[id].sprite = "squareg";
        }
      }
    }
    // player collision
    for (var iden in users) {
      if (id === iden) {
        continue;
      }
      if ( collision(users[id], users[iden]) ) {
        PhysicsBumperCar(users[id], users[iden]);
      }
    }
    
    mapObjects.push({
      sprite: users[id].sprite,
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


///// GAME FUNCTIONS //////////////
User.prototype.clientData = function () {
  return {
    you: true,
    nickname: this.nickname,
    sprite: (this.sprite === "square" ? "you" : this.sprite),
    points: this.points,
    ammo: this.ammo,
    x: this.x,
    y: this.y,
    w: this.w,
    h: this.h
  };
}

const PLAYER_DV_MAX = 20;
const PLAYER_ACCEL_DV = 2;
const PLAYER_DECCEL_DV = 1;
User.prototype.move = function () {
  // up
  if (this.keystates.up) {
    if (this.dy < -PLAYER_DV_MAX) {
      this.DYretrograde();
    } else {
      this.dy = this.dy - PLAYER_ACCEL_DV;
    }
  }
  // down
  if (this.keystates.down) {
    if (this.dy > PLAYER_DV_MAX) {
      this.DYretrograde();
    } else {
      this.dy = this.dy + PLAYER_ACCEL_DV;
    }
  }
  // no up / down
  if (!this.keystates.up && !this.keystates.down) {
    this.DYretrograde();
  }

  // right
  if (this.keystates.right) {
    if (this.dx > PLAYER_DV_MAX) {
      this.DXretrograde();
    } else {
      this.dx = this.dx + PLAYER_ACCEL_DV;
    }
    
  }
  // left
  if (this.keystates.left) {
    if (this.dx < -PLAYER_DV_MAX) {
      this.DXretrograde();
    } else {
      this.dx = this.dx - PLAYER_ACCEL_DV;
    }
  }
  // no right / left
  if (!this.keystates.right && !this.keystates.left) {
    this.DXretrograde();
  }

  this.dy = Math.floor(this.dy);
  this.dx = Math.floor(this.dx);
  //this.x += this.dx;
  //this.y += this.dy;
  this.x = Math.max(0, Math.min(this.x + this.dx, mapWidth - this.w) );
  this.y = Math.max(0, Math.min(this.y + this.dy, mapHeight - this.h) );
}

User.prototype.DYretrograde = function() {
  let t = -Math.sign(this.dy);
  if (Math.abs(this.dy) > PLAYER_DV_MAX) {
    this.dy += t * 2 * PLAYER_DECCEL_DV;
  } else if (Math.abs(this.dy) > (PLAYER_DV_MAX / 2)) {
    this.dy += t * PLAYER_DECCEL_DV;
  } else {
    this.dy += t;
  }
}
User.prototype.DXretrograde = function() {
  let t = -Math.sign(this.dx);
  if (Math.abs(this.dx) > PLAYER_DV_MAX) {
    this.dx += t * 2 * PLAYER_DECCEL_DV;
  } else if (Math.abs(this.dx) > (PLAYER_DV_MAX / 2)) {
    this.dx += t * PLAYER_DECCEL_DV;
  } else {
    this.dx += t;
  }
}

// randomized player spawn positions
const PLAYER_SPAWN_RADIUS = 300;
User.prototype.spawnCircle = function () {
  let angle = Math.random() * 2 * Math.PI;
  this.y = Math.floor(mapHeight / 2) + PLAYER_SPAWN_RADIUS * Math.sin(angle);
  this.x = Math.floor(mapWidth / 2) + PLAYER_SPAWN_RADIUS * Math.cos(angle);
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

// object must have x,y,w,h to find center
function getCenter (object1) {
  return {
    x: object1.x + Math.floor(object1.w / 2),
    y: object1.y + Math.floor(object1.h / 2),
  };
}

// get angle between 2 object's center points
// angle is perspective to object 1
// (do negative -(value) to get other perspective)
function getAngle (object1, object2) {
  let obj1center = getCenter(object1);
  let obj2center = getCenter(object2);
  let rise = obj2center.y - obj1center.y;
  let run = obj2center.x - obj1center.x;
  return {
    rise: rise,
    run: run
  };
}

// bumper car physics for objects
// perspective to object 1
const BUMPER_MULTIPLIER = 0.325;
function PhysicsBumperCar (object1, object2) {
  let angle = getAngle(object1, object2);
  object1.dy += Math.floor(-angle.rise * BUMPER_MULTIPLIER);
  object1.dx += Math.floor(-angle.run * BUMPER_MULTIPLIER);
}