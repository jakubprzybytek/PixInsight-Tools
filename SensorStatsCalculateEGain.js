#include "SensorStatsImageMath.js"
#include "LinearRegression.js"

function CreateDiffImage(firstImageView, secondImageView) {

   return ImageMath.simplePixelMath(
      firstImageView,
      firstImageView.image.mean() / 16 + " + " + firstImageView.id + " / 16 - " + secondImageView.id + " / 16");
}

function CalculateEGainsForPairs(collection) {

   var means = [];

   var variances = [];

   for (var i = 0; i < collection.length - 1; i++) {
      for (var j = i + 1; j < collection.length; j++) {

         var firstImageView = collection[i].window.mainView;
         var secondImageView = collection[j].window.mainView;

         var diffImage = CreateDiffImage(firstImageView, secondImageView);
         var stdDevADU = diffImage.image.stdDev() * 65535;

         var meansADU = (firstImageView.image.mean() + secondImageView.image.mean()) * 65535 / 16
         var varianceADU = stdDevADU * stdDevADU;

         means.push(meansADU);
         variances.push(varianceADU);
      }
   }

   return { means: means, variances: variances };
}

function CalculateEGainForCollection(collection) {

   var gains = CalculateEGainsForPairs(collection);

   console.writeln("Computing linear regression for: " + JSON.stringify(gains));

   var results = findLineByLeastSquares(gains.means, gains.variances);
   console.writeln("<b>eGain</b>: " + results[0] + " " + results[1]);
}
