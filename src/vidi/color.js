(function(vidi) {

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
}(Vidi));