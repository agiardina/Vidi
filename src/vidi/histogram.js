(function(vidi) {

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

}(Vidi));