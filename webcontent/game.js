"use strict";

const socket = io();

let nickname = prompt("Please enter a nickname :)");
socket.emit('nickname', nickname);

const c = document.getElementById("gameCanvas");
const gameview = c.getContext("2d");

const cHeight = c.height;
const cWidth = c.width;

const gameBackgroundImage = new Image();
gameBackgroundImage.src = "/assets/map/futuristic.svg";

const plunger = new Image();
plunger.src = "/assets/sprites/plunger.svg";

///// Start Button ///////////

function start() {
	socket.emit('start');
}


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

socket.on('pregame', (data) => {
	gameview.fillStyle = "#333333";
 	gameview.fillRect(0, 0, 900, 900);
	gameview.font = "48px Comic Sans MS";
	gameview.fillStyle = "#f39c12";
	gameview.fillText(
		data.text , 200, 400
	);
	if ( data.nickname != undefined ) {
		gameview.font = "28px Comic Sans MS";
		gameview.fillText(
			"Nickname: "+data.nickname,
			300, 200
		);
	}
});

socket.on('endgame', (data) => {
	gameview.fillStyle = "#333333";
 	gameview.fillRect(0, 0, 900, 900);
	gameview.font = "24px Comic Sans MS";
	gameview.fillStyle = "#f39c12";
	gameview.fillText("<-- Press Start to begin a new game!", 30, 30);
	gameview.fillText("Leaderboard:", 30, 90);

	gameview.font = "20px Comic Sans MS";
	for (var i=0;i < data.length; i++) {
		gameview.fillText(
			data[i].points+
			" : "+
			data[i].nickname, 30, (114+24*i));
	}
});

socket.on('gameState', (data) => {
	gameview.drawImage(gameBackgroundImage, 0, 0, cWidth, cHeight);
	//console.log(data);
	for (var i=0;i < data.length; i++) {
		//console.log(data[i].x, data[i].y);
		if ( data[i].sprite === "square" ) {
			gameview.fillStyle = "rgb(200, 0, 0)";
         	gameview.fillRect(data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "squareb" ) {
			gameview.fillStyle = "rgb(0, 50, 200)";
         	gameview.fillRect(data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "squareg" ) {
			gameview.fillStyle = "rgb(50, 200, 50)";
         	gameview.fillRect(data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "ooze" ) {
			gameview.fillStyle = "rgb(100, 255, 100)";
         	gameview.fillRect(data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "gooze" ) {
			gameview.fillStyle = "rgb(150, 255, 150)";
         	gameview.fillRect(data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "plunger" ) {
			gameview.drawImage(plunger, data[i].x, data[i].y, data[i].w, data[i].h);
		}
		if ( data[i].you ) {
			// render your sprite
			if (data[i].sprite === "you") {
				gameview.fillStyle = "rgb(250, 200, 0)";
				gameview.fillRect(data[i].x, data[i].y, data[i].w, data[i].h);
			} else {}
			// render a ui
			gameview.font = "15px MS Gothic";
			gameview.fillStyle = "rgb(0, 0, 0)";
			gameview.fillText(
				"Name: "+data[i].nickname+
				"\nPoints: "+data[i].points+
				"\nAmmo: "+data[i].ammo , 20, 20
			);
		}
	}
});

socket.on("*",function(event,data) {
    console.log(event);
    console.log(data);
});