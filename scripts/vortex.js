// ------------------------------------------------------------------------------
// Vortex API

// Depends on Google's Polmery 'platinum-bluetooth' extension that wraps
// the native Web Bluetooth API.


function Vortex(deviceElement, writeElement, readElement) {

	var self = this;

	self.deviceElement = deviceElement;
	self.writeElement  = writeElement;
	self.readElement   = readElement;

	self.device    = undefined;
	self.connected = false;

	self.okToSend  = true;   // helps workaround https://bugs.chromium.org/p/chromium/issues/detail?id=531536

	self.currentFace       = 1;
	self.currentFaceColour = 'red';


	// ------------------------------------------------------------------------------
	// Class defs and methods

	// Command code map sent to Vortex
	Vortex.commandCode = {
		"MOVE"		: 0x20,
		"PIDLINE"	: 0x21,
		"TOP_LED"	: 0x03,
		"BOTTOM_LED": 0x01,
		"FACE"		: 0x02,
		"MUSICPLAY"	: 0x10,
		"MUSICSTOP"	: 0x11,
		"VOLUME"	: 0x12,
		"INIT"		: 0x60,
		"DANCE"		: 0x40
	};

	Vortex.LED = {
		LED1: 1<<1,
		LED2: 1<<2,
		LED3: 1<<3,
		LED4: 1<<4,
		LED5: 1<<5,
		LED6: 1<<6,
		LED7: 1<<7,
		LED_ALL: 0xFF
	}

	/**
	 * return color bit representation according to vortex protocol
	 * the color bit order is red, blue then green from MSB to LSB.
	 * @param {string} color string
	 */
	Vortex.translateColorBit = function(color){
		var colors = {
			"red"	: 0x1 << 2,
			"blue"	: 0x1 << 1,
			"green"	: 0x1,
			"pink"	: 0x1 << 2 | 0x1 << 1,
			"yellow": 0x1 << 2 | 0x1,
			"cyan"	: 0x1 << 1 | 0x1,
			"white"	: 0x1 << 2 | 0x1 << 1 | 0x1,
			"off"	: 0
		};
		return colors[color];
	}


	Vortex.bound = function (_number, _min, _max){
		return Math.max(Math.min(_number, _max), _min);
	};



	// ------------------------------------------------------------------------------
	// Bluetooth mehtods

	self.onConnect = function(device) {
		console.log("Connected");

		if (!self.writeElement) {
			throw "Write characteristic not set";
		}

		self.device = device;
		self.connected = true;
		self.okToSend = true;

		//initVortex();
		var cmd = Vortex.commandCode["INIT"];
		self.sendData([cmd]);
	}

	self.disconnect = function () {
		console.log("WARNING: Disconnected is not implemented yet...");
		//TODO: GATT service and device disconnection
		//self.device.disconnect().then(function() { self.connected=false });
	}

	self.isConnected = function() {
		return self.connected;
	};


	self.sendData = function (byteArray) {
		console.log(byteArray);
		var bytes = new Uint8Array(byteArray);
		if (self.connected && self.okToSend) {
			self.okToSend = false;
			self.writeElement.write(bytes).then(function() {
				self.okToSend = true;
			});
		} else {
			console.log("WARN: Write attempted on undefined characteristic, device not connected?");
		}
	}


	// ------------------------------------------------------------------------------
	// Vortex Commands



	/**
	 * Reset vortex status
	 * Stop the music and motors.
	 * Turn off top and bottom lights.
	 * Turn off facial expression.
	 */
	self.reset = function() {
		self.okToSend = true;
		seld.stopMotors();
		self.stopMusic();
		self.stopDance();
		self.faceOff();

		//top_led_off();
		//bottom_led_off();
	};


	// Below the 0's are dummy values ignored by the provided (from DFRobots Snap) vortex.js

	// ------------------------------------------------------------------------------
	// movement

	// leftSpeed :   int,    -127 to 127
	// rightSpeed:   int,    -127 to 127
	/**
	 * Move the wheels
	 * @param {number} left  wheel speed, -127 ~ +127
	 * @param {number} right wheel speed, -127 ~ +127
	 * @param {number} duration time in seconds
	 */
	self.setMotorSpeeds = function (left, right, duration) {
		var cmd = Vortex.commandCode["MOVE"];

		// bound the number from -127  ~ 127
		left	= Vortex.bound(left,  -127, 127);
		right	= Vortex.bound(right, -127, 127);

		var leftDirection = left >= 0 ? 1 << 7 : 0;
		var rightDirection = right >= 0 ? 1 << 7: 0;

		var leftSpeed = Math.abs(left);
		var rightSpeed = Math.abs(right);

		duration = duration || 0;
		duration = Math.floor(duration * 1000 / 20); // convert to second to units of 20 milliseconds
		duration = Vortex.bound(duration, 0, 255);

		self.sendData([cmd, leftDirection | leftSpeed , rightDirection | rightSpeed, duration]);
	};

	self.stopMotors = function () {
		self.setMotorSpeeds(0,0);
	}

	self.setPidEnabled = function(status)  {
		var cmd = Vortex.commandCode["PIDLINE"];
		self.sendData([cmd, status]);
	}

	// ------------------------------------------------------------------------------
	// Face

	/**
	 * Vortex facial expression
	 * @param {Array} data
	 *
	 * @param {number} expression index	1..33
	 * @param {string} color string [red | blue | green | pink | yellow | cyan | white | off] @seealso translateColorBit
	 */
	self.setFace = function(expression, color) {
		var cmd = Vortex.commandCode["FACE"];
		expression = Vortex.bound(expression, 0, 33);
		color = color || self.currentFaceColour
		self.currentFace = expression;
		self.currentFaceColour = color;
		color = Vortex.translateColorBit(color);
		self.sendData([cmd, expression, color]);
	};

	self.setFaceColour = function(colour) {
		self.setFace(self.currentFace, colour);
	}


		self.faceOff = function(expresion, colour) {
		self.setFace(0,"off");
	};


	// ------------------------------------------------------------------------------
	// Dancing

	/**
	 * Dance pattern
	 * @param {number} dance theme 0..4
	 */
	self.startDance = function(theme) {
		var cmd = Vortex.commandCode["DANCE"];
		theme = Vortex.bound(theme, 0, 4);
		self.sendData([cmd, theme]);
	};

	self.stopDance = function() {
		var cmd = Vortex.commandCode["DANCE"];
		self.sendData([cmd, 0xFF]);
	};


	// ------------------------------------------------------------------------------
	// Music

	/**
	 * Play music
	 * @param {number} music number
	 */
	self.startMusic = function(music) {
		var cmd = Vortex.commandCode["MUSICPLAY"];
		music = Vortex.bound(music, 0, 255);
		self.sendData([cmd, music, 0]);
	};

	self.stopMusic = function() {
		var cmd = Vortex.commandCode["MUSICSTOP"];
		self.sendData([cmd]);
	};



	/**
	 * Set music volume, can be called while playing music
	 * @param {number}  volume
	 */
	self.setVolume = function(volume){
		var cmd = Vortex.commandCode["VOLUME"];
		volume = Vortex.bound(volume, 0, 255);
		self.sendData([cmd, volume]);
	}



	self.setTopLED = function(address, r,g,b, duration){
		var cmd = Vortex.commandCode["TOP_LED"];
		self._led(cmd, address, r,g,b, duration);
	}

	self.setBottomLED = function(address, r,g,b, duration)  {
		var cmd = Vortex.commandCode["BOTTOM_LED"];
		self._led(cmd, address, r,g,b, duration);
	}


	self.setAllBottomLEDsOff = function() {
		self.setBottomLED(VortexAPI.LED_ALL, 0 ,0, 0);
	}


	self.setAllTopLEDsOff = function() {
		self.setTopLED(VortexAPI.LED_ALL, 0,0 ,0);
	}


	self._led = function(cmd, address, r, g, b, duration){
		console.log("led: ", cmd, address, r,g,b,duration);
		if (!cmd){
			log("Error: no led command");
			return;
		}

		duration = duration || 0;
		duration = Math.floor(duration * 1000 / 20)
		duration = Vortex.bound(duration, 0, 255);

		self.sendData([cmd, address, r, g, b, duration]);
	}


};



