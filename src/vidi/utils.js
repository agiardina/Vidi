(function(vidi) {

    "use strict";

    function cloneImageData(imageData) {
        var newImageData = document.createElement('canvas').getContext('2d').createImageData(imageData.width,imageData.height);
        newImageData.data.set(imageData.data);
        return newImageData;
    }

    function cloneData(data) {
        return new Int16Array(data);
    }

    function getDataAsPixels(data) {
        var pixels = [],
            i,
            len = data.length;
        for (i=0;i<len;i=i+4) {
            pixels.push([data[i],data[i+1], data[i+2], data[i+3]]);
        }

        return pixels;
    }

    function sortPixelsByColor(pixels) {
        return pixels.sort(function (p1,p2) {
            if (p1[0]===p2[0]) {
                if (p1[1]===p2[1]){
                    if (p1[2]===p2[2]) {
                        return p1[3]-p2[3];
                    } else {
                        return p1[2]-p2[2];                    }
                } else {
                    return p1[1]-p2[1];
                }
            } else {
                return p1[0]-p2[0];
            }
        });
    }

    function getColorsDistance (color1, color2) {
        return Math.pow(Math.pow(color1[0]-color2[0],2)
            + Math.pow(color1[1]-color2[1],2)
            + Math.pow(color1[2]-color2[2],2)
            //+ Math.pow(color1[3]-color2[3],2),1/4);
            ,1/3);
    }

    function getColors(imageData) {
        var pixels,
            len,
            i,
            current_color,
            counter,
            colors = [],
            profiler = timer();



        pixels = getDataAsPixels(imageData.data);
        profiler.time('Data as pixels');

        pixels = sortPixelsByColor(pixels);

        profiler.time('Sort pixels');

        current_color = pixels[0];
        counter = 1;

        len = pixels.length;
        for (i=1;i<len;i++) {
            if (pixels[i][0] !== pixels[i-1][0] ||
                pixels[i][1] !== pixels[i-1][1] ||
                pixels[i][2] !== pixels[i-1][2] ||
                pixels[i][3] !== pixels[i-1][3]) {
                colors.push([current_color,counter]);

                current_color = pixels[i];
                counter = 1;
            } else {
                counter++;
            }
        }
        profiler.time('Get colors');

        colors.sort(function (c1,c2) {
            return c2[1] - c1[1];
        });

        profiler.time('Sort colors');

        return colors;
    }

    function timer() {
        var self = {};

        self.last_time = new Date().getTime();
        self.diff = 0;

        self.time = function (label) {
            var curr_time = new Date().getTime();
            self.diff = curr_time - self.last_time;
            self.last_time = curr_time;

            console.log(label + ': ' + self.diff);
            return self.diff;
        };

        return self;
    }

    vidi.cloneImageData = cloneImageData;
    vidi.cloneData = cloneData;
    vidi.getDataAsPixels = getDataAsPixels;
    vidi.sortPixelsByColor = sortPixelsByColor;
    vidi.getColors = getColors;
    vidi.getColorsDistance = getColorsDistance;

}(Vidi));