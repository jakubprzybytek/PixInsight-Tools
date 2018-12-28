#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define VERSION   0.1
#define TITLE     CMOS Stats

function ImageOptions() {

   this.flats = {};

   this.biases = {};

   this.loadImage = function (imageId) {
      var window = ImageWindow.windowById(imageId);
      if (!window.isNull) {
         var keywords = window.keywords;
         var fitsHeader = this.readFitsHeader(window.keywords);
         console.writeln("Loaded file: type: " + fitsHeader.imageType + ", Gain: " + fitsHeader.gain + ", exposure: " + fitsHeader.exposure + ", temp: " + fitsHeader.sensorTemp);

         this.registerImage(fitsHeader);
      } else {
         console.writeln("Image with ID not fount: " + imageId);
      }
   }

   this.registerImage = function (fitsHeader) {
      if (fitsHeader.imageType == 'FLAT') {
         if (fitsHeader.gain in this.flats) {
            this.flats[fitsHeader.gain].push(fitsHeader);
         } else {
            this.flats[fitsHeader.gain] = [fitsHeader];
         }
      } else if (fitsHeader.imageType == 'BIAS') {
         if (fitsHeader.gain in this.biases) {
            this.biases[fitsHeader.gain].push(fitsHeader);
         } else {
            this.biases[fitsHeader.gain] = [fitsHeader];
         }
      }
   }

   this.readFitsHeader = function (keywords) {
     var fitsHeader = {};
     for (var i = 0; i < keywords.length; i++) {
      if (keywords[i].name == "IMAGETYP") {
         fitsHeader.imageType = /'(\w+)\s+'/.exec(keywords[i].value)[1];
      } else if (keywords[i].name == "EXPOSURE") {
         fitsHeader.exposure = Number(keywords[i].value);
         //console.writeln("Found exp ", fitsHeader.exposure);
      } else if (keywords[i].name == "GAIN") {
         fitsHeader.gain = Number(keywords[i].value);
         //console.writeln("Found gain ", fitsHeader.gain);
      } else if (keywords[i].name == "XPIXSZ") {
         fitsHeader.xPixelSize = Number(keywords[i].value);
         //console.writeln("Found x ", fitsHeader.xPixelSize);
      } else if (keywords[i].name == "YPIXSZ") {
         fitsHeader.yPixelSize = Number(keywords[i].value);
         //console.writeln("Found y ", fitsHeader.yPixelSize);
      } else if (keywords[i].name == "CCD-TEMP") {
         fitsHeader.sensorTemp = Number(keywords[i].value);
         //console.writeln("Found temp ", fitsHeader.sensorTemp);
      } else if (keywords[i].name == "SET-TEMP") {
         fitsHeader.setTemp = Number(keywords[i].value);
         //console.writeln("Found set temp ", fitsHeader.setTemp);
      } else if (keywords[i].name == "DATE-LOC") {
         fitsHeader.localDate = Date(keywords[i].value);
         //console.writeln("Found date ", fitsHeader.localDate);
      }
     }

     return fitsHeader;
   }

   this.reportCollection = function (collection) {
      var imagesCount = 0;

      Object.keys(collection).forEach(e => imagesCount += collection[e].length);

      console.writeln("Loaded " + imagesCount + " files, gains: " + Object.keys(collection));
   }

   this.report = function () {
      console.writeln("----------------------------------");

      console.write("Flats: ");
      this.reportCollection(this.flats);

      console.write("Biases: ");
      this.reportCollection(this.biases);
   }

}

function main() {

   var imageOptions = new ImageOptions();

   imageOptions.loadImage("Flat_10sec_OIII_1x1_0010_g0_20C");
   imageOptions.loadImage("Flat_10sec_OIII_1x1_0020_g0_20C");
   imageOptions.loadImage("Bias_0sec_None_1x1_g0_20C_0010");

   imageOptions.report();
}

main();
