#define VERSION   0.1
#define TITLE     CMOS Stats

#include "SensorStatsImageOptions.js"
#include "SensorStatsCalculateEGain.js"

var imageOptions = new ImageOptions();

imageOptions.loadImagesFromDirectory("d:\\Astro\\_Lib\\ASI1600MM-C Pro\\Stats");

imageOptions.report();

var stats = {};

CalculateEGain(stats, imageOptions.flats);

imageOptions.closeRegisteredImages();

console.writeln("----------------------------------");
console.writeln("<b>Computed sensor stats</b>");

console.writeln("Gain:");
for (var gainKey of Object.keys(stats.eGain)) {
   console.writeln(gainKey + " : " + stats.eGain[gainKey].toFixed(2) + " -e/ADU");
}
