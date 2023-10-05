"use strict";

const socket = io();

let nickname = prompt("Please enter a nickname :)");
socket.emit('nickname', nickname);

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