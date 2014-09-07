//Constructor
var Vidi = function Vidi (source) {
    var image;

    this.source = source;

    this.canvas = document.createElement('canvas');

    if (source.constructor.name === 'HTMLCanvasElement') {
        this.canvas.width = source.width;
        this.canvas.height = source.height;
    } else if (source.constructor.name === 'HTMLImageElement') {
        image = new Image();
        image.src = source.getAttribute('src');
        this.canvas.width = image.width;
        this.canvas.height = image.height;
    }


    this.context = this.canvas.getContext('2d');
    this.context.drawImage(source,0,0);
    this.imageData = this.context.getImageData(0,0,this.canvas.width,this.canvas.height);
};

//Core functions
Vidi.prototype.flush = function () {
	this.imageData = null;
};

Vidi.prototype.show = function (target) {
    var dataURL;

    if (!target) {
        target = this.source;
    }

    if (target.getContext) {
        target.getContext('2d').putImageData(this.imageData,0,0);
    } else {
        this.context.putImageData(this.imageData,0,0);
        dataURL = this.canvas.toDataURL();
        target.setAttribute('src',dataURL);
    }
};


//Point Operations
Vidi.prototype.invert = function () {
    Vidi.invert(this.imageData);
    return this;
};

Vidi.prototype.contrast = function (factor) {
    Vidi.contrast(this.imageData,factor);
    return this;
};

Vidi.prototype.autoContrast = function () {
    Vidi.autoContrast(this.imageData);
    return this;
};

Vidi.prototype.brightness = function (factor) {
    Vidi.brightness(this.imageData,factor);
    return this;
};

Vidi.prototype.toGray = function () {
    Vidi.toGray(this.imageData);
    return this;
};

Vidi.prototype.threshold = function (level) {
    Vidi.threshold(this.imageData,level);
    return this;
};


//Filters
Vidi.prototype.customFilter = function (filter) {
    Vidi.customFilter(this.imageData,filter);
    return this;
};

Vidi.prototype.boxFilter = function (sizeX,sizeY) {
    Vidi.boxFilter(this.imageData,sizeX,sizeY);
    return this;
};