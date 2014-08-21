(function(vidi) {

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

    if (!(factor >= 0)) {
        throw "Contrast factor must be a positive number";
    } else {
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


}(Vidi));