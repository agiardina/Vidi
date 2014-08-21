(function(vidi) {

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

}(Vidi));