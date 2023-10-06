"use strict";

const socket = io();

let nickname = prompt("Please enter a nickname :)");
socket.emit('nickname', nickname);

const c = document.getElementById("gameCanvas");
const gameview = c.getContext("2d");

///// Keyboard input //////////

var keystates = {
	"up": false,
	"down": false,
	"left": false,
	"right": false
};

// pressed = down
// key down = true
// key up   = false
function keyHandler(pressed, code, repeat) {
	if (repeat) {
		return;
	}
	switch(code) {
		case 'KeyW':
		case 'ArrowUp':
			keystates.up = pressed;
			break;
		case 'KeyA':
		case 'ArrowLeft':
			keystates.left = pressed;
			break;
		case 'KeyS':
		case 'ArrowDown':
			keystates.down = pressed;
			break;
		case 'KeyD':
		case 'ArrowRight':
			keystates.right = pressed;
			break;
		default:
			break;
	}
	socket.emit('keystate', keystates);
}

document.addEventListener("keydown", (event) => keyHandler(true, event.code, event.repeat) );
document.addEventListener("keyup", (event) => keyHandler(false, event.code, event.repeat) );

///// rendering /////////////

socket.on('gameState', (data) => {
	console.log(data);
	for (var i=0;i < data.length; i++) {
		console.log(data[i].x, data[i].y);
		if ( data[i].shape === "square" ) {
			gameview.fillStyle = "rgb(200, 0, 0)";
         	gameview.fillRect(data[i].x, data[i].y, 50, 50);
		}
	}
});

socket.on("*",function(event,data) {
    console.log(event);
    console.log(data);
});