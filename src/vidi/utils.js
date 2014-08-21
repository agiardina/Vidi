(function(vidi) {

    "use strict";

    function cloneImageData(imageData) {
        var newImageData = document.createElement('canvas').getContext('2d').createImageData(imageData.width,imageData.height);
        newImageData.data.set(imageData.data);
        return newImageData;
    }

    vidi.cloneImageData = cloneImageData;

}(Vidi));