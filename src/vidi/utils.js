(function(vidi) {

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