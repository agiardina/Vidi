(function(vidi) {

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

}(Vidi));