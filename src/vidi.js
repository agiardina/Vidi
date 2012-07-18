
var vidi = function (canvas) {

	var VidiConstructor = function (canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.width = canvas.width;
		this.height = canvas.height;
	};
	
	VidiConstructor.prototype = vidi;
	
	return new VidiConstructor(canvas);
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
		
	for (i=0;i<len;i++) {
		//Don't touch the alpha channel
		if ((i+1) % 4 != 0) {
			data[i] = 255 - data[i];	
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