(function(vidi) {

"use strict";

function customFilter(imageData,filter) {
	var ORIGIN = imageData.data,
		WIDTH = imageData.width,
		HEIGHT = imageData.height,

		//if the filter is 7*5 X_OFFSET=3 and Y_OFFSET=2
		X_OFFSET = (filter[0].length -1) / 2, 
		Y_OFFSET = (filter.length -1) / 2, 

		FILTER_SUM = 0,
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

	//Calculate the sum of filter coefficients
	for (i=0;i<filter.length;i++) {
		for (j=0;j<filter[0].length;j++) {
			FILTER_SUM += filter[i][j];
		}
	}

	//Common scale factor for filter
	FILTER_SCALE = 1 / FILTER_SUM;

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
			data[currPixelStart+3] = ORIGIN[currPixelStart+3]
		}
	}

    //return copy;
    imageData.data.set(data);
	return imageData;
}

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
            data[currPixelStart+3] = ORIGIN[currPixelStart+3]
        }
    }

    return data;
}

//Exports methods
vidi.customFilter = customFilter;
vidi.calculateFilterData = calculateFilterData;

}(Vidi));

