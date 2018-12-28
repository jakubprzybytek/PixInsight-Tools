#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define VERSION   0.1
#define TITLE     CMOS Stats

function ImageOptions() {

   this.biases = {};

   this.darks = {};

   this.flats = {};

   this.loadImage = function (imageId) {
      var window = ImageWindow.windowById(imageId);
      if (!window.isNull) {
         var fitsHeader = this.readFitsHeader(window.keywords);
         console.writeln("Loaded file: type: " + fitsHeader.imageType + ", Gain: " + fitsHeader.gain + ", exposure: " + fitsHeader.exposure + ", temp: " + fitsHeader.sensorTemp);

         this.registerImage(fitsHeader);
      } else {
         console.writeln("Image with ID not fount: " + imageId);
      }
   }

   this.loadImageFromFile = function (directory, fileName) {
      //console.writeln("Loading: " + fileName);
      var window = ImageWindow.open(directory + "\\" + fileName);
      if (!window.isNull) {
         var fitsHeader = this.readFitsHeader(window[0].keywords);
         console.writeln("<b>Loaded file</b>: type: " + fitsHeader.imageType + ", Gain: " + fitsHeader.gain + ", exposure: " + fitsHeader.exposure + ", temp: " + fitsHeader.sensorTemp);

         this.registerImage(fitsHeader);
      } else {
         console.writeln("Image not loaded");
      }
   }

   this.loadImagesFromDirectory = function (directoryRoot) {
      console.writeln("----------------------------------");
      console.writeln("<b>Loading images from: " + directoryRoot + "</b>");

      var fileFind = new FileFind;
      if (fileFind.begin(directoryRoot + "/*.fit")) {
         do {
            if (fileFind.name != "." && fileFind.name != "..") {
               this.loadImageFromFile(directoryRoot, fileFind.name);
            }
         } while (fileFind.next());
      }
   }

   this.registerImage = function (fitsHeader) {
      if (fitsHeader.imageType == 'BIAS') {
         if (fitsHeader.gain in this.biases) {
            this.biases[fitsHeader.gain].push(fitsHeader);
         } else {
            this.biases[fitsHeader.gain] = [fitsHeader];
         }
      } else if (fitsHeader.imageType == 'DARK') {
         if (fitsHeader.gain in this.darks) {
            this.darks[fitsHeader.gain].push(fitsHeader);
         } else {
            this.darks[fitsHeader.gain] = [fitsHeader];
         }
      } else if (fitsHeader.imageType == 'FLAT') {
         if (fitsHeader.gain in this.flats) {
            this.flats[fitsHeader.gain].push(fitsHeader);
         } else {
            this.flats[fitsHeader.gain] = [fitsHeader];
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
         } else if (keywords[i].name == "GAIN") {
            fitsHeader.gain = Number(keywords[i].value);
         } else if (keywords[i].name == "XPIXSZ") {
            fitsHeader.xPixelSize = Number(keywords[i].value);
         } else if (keywords[i].name == "YPIXSZ") {
            fitsHeader.yPixelSize = Number(keywords[i].value);
         } else if (keywords[i].name == "CCD-TEMP") {
            fitsHeader.sensorTemp = Number(keywords[i].value);
         } else if (keywords[i].name == "SET-TEMP") {
            fitsHeader.setTemp = Number(keywords[i].value);
         } else if (keywords[i].name == "DATE-LOC") {
            fitsHeader.localDate = Date(keywords[i].value);
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
      console.writeln("<b>Images loaded</b>:");

      console.write("<b>Flats</b>: ");
      this.reportCollection(this.flats);

      console.write("<b>Biases</b>: ");
      this.reportCollection(this.biases);

      console.write("<b>Darks</b>: ");
      this.reportCollection(this.darks);
   }

}

function main() {

   var imageOptions = new ImageOptions();

   imageOptions.loadImagesFromDirectory("d:\\Astro\\_Lib\\ASI1600MM-C Pro\\Stats");

   imageOptions.report();
}

main();
