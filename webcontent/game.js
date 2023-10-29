"use strict";

const socket = io();

let nickname = prompt("Please enter a nickname :)");
socket.emit('nickname', nickname);

const c = document.getElementById("gameCanvas");
const gameview = c.getContext("2d");

const cHeight = c.height;
const cWidth = c.width;

////// Image Loading /////////////////
const gameBackgroundImage = new Image();
gameBackgroundImage.src = "/assets/map/tile_wet_floor.svg";

const plunger = new Image();
plunger.src = "/assets/sprites/plunger.svg";

const ooze = new Image();
ooze.src = "/assets/sprites/ooze.svg";

const gooze = new Image();
gooze.src = "/assets/sprites/gooze.svg";

const panther = new Image();
panther.src = "/assets/sprites/panther.svg";

const youPanther = new Image();
youPanther.src = "/assets/sprites/you_panther.svg";

const toiletOoze = new Image();
toiletOoze.src = "/assets/sprites/ooze_toilet.svg";

const bgm = new Audio();
bgm.src = "/assets/audio/toiletpanther.wav";
bgm.loop = false;

const prebeats = new Audio();
prebeats.src = "/assets/audio/toiletbeat.wav";
prebeats.loop = false;

const toiletSlosh = new Audio();
toiletSlosh.src = "/assets/audio/waterslosh.wav";

const pop = new Audio();
pop.src = "/assets/audio/pop.wav";

const plunge = new Audio();
plunge.src = "/assets/audio/handsanitizer.wav";

const bump = new Audio();
bump.src = "/assets/audio/marker.wav";

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
	} else {
		if (prebeats.loop === false) {
			prebeats.currentTime = 0;
			prebeats.play();
			prebeats.loop = true;
		}
	}
});

socket.on('endgame', (data) => {
	bgm.pause();
	bgm.loop = false;
	bgm.currentTime = 0;
	prebeats.loop = false;
	prebeats.currentTime = 0;
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
	if (bgm.loop === false) {
		bgm.loop = true;
		bgm.currentTime = 0;
		bgm.play();
		prebeats.pause();
		prebeats.loop = false;
	}
	gameview.drawImage(gameBackgroundImage, 0, 0, cWidth, cHeight);
	//console.log(data);
	for (var i=0;i < data.length; i++) {
		//console.log(data[i].x, data[i].y);
		if ( data[i].sprite === "panther" ) {
			gameview.drawImage(panther, data[i].x, data[i].y, data[i].w, data[i].h);
		}/* else if ( data[i].sprite === "squareb" ) {
			gameview.drawImage(panther, data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "squareg" ) {
			gameview.drawImage(panther, data[i].x, data[i].y, data[i].w, data[i].h);
		}*/ else if ( data[i].sprite === "ooze" ) {
         	gameview.drawImage(ooze, data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "gooze" ) {
			gameview.drawImage(gooze, data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "plunger" ) {
			gameview.drawImage(plunger, data[i].x, data[i].y, data[i].w, data[i].h);
		} else if ( data[i].sprite === "toilet" ) {
			gameview.drawImage(toiletOoze, data[i].x, data[i].y, data[i].w, data[i].h);
		}
		if ( data[i].you ) {
			// render your sprite
			if (data[i].sprite === "you") {
				gameview.drawImage(youPanther, data[i].x, data[i].y, data[i].w, data[i].h);
			} else {}
			// render a ui
			gameview.font = "15px MS Gothic";
			gameview.fillStyle = "rgb(0, 0, 0)";
			gameview.fillText(
				"Name: "+data[i].nickname+
				"\nPoints: "+data[i].points+
				"\nAmmo: "+data[i].ammo , 20, 20
			);
			// soundfx
			if (data[i].sound === "slosh") {
				toiletSlosh.play();
			} else if (data[i].sound === "pop") {
				pop.play();
			} else if (data[i].sound === "plunge") {
				plunge.play();
			} else if (data[i].sound === "bump") {
				bump.play();
			}
		}
	}
});

socket.on("*",function(event,data) {
    console.log(event);
    console.log(data);
});