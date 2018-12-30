#define VERSION   0.1
#define TITLE     CMOS Stats

#include "SensorStatsImageOptions.js"
#include "SensorStatsCalculateEGain.js"
#include "SensorStatsCalculateDynamicRange.js"

var MyMath = {};

MyMath.avg = function (array) {
   var sum = 0;
   for (var i in array) {
      sum += array[i];
   }
   return sum / array.length;
}

function reportStats(stats) {

   console.writeln("----------------------------------");
   console.writeln("<b>Computed sensor stats for:</b> " + stats.name);

   console.writeln("Gain:");
   for (var gainKey of Object.keys(stats.eGain)) {
      console.writeln(gainKey + " : " + stats.eGain[gainKey].toFixed(2) + " -e/ADU");
   }

   console.writeln("\nDynamic range:");
   for (var gainKey of Object.keys(stats.dynamicRange)) {
      console.writeln(gainKey + " : " + stats.dynamicRange[gainKey].toFixed(1) + " -e");
   }
}

var imageOptions = new ImageOptions();

imageOptions.loadImagesFromDirectory("d:\\Astro\\_Lib\\ASI1600MM-C Pro\\Stats");

imageOptions.report();

var stats = {
      name: "ASI1600MM Pro",
      bitRate: 12
   };

CalculateEGain(stats, imageOptions.flats);
CalculateDynamicRange(stats);

imageOptions.closeRegisteredImages();

reportStats(stats);
