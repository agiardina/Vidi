Vidi
====

Vidi.js is a JavaScript Library for Digital Image Processing.

## Point Operations

### Contrast
To increase the contrast of an image by a 40% 

```javascript
var img = document.getElementById('myimg'),
    vimg = new Vidi(img);
    
vimg.contrast(1.4).show();

![Original](Vidi/blob/master/docs/img/boat_original.png)
```