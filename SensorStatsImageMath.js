#include <pjsr/UndoFlag.jsh>

function ImageMath() {
}

ImageMath.simplePixelMath = function (targetView, expression) {

   var pixelMath = new PixelMath;
   pixelMath.expression = expression;
   pixelMath.expression1 = "";
   pixelMath.expression2 = "";
   pixelMath.expression3 = "";
   pixelMath.useSingleExpression = true;
   pixelMath.symbols = "";
   pixelMath.use64BitWorkingImage = false;
   pixelMath.rescale = false;
   pixelMath.rescaleLower = 0.0000000000;
   pixelMath.rescaleUpper = 1.0000000000;
   pixelMath.truncate = true;
   pixelMath.truncateLower = 0.0000000000;
   pixelMath.truncateUpper = 1.0000000000;
   pixelMath.createNewImage = true;
   pixelMath.newImageId = uniqueViewId("temp");
   pixelMath.newImageWidth = 0;
   pixelMath.newImageHeight = 0;
   pixelMath.newImageAlpha = false;
   pixelMath.newImageColorSpace = PixelMath.prototype.SameAsTarget;
   pixelMath.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

   targetView.beginProcess(UndoFlag_NoSwapFile);
   pixelMath.executeOn(targetView);
   targetView.endProcess();

   console.writeln("<i>New view created</i>: " + pixelMath.newImageId);

   return View.viewById(pixelMath.newImageId);
}
