
var Vidi = function (source) {
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

//Clean the imageData buffer
Vidi.prototype.flush = function () {
	this.imageData = null;
};

//Target
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

(function () {
    var actions = ['autoContrast','invert','toGray','sobelEdgeDetect'];

    actions.forEach(function (action) {
        Vidi.prototype[action] = function () {
            this.imageData = Vidi[action](this.imageData);
            return this;
        };
    });

    Vidi.prototype.contrast = function (factor) {
        this.imageData = Vidi.contrast(this.imageData,factor);
        return this;
    };

    Vidi.prototype.brightness = function (factor) {
        this.imageData = Vidi.brightness(this.imageData,factor);
        return this;
    };

    Vidi.prototype.customFilter = function (filter) {
        this.imageData = Vidi.customFilter(this.imageData,filter);
        return this;
    };

    Vidi.prototype.boxFilter = function (sizeX,sizeY) {
        this.imageData = Vidi.boxFilter(this.imageData,sizeX,sizeY);
        return this;
    };


}());

