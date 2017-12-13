class GameObject //the base class for every object that will be contained by scenes in the game, the building block of the engine
{
	constructor(name, x, y, imageSRC, velx, vely)
	{
		this.name = name;
		this.zindex = 0;
		this.x = x;
		this.y = y;
		this.vx = velx;
		this.vy = vely;
		this.sImage = new Image();
		this.sImage.src = imageSRC;
	}

	// Methods
	Start(){} //will be overridden by derivative classes, gets called once every time the InitScene() function is called

	Update(){} //will be overridden by derivative classes, gets called by the engine at every ick

	OnTouch(){} //will be overridden by derivative classes, gets called by the engine when a touch is within the boundaries of the GameObject

	OnCollision(collider){} //gets called by the engine whenever this object is colliding with another one, in the CollisionDetection() function

	render() //gets called every tick by the engine, just before the particle systems are rendered
	{
		canvasContext.drawImage(this.sImage, this.x, this.y);
	}

	renderGUI(){} //will be overridden by derivative classes, gets called last during the rendering routine in the engine

	//the following getters are self-explanatory
	SetPos(newX,newY)
	{
		this.x = newX;
		this.y = newY;
	}

	GetPos()
	{
		var pos = []
		pos[0] = this.x;
		pos[1] = this.y;
		return pos;
	}

	GetDimensions()
	{
		var dim = []
		dim[0] = this.sImage.width;
		dim[1] = this.sImage.height;
		return dim;
	}
}


class Ship extends GameObject //the ship is the player controlled object
{
	Start() //on start it gets positioned in the center of the screen, just above the score counter
	{
		super.SetPos((canvas.width / 2) - (this.sImage.width / 2),canvas.height - this.sImage.height - 60);
	}

	Update() //on update, it updates the score and then it moves left and right unless the next movement would put it outside the boundaries of the canvas
	{
		score += 1;
		this.vx = devOrientation.devRotationValue / 10; //orientation left and right, thus need the alpha rotation. Divide by 100 to normalize
		//this.vy = devOrientation.devYValue;

		//only move if movement does not take us off screen
		if (this.x + this.vx > 0 && this.x + this.vx < canvas.width - this.sImage.width)
		{
			this.x += this.vx;
		}

		//this.y += this.vy;
	}

	OnCollision(collider) //if it collides with an asteroid, a particle system is created, audio is played and the game over timer object is added to the scene, then this object gets removed.
	{
		if (collider.name == "Asteroid")
		{
			audioManager.PlayAudio("Explosion", false);
			createParticleArray(this.x + this.sImage.width / 2, this.y + this.sImage.height / 2, canvasContext, 5, 15, 50);
			scene.push(gameOverTimer);
			gameOverTimer.Start();
			var index = scene.indexOf(playerShip);
			scene.splice(index, 1); //removes object from scene
		}
	}
}

class Asteroid extends GameObject //the asteroid simply starts at a random position on to of the screen and then it procedes moving forward until it passes the bottom of the screen.
{
	Start()
	{
		super.SetPos(RandomRange(-this.sImage.width / 2, canvas.width - this.sImage.width / 2), -this.sImage.height);
	}

	Update()
	{
		super.SetPos(this.x, this.y + 5);
		if (this.y > canvas.height)
		{
			var index = scene.indexOf(this);
			scene.splice(index, 1); //removes object from scene
		}
	}
}

class Background extends GameObject
{
	render()
	{
		canvasContext.drawImage(this.sImage, -this.sImage.width / 2, 0, this.sImage.width * 4, this.sImage.height * 4);
	}
}

class ScrollingBackground extends GameObject //this class allow for its image to look like it is scrolling
{
	constructor(name, x, y, imageSRC, velx, vely)
	{
		super(name, x, y, imageSRC, velx, vely);
		this.delta = 0;
	}

	Update()
	{
		this.delta += 10;
		if (this.delta > this.sImage.height * 2)
		{
		this.delta = 0;
		}
	}

	render()
	{
		//overriding the render() method allows us to draw 2 images, one on top of the other, the bottom image will then be traslated on top in the Update(), giving the impression that it is just scrolling down
		canvasContext.save();
		canvasContext.translate(0, this.delta);
		canvasContext.drawImage(this.sImage, 0, 0, this.sImage.width * 2, this.sImage.height * 2);
		canvasContext.drawImage(this.sImage,0, -this.sImage.height * 2, this.sImage.width * 2, this.sImage.height * 2);
		canvasContext.restore();
	}
}


//BUTTONS
class StartBtn extends GameObject //the start button is both responsible to start the game on touch and also to draw the title and high score for the player
{
	Start()
	{
		score = 0;
	}

	OnTouch()
	{
		SetupGame();
		InitScene();
	}

	renderGUI()
	{
		//draw title
		styleText('yellow', '120px Impact', 'center', 'middle');
		canvasContext.fillText("SPACE EVADERS", canvas.width/2, canvas.height/3);

		//draw player name and score
		styleText('white', '90px Verdana', 'center', 'middle');
		canvasContext.fillText(account, canvas.width/2, canvas.height/3 * 2);
		canvasContext.fillText(highScore, canvas.width/2, canvas.height/3 * 2 + 80);

		//draw instructions
		canvasContext.fillStyle = 'black';
		canvasContext.fillRect(0, canvas.height - 60, canvas.width, canvas.height);
		styleText('yellow', '45px Verdana', 'center', 'middle');
		canvasContext.fillText("Tilt the phone to avoid incoming asteroids", canvas.width / 2, canvas.height - 30);
	}
}

class MenuBtn extends GameObject //the menu button is both responsible for going back to the start screen and to update the high score to the server
{
	Start()
	{
		console.log("Connecting");
		this.SetPos(canvas.width / 2 - menuBtn.sImage.width / 2, canvas.height / 3 * 2);
	}

	OnTouch()
	{
		reloadScores = true; //this flag is set to tell the Init function in the engine to reload the high score from the server
		SetupMenu();
		InitScene();
	}

	Update()
	{
		if (score > Number(highScore) && updateScores) //NOTE: the way this protocol of websockets work is explained in detail in the blog
		{
			ws.send("2"); //opcode to modify high score
			ws.send(score.toString());
			updateScores = false;
		}
	}

	renderGUI()
	{
		//draw player name and score
		styleText('yellow', '90px Impact', 'center', 'middle');
		canvasContext.fillText("SCORE", canvas.width/2, canvas.height/2);
		canvasContext.fillText(score, canvas.width/2, canvas.height/2 + 80);
	}
}


//UTILITIES
class AsteroidGenerator extends GameObject //this class is responsible both for spawning asteroids on a random timer and for drawing the score at the bottom of the screen
{
	constructor(name, x, y, imageSRC, velx, vely)
	{
		super(name, x, y, imageSRC, velx, vely);

		this.timer = 0;
		this.spawnTime = RandomRange(90, 150); //between 1.5 seconds and 2.5 (considering the game runs at 60fps)
	}

	Start()
	{
		this.timer = 0;
	}

	Update()
	{
		this.timer += 1;
		if (this.timer >= this.spawnTime)
		{
			this.SpawnAsteroid();
			this.timer = 0;
			this.spawnTime = RandomRange(90, 150);
		}
	}

	renderGUI()
	{
		//draw score
		canvasContext.fillStyle = 'black';
		canvasContext.fillRect(0, canvas.height - 60, canvas.width, canvas.height);
		styleText('yellow', '45px Verdana', 'center', 'middle');
		canvasContext.fillText("SCORE : " + score, canvas.width / 2, canvas.height - 30);
	}

	SpawnAsteroid()
	{
		var asteroid = new Asteroid("Asteroid",0,0,"Asteroid.png",0,0);
		scene.push(asteroid);
		asteroid.Start();
	}
}

class GameOverTimer extends GameObject //this class takes care of loading the game over screen once the timer its on runs out
{
	constructor(name, x, y, imageSRC, velx, vely)
	{
		super(name, x, y, imageSRC, velx, vely);

		this.timer = 0;
		this.endTime = 150;
	}

	Start()
	{
		this.timer = 0;
	}

	Update()
	{
		this.timer += 1;
		if (this.timer >= this.endTime)
		{
			SetupGameOverScreen();
			updateScores = true;
		}
	}
}

class AudioManager //the audio manager takes care of loading, storing, playing and stopping sounds, it is explained in more detail in the blog and wiki
{
	constructor()
	{
		this.clips = [];
		this.names = [];
	}

	LoadAudio(name, path)
	{
		var audioClip = new Audio();
		audioClip.src = path;
		this.clips.push(audioClip);
		this.names.push(name);
	}

	PlayAudio(name, looping)
	{
		for (var i = 0; i < this.clips.length; i++) {
			if (this.names[i] == name)
			{
				this.clips[i].loop = looping;
				this.clips[i].play();				
			}
		}
	}

	StopAllAudio()
	{
		for (var i = 0; i < this.clips.length; i++) {
			{
				this.clips[i].pause();
				this.clips[i].currentTime = 0;
			}
		}
	}
}


//SCENE MANAGEMENT - in this section all objects are created and sounds are loaded, in the following functions, scenes are populated using these objects
var menuBackground = new Background("menuBkg",0,0,"space.jpg",0,0);
var gameBackground = new ScrollingBackground("Bkg",0,0,"Starfield.png",0,0);
var startBtn = new StartBtn("StartButton",0,0,"button_start.png",0,0);
var menuBtn = new MenuBtn("MenuButton",0,0,"button_main-menu.png",0,0);
var playerShip = new Ship("Player",0,0,"Ship.jpg",0,0);
var generator = new AsteroidGenerator("Generator",0,0,"BlankSpr.png",0,0);
var gameOverTimer = new GameOverTimer("GOTimer",0,0,"BlankSpr.png",0,0);

var audioManager = new AudioManager();
audioManager.LoadAudio("MenuMusic", "MenuLoop.wav");
audioManager.LoadAudio("GameMusic", "GameLoop.wav");
audioManager.LoadAudio("Explosion", "Xplosion.mp3");
audioManager.LoadAudio("Over", "GameOver.wav");

InitScene = function() //initialises all the objects in the scene
{
	//initialise all objects
	for (var i = 0; i < scene.length; i++)
	{
		scene[i].Start();
	}
}

ClearScene = function()
{
	scene = [];
}

SetupMenu = function() //sets up the menu screen
{
	ClearScene();
	audioManager.StopAllAudio();
	audioManager.PlayAudio("MenuMusic", true);

	scene.push(menuBackground);
	scene.push(startBtn);
	startBtn.SetPos(canvas.width / 2 - startBtn.sImage.width / 2, canvas.height / 2);
}

SetupGame = function() //sets up game screen
{
	ClearScene();
	audioManager.StopAllAudio();
	audioManager.PlayAudio("GameMusic", true);

	scene.push(gameBackground);
	scene.push(generator);
	scene.push(playerShip);
	InitScene();
}

SetupGameOverScreen = function() //sets up game over screen
{
	ClearScene();
	audioManager.StopAllAudio();
	audioManager.PlayAudio("Over");
	scene.push(menuBackground);
	scene.push(menuBtn);
	InitScene();
}