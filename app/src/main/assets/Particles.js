// Create an array for the particles
var particles = [];

function createParticleArray(xPos, yPos, theCanvasContext, spd, rad, partNumber)
{
	// Adds particles to the array
	for(var i = 0; i < partNumber; i++)
	{
		particles.push(new create(xPos, yPos, spd, rad));
	}
	renderP(theCanvasContext);
}

function create(startX, startY, speed, radius)
{
	// Point of touch
	this.x = startX;
	this.y = startY;

	// Add random velocity to each particle
	this.vx = RandomRange(-speed, speed);
	this.vy = RandomRange(-speed, speed);

	//Random shade of red will do for the explosion
	var red = Math.round(RandomRange(0, 255));
	var green = 0;
	var blue = 0;
	this.color = "rgba("+red+", "+green+", "+blue+", 0.5)";

	//Random size
	this.radius = RandomRange(radius, radius * 1.5);

	// fade value
	this.fade = RandomRange(0, 500);

	// particle dead
	this.dead = false;
}

// Render and move the particle
function renderP(theCanvasContext)
{
	var aCanvasContext = theCanvasContext;
	aCanvasContext.globalCompositeOperation = "source-over";
	// Reduce the opacity of the BG paint
	aCanvasContext.fillStyle = "rgba(0, 0, 0, 0.3)";
	// Blend the particle with the background
	aCanvasContext.globalCompositeOperation = "lighter";

	// Render the particles
	for(var t = 0; t < particles.length; t++)
	{
		var p = particles[t];

		aCanvasContext.beginPath();

		// Mix the colours
		var gradient = aCanvasContext.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
		gradient.addColorStop(0, "white");
		gradient.addColorStop(0.4, "white");
		gradient.addColorStop(0.4, p.color);
		gradient.addColorStop(1, "black");

		aCanvasContext.fillStyle = gradient;
		aCanvasContext.arc(p.x, p.y, p.radius, Math.PI*2, false);
		aCanvasContext.fill();

		// Add velocity
		p.x += p.vx;
		p.y += p.vy;

		// Decrease fade and if particle is dead remove it
		p.fade -= 10;

		if(p.fade < 0)
		{
			p.dead = true;
		}

		if(p.dead == true)
		{
			particles.splice(t,1);
		}
	}

	// Restore the opacity of the BG
	aCanvasContext.fillStyle = "rgba(0, 0, 0, 1)";
	aCanvasContext.globalCompositeOperation = "source-over";
}

//Random Range function from: https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function RandomRange(min, max) {
    return Math.random() * (max - min) + min;
}