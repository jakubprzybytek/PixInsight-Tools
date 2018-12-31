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
      //for (var j = i + 1; j < images.length; j++) {
         var j = i + 1;

         var firstImageView = images[i].window.mainView;
         var secondImageView = images[j].window.mainView;

         var diffImage = CreateDiffImage(firstImageView, secondImageView);
         var stdDevADU = diffImage.image.stdDev() * 65535;
         diffImage.window.close();

         var meansADU = (firstImageView.image.mean() + secondImageView.image.mean()) * 65535 / 16;
         var varianceADU = stdDevADU * stdDevADU;

         means.push(meansADU);
         variances.push(varianceADU);
      //}
   }

   return { means: means, variances: variances };
}

function CalculateEGainForGain(images, gainKey) {

   // spit images by exposure time
   var imagesPerExposure = {};

   for (var imageRecord of images) {
      var exposure = imageRecord.fitsHeader.exposure;
      if (exposure in imagesPerExposure) {
         imagesPerExposure[exposure].push(imageRecord);
      } else {
         imagesPerExposure[exposure] = [imageRecord];
      }
   }

   // compute avarage eGain for each exposure separatelly
   var meansPerExposure = [];
   var variancesPerExposure = [];

   for (var exposure of Object.keys(imagesPerExposure)) {
      console.writeln("\n<b>Calculating eGain</b> for gain " + gainKey + " and exposure " + exposure);

      var gains = CalculateEGainsForPairs(imagesPerExposure[exposure]);

      console.writeln("Computing avarage for: " + JSON.stringify(gains));

      var avarageMean = MyMath.avg(gains.means);
      var avarageVariance = MyMath.avg(gains.variances);

      console.writeln("Avarage eGain m/v: " + avarageMean + " / " + avarageVariance + " = " + avarageMean / avarageVariance);

      meansPerExposure.push(avarageMean);
      variancesPerExposure.push(avarageVariance);
   }

   // compute single value or use linear regression
   if (meansPerExposure.length == 1) {
      var result = meansPerExposure[0] / variancesPerExposure[0];
      console.writeln("<b>eGain</b>: " + result.toFixed(2));
      return result;
   } else {
      var results = findLineByLeastSquares(variancesPerExposure, meansPerExposure);
      console.writeln("\n<b>eGain from linear regression</b>: " + results[0].toFixed(2) + " (b=" + results[1].toFixed(2) + ")");
      return results[0];
   }
}

function CalculateEGain(stats, flats) {

   console.write("----------------------------------");

   stats.eGain = {};

   for (var gainKey of Object.keys(flats)) {
      var eGainForGain = CalculateEGainForGain(flats[gainKey], gainKey);
      stats.eGain[gainKey] = eGainForGain;
   }
}
