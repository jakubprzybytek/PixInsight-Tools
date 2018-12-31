#define VERSION   0.1
#define TITLE     CMOS Stats

#include "SensorStatsImageOptions.js"
#include "SensorStatsImageMath.js"
#include "SensorStatsCalculateEGain.js"
#include "SensorStatsCalculateDynamicRange.js"
#include "SensorStatsCalculateReadNoise.js"

var MyMath = {};

MyMath.avg = function (array) {
   return array.reduce((acc, item) => acc + item, 0) / array.length
}

function reportStats(stats) {

   console.writeln("----------------------------------");
   console.writeln("<b>Computed sensor stats for:</b> " + stats.name);

   console.writeln("\nGain:");
   for (var gainKey of Object.keys(stats.eGain)) {
      console.writeln(gainKey + ": " + stats.eGain[gainKey].toFixed(2) + " [-e/ADU]");
   }

   console.writeln("\nDynamic range:");
   for (var gainKey of Object.keys(stats.dynamicRange)) {
      console.writeln(gainKey + ": " + stats.dynamicRange[gainKey].toFixed(1) + " [-e]");
   }

   console.writeln("\nRead Noise:");
   for (var gainKey of Object.keys(stats.readNoise)) {
      console.writeln(gainKey + ": " + stats.readNoise[gainKey].toFixed(1) + " [-e]");
   }
}

var startTime = new Date;

var stats = {
   name: "ASI1600MM Pro",
   bitRate: 12,
   eGain: {},
   dynamicRange: {},
   readNoise: {},

   getShrinkingFactor: function() {
      return Math.pow(2, 16 - this.bitRate);
   }
};

var imageOptions = new ImageOptions(stats);

imageOptions.loadImagesFromDirectory("d:\\Astro\\_Lib\\ASI1600MM-C Pro\\Stats");

imageOptions.report();

CalculateEGain(stats, imageOptions.flats);
CalculateDynamicRange(stats);
CalculateReadNoise(stats, imageOptions.biases);

imageOptions.closeRegisteredImages();

reportStats(stats);

var endTime = new Date;
console.writeln(format("\nDone in: %.2f [s]", (endTime.getTime() - startTime.getTime()) / 1000));
