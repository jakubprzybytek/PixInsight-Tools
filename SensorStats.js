#define VERSION   0.1
#define TITLE     CMOS Stats

#include "SensorStatsImageOptions.js"
#include "SensorStatsCalculateEGain.js"

var imageOptions = new ImageOptions();

imageOptions.loadImagesFromDirectory("d:\\Astro\\_Lib\\ASI1600MM-C Pro\\Stats");

imageOptions.report();

var flats = imageOptions.flats;

CalculateEGainForCollection(flats[0]);
CalculateEGainForCollection(flats[75]);

imageOptions.closeRegisteredImages();
