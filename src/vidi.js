
var vidi = function (source, handler) {
	var VidiCanvasConstructor = function (source) {
			this.canvas = source;
			this.ctx = source.getContext('2d');
			this.width = source.width;
			this.height = source.height;
		},
	
		VidiVideoConstructor = function (source) {
			var canvas = document.createElement('canvas'),
				ctx = canvas.getContext('2d');
				
			canvas.width = source.videoWidth;
			canvas.height = source.videoHeight;
			canvas.setAttribute('style','display:none');
			document.body.appendChild(canvas);
			
			this.canvas = canvas;
			this.ctx = ctx;
			this.height = canvas.height;
			this.width = canvas.width;
			
			setInterval(function () {
				ctx.drawImage(source,0,0);
			},41);
			
		},
		 
		instance;
		
		
	if (source.getContext) {	
		VidiCanvasConstructor.prototype = vidi;
		instance = new VidiCanvasConstructor(source);
		handler.call(instance);
	} else if (source.play) {	
		VidiVideoConstructor.prototype = vidi;
		instance = new VidiVideoConstructor(source);
		setInterval(function () {
			handler.call(instance);
		},41)
	}

	return instance;
};

vidi.getImageData = function () {
	if (!this.imageData) {
		this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);	
	}
	return this.imageData;
};

vidi.invert = function () {
	var imageData = this.getImageData(),
		data = imageData.data,
		len = imageData.data.length,
		i;
	
	for (i=0;i<len-4;i=i+4) {
		//Don't touch the alpha channel
		data[i] = 255 - data[i];	
		data[i+1] = 255 - data[i+1];	
		data[i+2] = 255 - data[i+2];			
	}
	
	return this;
};

vidi.contrast = function (factor) {
	var imageData = this.getImageData(),
		data = imageData.data,
		len = imageData.data.length,
		i;

	for (i=0;i<len;i++) {
		data[i] = data[i] * factor;
		if (data[i] > 255) {
			data[i] = 255;
		} else if (data[i] < 0) {
			data[i] = 0;
		}
	}
	
	return this;
};

vidi.autoContrast = function () {
	var imageData = this.getImageData(),
		data = imageData.data,
		len = imageData.data.length,
		i,
		lowR = 255, highR = 0,
		lowG = 255, highG = 0,
		lowB = 255, highB = 0,
		rFact,gFact,bFact;
		
	for (i=0;i<len-4;i=i+4) {
		r = data[i];	
		g = data[i+1];	
		b = data[i+2];
		if (r < lowR) lowR = r;
		if (r > highR) highR = r;
		if (g < lowG) lowG = g;
		if (g > highG) highG = g;
		if (b < lowB) lowB = b;
		if (b > highB) highB = b;
	}
	
	rFact = 255 / (highR-lowR);
	gFact = 255 / (highG-lowG);
	bFact = 255 / (highB-lowB);
	
	for (i=0;i<len-4;i=i+4) {
		r = data[i];	
		g = data[i+1];	
		b = data[i+2];
		
		data[i] = (r - lowR) * rFact;
		data[i+1] = (g - lowG) * gFact;
		data[i+2] = (b - lowB) * bFact;
	}	
	
			
	return this;
};

vidi.brightness = function (factor) {
	var imageData = this.getImageData(),
		data = imageData.data,
		len = imageData.data.length,
		i;		
	
	for (i=0;i<len-4;i=i+4) {
		data[i] += factor;
		data[i+1] += factor;
		data[i+2] += factor;		
	}
	
	return this;
};

vidi.toGray = function () {
	var imageData = this.getImageData(),
		data = imageData.data,
		len = imageData.data.length,
		i;		
	
	for (i=0;i<len-4;i=i+4) {
		r = data[i] * 0.309;	
		g = data[i+1] * 0.609;	
		b = data[i+2] * 0.082;			
		gray = r + g + b;
		data[i] = gray;
		data[i+1] = gray;
		data[i+2] = gray;		
	}
	
	return this;
};

vidi.threshold = function (level) {
	var imageData = this.getImageData(),
		data = imageData.data,
		len = imageData.data.length,
		i;
	
	level = level || 128;
	this.toGray();
	for (i=0;i<len-4;i=i+4) {
		if (data[i] < level) {
			data[i] = 0;
			data[i+1] = 0;
			data[i+2] = 0;
		} else {
			data[i] = 255;
			data[i+1] = 255;
			data[i+2] = 255;		
		}
	}
	
	return this;	
};


//Clean the imageData buffer
vidi.flush = function () {
	this.imageData = null;
};

//Target
vidi.show = function (target) {
	if (target) {
		target.width = this.imageData.width;
		target.height = this.imageData.height;
	} else {
		target = this.canvas;
	}
	target.getContext('2d').putImageData(this.imageData,0,0);
	this.flush();
};