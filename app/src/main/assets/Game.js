var lastPt=null;
var canvasX;
var canvasY;
var canvas;
var canvasContext;

var devOrientation = {devXValue:0,devYValue:0,devRotationValue:0};

//websockets section --------------------------------
var highScore = 0;
var score = 0;

//create a new websocket to connect to our server (on the amazon web services cloud)
var ws = new WebSocket('ws://54.229.109.127:8080/');
var account = "";
var reloadScores = true;
var updateScores = true;

function log(msg) {
    console.log(msg + '\n');
  }

ws.onopen = function() { //called when a websocket connection is established
    log('CONNECT');
  };

  ws.onclose = function() { //as above but for closing connections
    log('DISCONNECT');
	ws.send("-1"); //opcode to close the connection
  };

  var found = false;
  LogData = function(data) //utility function to log results of the communication to the console
  {
    if (found)
    {
      log ("user found, score is " + data);
    }
    else
    {
      log("user not found, creating new user");
      log("score = 0");
    }
  }

  ws.onmessage = function(event) { //core of the online component, this function parses data from the server and updates the high score
    var result = event.data.split("$");
    
    log('MESSAGE: ' + event.data);
    
    switch (result[0])
    {
      case "found":
        found = true;
        highScore = result[1];
        LogData(result[1]);
      break;

      case "new":
        found = false;
      break;
    }
  };

//end section ---------------------------------------

function resizeCanvas() //resizes the canvas to fit the window
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function load() //called when the page is loaded
{
	canvas = document.getElementById('gameCanvas');
	canvasContext = canvas.getContext('2d');

	canvasX = canvas.width/2;
	canvasY = canvas.height-30;

	init();
}

//the scene will hold and update all active GameObjects
var scene = [];

function init()
{
	if (canvas.getContext)
	{
		//Set Event Listeners for window, mouse and touch
		window.addEventListener('resize', resizeCanvas, false);
		window.addEventListener('orientationchange', resizeCanvas, false);

		canvas.addEventListener("touchstart", touchDown, false);
		canvas.addEventListener("touchmove", touchXY, true);
		canvas.addEventListener("touchend", touchUp, false);

		document.body.addEventListener("touchcancel", touchUp, false);

		//sets up listener for the device orientation, NOTE: more than one way is available to set up this listener, but this one works in Chrome
		if (window.DeviceOrientationEvent)
		{
			window.addEventListener("deviceorientation", getDevOrientation,false);
		}
		else
		{
			console.log("This browser doesn't support Device Orientation");
		}
	}

	resizeCanvas();

	startTimeMS = Date.now();

	//we start at the menu scene
	SetupMenu(); //look in Classes.js
	InitScene();

	//start the game
	gameLoop();
}

function gameLoop()
{
	//this initializes our account to use in our websocket routines
	if (ws.readyState === ws.OPEN && account == "")
	{
		account = window.prompt("Enter your name","");
		ws.send(account); //sending the name of the account we are working with
		ws.send("1"); //send the opcode that retrieves the high score
	}
	if (ws.readyState === ws.OPEN && reloadScores)
	{
		ws.send("1");
		reloadScores = false;
	}

	var elapsed = (Date.now() - startTimeMS)/1000;
	update(elapsed);
	collisionDetection();
	render(elapsed);
	startTimeMS = Date.now();
	requestAnimationFrame(gameLoop);
}

function render(delta)
{
	canvasContext.clearRect(0,0,canvas.width, canvas.height);


	//render all GameObjects
	for (var i = 0; i < scene.length; i++)
	{
		scene[i].render();
	}

	//render particle systems on top
	if(particles.length > 0)
	{
		renderP(canvasContext);
	}

	//finally render GUI
	for (var i = 0; i < scene.length; i++)
	{
		scene[i].renderGUI();
	}
}

function update(delta) //calls Update on every object in the scene
{
	for (var i = 0; i < scene.length; i++)
	{
		scene[i].Update();
	}
}

function collisionDetection() //simple AABB collision check that notifies colliders of the collision
{
	for (var i = 0; i < scene.length - 1; i++)
	{
	var coll1 = scene[i];
	for (var j = i; j < scene.length; j++)
		{
			var coll2 = scene[j];
			//check for AABB collisions
			if (coll1.x + coll1.sImage.width > coll2.x && coll1.y + coll1.sImage.height > coll2.y && coll1.x < coll2.x + coll2.sImage.width && coll1.y < coll2.y + coll2.sImage.height)
			{
				//notify colliders
				coll1.OnCollision(coll2);
				coll2.OnCollision(coll1);
			}
		}
	}
}

function styleText(txtColour, txtFont, txtAlign, txtBaseline) //utility function ised to style text in a single call
{
	canvasContext.fillStyle = txtColour;
	canvasContext.font = txtFont;
	canvasContext.textAlign = txtAlign;
	canvasContext.textBaseline = txtBaseline;
}

function touchUp(evt)
{
	evt.preventDefault();
	// Terminate touch path
	lastPt=null;
}

function touchDown(evt) //joke to be made aout american football is unfortunately missing
{
	evt.preventDefault();
	touchXY(evt);
}

function touchXY(evt) //other than setting up our last touched position, this function also checks if the touch happened inside an object's bounding box and calls the OnTouch() method in it
{
	evt.preventDefault();
	if(lastPt!=null)
	{
		var touchX = evt.touches[0].pageX - canvas.offsetLeft;
		var touchY = evt.touches[0].pageY - canvas.offsetTop;
	}
	lastPt = {x:evt.touches[0].pageX, y:evt.touches[0].pageY};
	
	//check we clicked on an object
	for (var i = 0; i < scene.length; i++)
	{
		if (lastPt.x > scene[i].x && lastPt.y > scene[i].y && lastPt.x < scene[i].x + scene[i].sImage.width && lastPt.y < scene[i].y + scene[i].sImage.height)
			scene[i].OnTouch();
	}

	//createParticleArray(lastPt.x, lastPt.y, canvasContext);
}

function getDevOrientation(evt) //gets the device orientation, on some devices...
{
	devOrientation.devXValue = Math.round(evt.gamma);
	devOrientation.devYValue = Math.round(evt.beta);
	devOrientation.devRotationValue = Math.round(evt.alpha);
}