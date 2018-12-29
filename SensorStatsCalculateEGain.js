#include "SensorStatsImageMath.js"
#include "LinearRegression.js"

function CreateDiffImage(firstImageView, secondImageView) {

   return ImageMath.simplePixelMath(
      firstImageView,
      firstImageView.image.mean() / 16 + " + " + firstImageView.id + " / 16 - " + secondImageView.id + " / 16");
}

function CalculateEGainsForPairs(images) {

   var means = [];

   var variances = [];

   for (var i = 0; i < images.length - 1; i++) {
      for (var j = i + 1; j < images.length; j++) {

         var firstImageView = images[i].window.mainView;
         var secondImageView = images[j].window.mainView;

         var diffImage = CreateDiffImage(firstImageView, secondImageView);
         var stdDevADU = diffImage.image.stdDev() * 65535;
         diffImage.window.close();

         var meansADU = (firstImageView.image.mean() + secondImageView.image.mean()) * 65535 / 16;
         var varianceADU = stdDevADU * stdDevADU;

         means.push(meansADU);
         variances.push(varianceADU);
      }
   }

   return { means: means, variances: variances };
}

function CalculateEGainForGain(images) {

   var gains = CalculateEGainsForPairs(images);

   console.writeln("Computing avarage for: " + JSON.stringify(gains));

   //var results = findLineByLeastSquares(gains.means, gains.variances);
   //console.writeln("<b>eGain</b>: " + results[0] + " " + results[1]);

   var eGainSum = 0;
   for (var i in gains.means) {
      eGainSum += gains.means[i] / gains.variances[i];
   }
   return eGainSum / gains.means.length;
}

function CalculateEGain(stats, flats) {

   stats.eGain = {};

   for (var gainKey of Object.keys(flats)) {
      var eGainForGain = CalculateEGainForGain(flats[gainKey]);
      stats.eGain[gainKey] = eGainForGain;
   }
}
