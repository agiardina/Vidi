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
};;(function(vidi) {

    "use strict";

    function getEuclideanRGBDistance (color1, color2) {
        return Math.sqrt(
                Math.pow((color1[0]-color2[0]),2) +
                Math.pow((color1[1]-color2[1]),2) +
                Math.pow((color1[2]-color2[2]),2));
    }

    function getColors(imageData) {
        var pixels,
            len,
            i,
            current_color,
            counter,
            colors,
            r,
            g,
            b,
            profiler = vidi.timer();

        profiler.silent = true;

        pixels = vidi.getDataAsPixels(imageData.data);
        profiler.time('getDataAsPixels');
        pixels = vidi.radixSort(pixels);
        profiler.time('radixSort');

        current_color = pixels[0];
        counter = 1;

        len = pixels.length;
        colors = [];
        for (i=1;i<len;i++) {
            if (pixels[i] !== pixels[i-1]) {
                r = current_color >> 16 & 0x0000FF;
                g = current_color >> 8 & 0x0000FF;
                b = current_color & 0x0000FF;
                colors.push([r,g,b,counter]);
                current_color = pixels[i];
                counter = 1;
            } else {
                counter++;
            }
        }
        colors.push([r,g,b,counter]);

        profiler.time('colors push');

        colors.sort(function (c1,c2) {
            return c2[1] - c1[1];
        });

        profiler.time('colors sort');

        return colors;
    }

    function findRepresentativeColors(imageData,kMax) {
        var CR = [],
            C,
            B,
            b,
            b0,
            k,
            done,
            split,
            profiler = Vidi.timer();


        function createColorBox(C,level) {
            var i= C.length,
                color,
                rMin = 255,
                rMax = 0,
                gMin = 255,
                gMax = 0,
                bMin = 255,
                bMax = 0;

            while (i) {
                i--;
                color = C[i];
                if (color[0] < rMin) {
                    rMin = color[0];
                }
                if (color[0] > rMax) {
                    rMax = color[0];
                }
                if (color[1] < gMin) {
                    gMin = color[1];
                }
                if (color[1] > gMax) {
                    gMax = color[1];
                }
                if (color[2] < bMin) {
                    bMin = color[2];
                }
                if (color[2] > bMax) {
                    bMax = color[2];
                }
            }

            return {
                colors: C,
                level: level,
                rMin: rMin,
                rMax: rMax,
                gMin: gMin,
                gMax: gMax,
                bMin: bMin,
                bMax: bMax
            };
        }

        function findBoxToSplit(B) {
            var i,
                len = B.length,
                boxToSplit = null,
                iBoxToSplit,
                boxColorCount,
                boxLevel,
                minLevel = Number.MAX_VALUE,
                currentBox;

            for (i=0;i<len;i++) {
                currentBox = B[i];
                boxColorCount = currentBox.colors.length;
                boxLevel = currentBox.level;

                if (boxColorCount >= 2) { //Number of colors inside the box
                    if (boxLevel < minLevel) {
                        boxToSplit = currentBox;
                        minLevel = boxLevel;
                        iBoxToSplit = i;
                    }
                }
            }

            //Remove the box to split from the collection of box
            if (boxToSplit) {
                B.splice(iBoxToSplit,1);
            }

            return boxToSplit;
        }

        function findMaxBoxDimension(b) {
            var sizeR = b.rMax - b.rMin,
                sizeG = b.gMax - b.gMin,
                sizeB = b.bMax - b.bMax,
                sizeMax = Math.max(sizeR, sizeG, sizeB);
            
            if (sizeMax === sizeR) {
                return 0;
            } else if (sizeMax === sizeG) {
                return 1;
            } else {
                return 2;
            }

        }

        function splitBox(b) {
            var m = b.level,
                d = findMaxBoxDimension(b),
                median,
                C = b.colors,
                C1,
                C2,
                b1,
                b2;

            C.sort(function (c1,c2) { //Sort the colors array according to the max box dimension
                return c1[d] - c2[d];
            });

            median = parseInt(C.length/2);
            C1 = C.slice(0,median);
            C2 = C.slice(median);
            b1 = createColorBox(C1,m+1);
            b2 = createColorBox(C2,m+1);

            return [b1,b2];
        }

        function averageColor(box) {
            var C = box.colors,
                c,
                n = 0,
                rSum = 0,
                gSum = 0,
                bSum = 0,
                rAvg,
                gAvg,
                bAvg,
                i = C.length,
                k,
                r,
                g,
                b;

            while (i) {
                i--;
                c = C[i]; //The current color

                r = c[0];
                g = c[1];
                b = c[2];
                k = c[3]; //N. color

                n = n + k;

                rSum = rSum + (k*r);
                gSum = gSum + (k*g);
                bSum = bSum + (k*b);
            }

            rAvg = parseInt(rSum/n);
            gAvg = parseInt(gSum/n);
            bAvg = parseInt(bSum/n);

            return [rAvg,gAvg,bAvg];
        }

        C = getColors(imageData);
        if (C.length <= kMax) {
            CR = C;
        } else {
            b0 = createColorBox(C,0);
            B = [b0];
            k = 1;
            done = false;
            while (k<kMax && !done) {
                b = findBoxToSplit(B);
                if (b) {
                    split = splitBox(b);
                    B = B.concat(split);
                    k = k + 1;
                } else {
                    done = true;
                }
            }

            B.forEach(function (b) {
                CR.push(averageColor(b));
            });
        }

        profiler.time('Color Palette');
        return CR;
    }

    vidi.findRepresentativeColors = findRepresentativeColors;
    vidi.getEuclideanRGBDistance = getEuclideanRGBDistance;
}(Vidi));;(function(vidi) {

    "use strict";

    function sobelEdgeDetect(imageData) {
        var hxImageData = vidi.cloneImageData(imageData),
            hyImageData = vidi.cloneImageData(imageData),
            hxData,
            hyData,
            data = imageData.data,
            i = data.length,
            di;

        hxData = vidi.calculateFilterData(hxImageData,[[-1,0,1],[-2,0,2],[-1,0,1]]);
        hyData = vidi.calculateFilterData(hyImageData,[[-1,-2,-1],[0,0,0],[1,2,1]]);


        //console.log(hxData);
        while(i--) {
            di = Math.sqrt( (hxData[i]*hxData[i]) + (hyData[i]*hyData[i]));
            if (di >  50) {
                data[i] = di;
            } else {
                data[i] = 0;
            }
        }

        return imageData;
    }

    vidi.sobelEdgeDetect = sobelEdgeDetect;

}(Vidi));;(function(vidi) {

"use strict";

function calculateFilterData(imageData,filter,scale_factor) {
        var ORIGIN = imageData.data,
            WIDTH = imageData.width,
            HEIGHT = imageData.height,

        //if the filter is 7*5 X_OFFSET=3 and Y_OFFSET=2
            X_OFFSET = (filter[0].length -1) / 2,
            Y_OFFSET = (filter.length -1) / 2,

            FILTER_SCALE,

            i,j, //Loop variables over dict

            x,y,
            currPixelStart, //
            filterPixelStart,

            filterValue,

            data = new Int16Array(imageData.data),

            sumR,sumG,sumB;

        //Common scale factor for filter
        if (scale_factor) {
            FILTER_SCALE = 1 / scale_factor;
        } else {
            FILTER_SCALE = 1;
        }

        for (y=Y_OFFSET;y<HEIGHT-Y_OFFSET;y++) {
            for (x=X_OFFSET;x<WIDTH-X_OFFSET;x++) {

                currPixelStart = (y * 4 * WIDTH) + (x * 4);

                sumR = 0;
                sumG = 0;
                sumB = 0;
                for (i=-Y_OFFSET;i<=Y_OFFSET;i++) {
                    for (j=-X_OFFSET;j<=X_OFFSET;j++) {
                        filterValue = filter[i+Y_OFFSET][j+X_OFFSET];

                        filterPixelStart = ((y+i) * 4 * WIDTH) + ((x+j) * 4);

                        sumR += ORIGIN[filterPixelStart] * filterValue;
                        sumG += ORIGIN[filterPixelStart+1] * filterValue;
                        sumB += ORIGIN[filterPixelStart+2] * filterValue;
                    }
                }
                //Round channel values to integer
                sumR = Math.round(sumR * FILTER_SCALE);
                sumG = Math.round(sumG * FILTER_SCALE);
                sumB = Math.round(sumB * FILTER_SCALE);


                data[currPixelStart] = sumR;
                data[currPixelStart+1] = sumG;
                data[currPixelStart+2] = sumB;
                data[currPixelStart+3] = ORIGIN[currPixelStart+3];
            }
        }

        return data;
    }

function boxFilter(imageData,sizeX,sizeY) {
    var kernelX = [],
        kernelY = [],
        scaleX,
        scaleY,
        row,
        col;


    if (!sizeX) {
        sizeX = 3;
    }

    if (!sizeY) {
        sizeY = sizeX;
    }

    if (sizeX % 2 !== 1 || sizeY % 2 !==1) {
        throw "Box filter size must be and odd";
    }

    scaleX = sizeX;
    scaleY = sizeY;

    for (col=0;col<sizeX;col++) {
        kernelX.push(1);
    }

    for (row=0;row<sizeY;row++) {
        kernelY.push([1]);
    }

    //kernelX = new Uint8Array(kernelX);

    imageData = customFilter(imageData,[kernelX],scaleX);
    imageData = customFilter(imageData,kernelY,scaleY);

    return imageData;
}

function customFilter(imageData,filter,scale) {
	var ORIGIN = imageData.data,
		WIDTH = imageData.width,
		HEIGHT = imageData.height,

		//if the filter is 7*5 X_OFFSET=3 and Y_OFFSET=2
		X_OFFSET = (filter[0].length -1) / 2, 
		Y_OFFSET = (filter.length -1) / 2, 

		FILTER_SCALE,

		i,j, //Loop variables over dict

		x,y, 
		currPixelStart, //
		filterPixelStart,

		filterValue,

		/*copy = vidi.cloneImageData(imageData),
		data = copy.data,*/
        data = new Uint8ClampedArray(imageData.data),

		sumR,sumG,sumB;

	//Common scale factor for filter
    scale = scale || 1;
	FILTER_SCALE = 1 / scale;

	for (y=Y_OFFSET;y<HEIGHT-Y_OFFSET;y++) {
		for (x=X_OFFSET;x<WIDTH-X_OFFSET;x++) {

			currPixelStart = (y * 4 * WIDTH) + (x * 4);

			sumR = 0;
			sumG = 0;
			sumB = 0;
			for (i=-Y_OFFSET;i<=Y_OFFSET;i++) {
				for (j=-X_OFFSET;j<=X_OFFSET;j++) {
					filterValue = filter[i+Y_OFFSET][j+X_OFFSET];

					filterPixelStart = ((y+i) * 4 * WIDTH) + ((x+j) * 4);

					sumR += ORIGIN[filterPixelStart] * filterValue;
					sumG += ORIGIN[filterPixelStart+1] * filterValue;
					sumB += ORIGIN[filterPixelStart+2] * filterValue;
				}
			}
			//Round channel values to integer
			sumR = Math.round(sumR * FILTER_SCALE);
			sumG = Math.round(sumG * FILTER_SCALE);
			sumB = Math.round(sumB * FILTER_SCALE);



			//Be sure rgb values are between 0 and 255

            if (sumR > 255) {
                sumR = 255;
            } else if (sumR < 0) {
                sumR = 0;
            }

            if (sumG > 255)  {
                sumG = 255;
            } else if (sumG < 0) {
                sumG = 0;
            }

            if (sumB > 255) {
                sumB = 255;
            } else if (sumB < 0) {
                sumB = 0;
            }
			
			data[currPixelStart] = sumR;
			data[currPixelStart+1] = sumG;
			data[currPixelStart+2] = sumB;
			data[currPixelStart+3] = ORIGIN[currPixelStart+3];
		}
	}

    //return copy;
    imageData.data.set(data);
	return imageData;
}

function xFilter(imageData,filter,scale) {
        var ORIGIN = imageData.data,
            WIDTH = imageData.width,
            HEIGHT = imageData.height,

            RAY = (filter.length -1) / 2,

            FILTER_SCALE,

            i, //Loop variables over filter kernel
            KERNEL = new Float32Array(filter),
            KERNEL_LEN = filter.length,

            x,y,
            currPixelStart, //
            filterPixelStart,

            filterValue,

            data = new Uint8ClampedArray(imageData.data),

            sumR,sumG,sumB;

        //Common scale factor for filter
        scale = scale || 1;
        FILTER_SCALE = 1 / scale;

        for (y=0;y<HEIGHT-RAY;y++) {
            for (x=RAY;x<WIDTH-RAY;x++) {

                currPixelStart = (y * 4 * WIDTH) + (x * 4);

                sumR = 0;
                sumG = 0;
                sumB = 0;

                for (i=0;i<KERNEL_LEN;i++) {

                    filterValue = KERNEL[i];
                    filterPixelStart = currPixelStart - ((i - RAY)*4);

                    sumR += ORIGIN[filterPixelStart] * filterValue;
                    sumG += ORIGIN[filterPixelStart+1] * filterValue;
                    sumB += ORIGIN[filterPixelStart+2] * filterValue;
                }

                //Round channel values to integer
                sumR = Math.round(sumR * FILTER_SCALE);
                sumG = Math.round(sumG * FILTER_SCALE);
                sumB = Math.round(sumB * FILTER_SCALE);


                //Be sure rgb values are between 0 and 255

                if (sumR > 255) {
                    sumR = 255;
                } else if (sumR < 0) {
                    sumR = 0;
                }

                if (sumG > 255)  {
                    sumG = 255;
                } else if (sumG < 0) {
                    sumG = 0;
                }

                if (sumB > 255) {
                    sumB = 255;
                } else if (sumB < 0) {
                    sumB = 0;
                }

                data[currPixelStart] = sumR;
                data[currPixelStart+1] = sumG;
                data[currPixelStart+2] = sumB;
                data[currPixelStart+3] = ORIGIN[currPixelStart+3];
            }
        }

        //return copy;
        imageData.data.set(data);
        return imageData;
    }

function yFilter(imageData,filter,scale) {
        var ORIGIN = imageData.data,
            WIDTH = imageData.width,
            HEIGHT = imageData.height,

            row,
            ROW_SIZE = WIDTH * 4,

            RAY = (filter.length -1) / 2,

            FILTER_SCALE,

            i, //Loop variables over filter kernel
            KERNEL = new Float32Array(filter),
            KERNEL_LEN = filter.length,

            x,y,
            currPixelStart, //
            filterPixelStart,

            filterValue,

            data = new Uint8ClampedArray(imageData.data),

            sumR,sumG,sumB;

        //Common scale factor for filter
        scale = scale || 1;
        FILTER_SCALE = 1 / scale;

        for (y=RAY;y<HEIGHT-RAY;y++) {
            for (x=0;x<WIDTH;x++) {

                currPixelStart = (y * 4 * WIDTH) + (x * 4);

                sumR = 0;
                sumG = 0;
                sumB = 0;

                for (i=0;i<KERNEL_LEN;i++) {
                    row = i - RAY; //Ex. if KERNEL_LEN == 5 then row == [-2, -1, 0, 1, 2]

                    filterValue = KERNEL[i];
                    filterPixelStart = currPixelStart + (row * ROW_SIZE);

                    sumR += ORIGIN[filterPixelStart] * filterValue;
                    sumG += ORIGIN[filterPixelStart+1] * filterValue;
                    sumB += ORIGIN[filterPixelStart+2] * filterValue;
                }

                //Round channel values to integer
                sumR = Math.round(sumR * FILTER_SCALE);
                sumG = Math.round(sumG * FILTER_SCALE);
                sumB = Math.round(sumB * FILTER_SCALE);


                //Be sure rgb values are between 0 and 255

                if (sumR > 255) {
                    sumR = 255;
                } else if (sumR < 0) {
                    sumR = 0;
                }

                if (sumG > 255)  {
                    sumG = 255;
                } else if (sumG < 0) {
                    sumG = 0;
                }

                if (sumB > 255) {
                    sumB = 255;
                } else if (sumB < 0) {
                    sumB = 0;
                }

                data[currPixelStart] = sumR;
                data[currPixelStart+1] = sumG;
                data[currPixelStart+2] = sumB;
                data[currPixelStart+3] = ORIGIN[currPixelStart+3];
            }
        }

        //return copy;
        imageData.data.set(data);
        return imageData;
    }

function makeGaussianKernel(sigma) {
    var center = parseInt(sigma*3),
        sigma2 = sigma*sigma,
        kernel = [],
        len = 2 * center + 1,
        r,
        i;

    for (i=0;i<len;i++) {
        r = center - i;
        kernel[i] = Math.exp(-0.5 * (r*r) / sigma2);
    }

    return kernel;
}

function gaussianFilter(imageData,sigma) {
    var kernel = makeGaussianKernel(sigma),
        kernelY = [],
        scale = 0,
        i;

    for (i=0;i<kernel.length;i++) {
        kernelY.push([kernel[i]]);
        scale = scale + kernel[i];
    }

    //imageData = customFilter(imageData,kernelX,scale);
    //imageData = customFilter(imageData,kernelY,scale);

    imageData = xFilter(imageData,kernel,scale);
    imageData = yFilter(imageData,kernel,scale);

    return imageData;
}

function unsharpMask(imageData,sigma,a) {
    var I,
        J,
        imageDataCopy = Vidi.cloneImageData(imageData);

    sigma = sigma || 2;
    a = a || 0.2;

    I = new Float32Array(imageData.data);
    Vidi.gaussianFilter(imageDataCopy,sigma);
    J = new Float32Array(imageDataCopy.data);

    Vidi.dataScale(I, 1+a);
    Vidi.dataScale(J, a);
    Vidi.dataSubtract(I,J);

    imageData.data.set(new Uint8ClampedArray(I));

    return imageData;
}

//Exports methods
vidi.customFilter = customFilter;
vidi.xFilter = xFilter;
vidi.yFilter = yFilter;
vidi.boxFilter = boxFilter;
vidi.calculateFilterData = calculateFilterData;
vidi.makeGaussianKernel = makeGaussianKernel;
vidi.gaussianFilter = gaussianFilter;
vidi.unsharpMask = unsharpMask;

}(Vidi));;(function(vidi) {

    "use strict";

    function getLuminanceHistogram(imageData) {
        var data,
            grayImageData,
            len,
            histogram = [],
            i;

        grayImageData = vidi.toGray(vidi.cloneImageData(imageData));
        data = grayImageData.data;
        len = data.length;

        for (i=0;i<256;i++) {
            histogram[i] = 0;
        }

        for (i=0;i<len;i=i+4) {
            histogram[data[i]]++;
        }

        return histogram;
    }

    function getRedHistogram(imageData) {
        var data,
            len,
            histogram = [],
            i;

        data = imageData.data;
        len = data.length;

        for (i=0;i<256;i++) {
            histogram[i] = 0;
        }

        for (i=0;i<len;i=i+4) {
            histogram[data[i]]++;
        }

        return histogram;
    }

    function getGreenHistogram(imageData) {
        var data,
            len,
            histogram = [],
            i;

        data = imageData.data;
        len = data.length;

        for (i=0;i<256;i++) {
            histogram[i] = 0;
        }

        for (i=1;i<len;i=i+4) {
            histogram[data[i]]++;
        }

        return histogram;
    }

    function getBlueHistogram(imageData) {
        var data,
            len,
            histogram = [],
            i;

        data = imageData.data;
        len = data.length;

        for (i=0;i<256;i++) {
            histogram[i] = 0;
        }

        for (i=2;i<len;i=i+4) {
            histogram[data[i]]++;
        }

        return histogram;
    }

    function showHistogram(histogram, target, color) {
        var context = target.getContext('2d'),
            i,
            h,
            max_value;

        max_value = histogram.slice().sort(function (a,b) {return a - b;}).pop();

        context.fillStyle = color;
        for (i=0;i<256;i++) {
            h = histogram[i]/max_value * 100;
            context.fillRect(i,100-h,1,h);
        }
    }


    function showLuminanceHistogram(imageData,target) {
        var histogram = getLuminanceHistogram(imageData);
        showHistogram(histogram,target,'rgba(0,0,0,0.5)');
    }

    function showRedHistogram(imageData,target) {
        var histogram = getRedHistogram(imageData);
        showHistogram(histogram,target,'rgba(255,0,0,0.8)');
    }

    function showGreenHistogram(imageData,target) {
        var histogram = getGreenHistogram(imageData);
        showHistogram(histogram,target,'rgba(0,255,0,0.8)');
    }

    function showBlueHistogram(imageData,target) {
        var histogram = getBlueHistogram(imageData);
        showHistogram(histogram,target,'rgba(0,0,255,0.8)');
    }

    vidi.getLuminanceHistogram = getLuminanceHistogram;
    vidi.getRedHistogram = getRedHistogram;
    vidi.showLuminanceHistogram = showLuminanceHistogram;
    vidi.showRedHistogram = showRedHistogram;
    vidi.showGreenHistogram = showGreenHistogram;
    vidi.showBlueHistogram = showBlueHistogram;

}(Vidi));;(function(vidi) {

"use strict";

function invert(imageData) {
	var data = imageData.data,
		len = imageData.data.length,
		i;
	
	for (i=0;i<len-4;i=i+4) {
		//Don't touch the alpha channel
		data[i] = 255 - data[i];	
		data[i+1] = 255 - data[i+1];	
		data[i+2] = 255 - data[i+2];			
	}
	
	return imageData;
}

function contrast(imageData,factor) {
	var lkTable = [],
        data = imageData.data,
		len = imageData.data.length,
		i;

    factor = +factor; //Cast to number

    if (factor >= 0) {
        for (i=0;i<256;i++) {
            lkTable[i] = Math.round(i * factor);
            if (lkTable[i] > 255) {
                lkTable[i] = 255;
            }
        }

        for (i=0;i<len;i=i+4) {
            data[i] = lkTable[data[i]];
            data[i+1] = lkTable[data[i+1]];
            data[i+2] = lkTable[data[i+2]];
            data[i+3] = lkTable[data[i+3]];
        }

        return imageData;
    } else {
        throw "Contrast factor must be a positive number";
    }

}

function autoContrast(imageData) {
	var data = imageData.data,
		len = imageData.data.length,
		i,
		lowR = 255, highR = 0,
		lowG = 255, highG = 0,
		lowB = 255, highB = 0,
		rFact, gFact, bFact,
        r, g, b;
		
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
	
			
	return imageData;
}

function brightness(imageData,factor) {
	var data = imageData.data,
		len = imageData.data.length,
		i;		
	factor = +factor;	
	for (i=0;i<len-4;i=i+4) {
		data[i] += factor;
		data[i+1] += factor;
		data[i+2] += factor;		
	}
	
	return imageData;
}

function toGray(imageData) {
	var data = imageData.data,
		len = imageData.data.length,
        i,
        r, g, b,
        gray;
	
	for (i=0;i<len-4;i=i+4) {
		r = data[i] * 0.309;	
		g = data[i+1] * 0.609;	
		b = data[i+2] * 0.082;			
		gray = r + g + b;
		data[i] = gray;
		data[i+1] = gray;
		data[i+2] = gray;		
	}
	
	return imageData;
}

function threshold(imageData,level) {
	var data = imageData.data,
		len = imageData.data.length,
		i;
	
	level = level || 128;
	toGray(imageData);
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
	
	return imageData;
}

vidi.invert = invert;
vidi.contrast = contrast;
vidi.autoContrast = autoContrast;
vidi.brightness = brightness;
vidi.toGray = toGray;
vidi.threshold = threshold;


}(Vidi));;(function(vidi) {

    "use strict";

    function cloneImageData(imageData) {
        var newImageData = document.createElement('canvas').getContext('2d').createImageData(imageData.width,imageData.height);
        newImageData.data.set(imageData.data);
        return newImageData;
    }

    function cloneData(data) {
        return new Uint8ClampedArray(data);
        //return new Int16Array(data);
    }

    function dataSubtract(data1, data2) {
        var i,
            len = data2.length;

        for (i=0;i<len;i=i+4) {
            data1[i] = data1[i] - data2[i];
            data1[i+1] = data1[i+1] - data2[i+1];
            data1[i+2] = data1[i+2] - data2[i+2];
        }

        return data1;
    }

    function dataAdd(data1, data2) {
        var i,
            len = data2.length;

        for (i=0;i<len;i=i+4) {
            data1[i] = data1[i] + data2[i];
            data1[i+1] = data1[i+1] + data2[i+1];
            data1[i+2] = data1[i+2] + data2[i+2];
        }

        return data1;
    }

    function dataScale(data,factor) {
        var i = data.length;
        while (i) {
            i--;
            data[i] = Math.round(data[i] * factor);
        }
        return data;
    }

    function getDataAsPixels(data) {
        var nPixels = data.length / 4,
            pixels = new Uint32Array(nPixels),
            red,
            green,
            blue,
            i=0,
            j=0;

        while (i<nPixels) {
            red = (data[j] << 16);// & 0xF80000; //Shift red 16-bits and mask out other stuff
            green = (data[j+1] << 8);// & 0x00F800; //Shift Green 8-bits and mask out other stuff;
            blue = data[j+2];// & 0x0000F8;
            pixels[i] = red | green | blue;
            i++;
            j=i*4;
        }

        return pixels;
    }

    function radixSort(intArr) {
        var cpy = new Int32Array(intArr.length);
        var _radixSort_0 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        var c4 = [].concat(_radixSort_0);
        var c3 = [].concat(_radixSort_0);
        var c2 = [].concat(_radixSort_0);
        var c1 = [].concat(_radixSort_0);
        var o4 = 0; var t4;
        var o3 = 0; var t3;
        var o2 = 0; var t2;
        var o1 = 0; var t1;
        var x;
        for(x=0; x<intArr.length; x++) {
            t4 = intArr[x] & 0xFF;
            t3 = (intArr[x] >> 8) & 0xFF;
            t2 = (intArr[x] >> 16) & 0xFF;
            t1 = (intArr[x] >> 24) & 0xFF ^ 0x80;
            c4[t4]++;
            c3[t3]++;
            c2[t2]++;
            c1[t1]++;
        }
        for (x=0; x<256; x++) {
            t4 = o4 + c4[x];
            t3 = o3 + c3[x];
            t2 = o2 + c2[x];
            t1 = o1 + c1[x];
            c4[x] = o4;
            c3[x] = o3;
            c2[x] = o2;
            c1[x] = o1;
            o4 = t4;
            o3 = t3;
            o2 = t2;
            o1 = t1;
        }
        for(x=0; x<intArr.length; x++) {
            t4 = intArr[x] & 0xFF;
            cpy[c4[t4]] = intArr[x];
            c4[t4]++;
        }
        for(x=0; x<intArr.length; x++) {
            t3 = (cpy[x] >> 8) & 0xFF;
            intArr[c3[t3]] = cpy[x];
            c3[t3]++;
        }
        for(x=0; x<intArr.length; x++) {
            t2 = (intArr[x] >> 16) & 0xFF;
            cpy[c2[t2]] = intArr[x];
            c2[t2]++;
        }
        for(x=0; x<intArr.length; x++) {
            t1 = (cpy[x] >> 24) & 0xFF ^ 0x80;
            intArr[c1[t1]] = cpy[x];
            c1[t1]++;
        }
        return intArr;
    }

    function timer() {
        var self = {};

        self.last_time = new Date().getTime();
        self.diff = 0;

        self.time = function (label) {
            var curr_time = new Date().getTime();
            self.diff = curr_time - self.last_time;
            self.last_time = curr_time;

            if (!self.silent) {
                console.log(label + ': ' + self.diff);
            }
            return self.diff;
        };

        return self;
    }

    vidi.radixSort = radixSort;
    vidi.cloneImageData = cloneImageData;
    vidi.cloneData = cloneData;
    vidi.getDataAsPixels = getDataAsPixels;
    vidi.dataSubtract = dataSubtract;
    vidi.dataAdd = dataAdd;
    vidi.dataScale = dataScale;
    vidi.timer = timer;

}(Vidi));