function ImageOptions(stats) {

   function ImageRecord(window, fitsHeader) {

      this.window = window;

      this.fitsHeader = fitsHeader;

      this.getView = function() {
         return this.window.mainView;
      }

   }

   this.stats = stats;

   this.biases = {};

   this.darks = {};

   this.flats = {};

   this.loadImageFromFile = function (directory, fileName) {
      var window = ImageWindow.open(directory + "\\" + fileName)[0];
      if (!window.isNull) {
         var fitsHeader = this.readFitsHeader(window.keywords);
         console.writeln("<b>Loaded file</b>: type: ", fitsHeader.imageType, ", Gain: ", fitsHeader.gain, ", exposure: ", fitsHeader.exposure, ", temp: ", fitsHeader.sensorTemp);

         this.registerImage(window, fitsHeader);
/*
         console.writeln("Mean? " + window.mainView.image.mean() + " " + window.mainView.image.mean() * 65535);
         console.writeln("Median? " + window.mainView.image.median() + " " + window.mainView.image.median() * 65535);
         console.writeln("Avg dev? " + window.mainView.image.avgDev() + " " + window.mainView.image.avgDev() * 65535);
         console.writeln("Std dev? " + window.mainView.image.stdDev() + " " + window.mainView.image.stdDev() * 65535);
*/
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

   this.registerImageInCollection = function (collection, imageRecord) {
      if (imageRecord.fitsHeader.gain in collection) {
         collection[imageRecord.fitsHeader.gain].push(imageRecord);
      } else {
         collection[imageRecord.fitsHeader.gain] = [imageRecord];
      }
   }

   this.registerImage = function (window, fitsHeader) {
      if (fitsHeader.imageType == 'BIAS') {
         this.registerImageInCollection(this.biases, new ImageRecord(window, fitsHeader));
      } else if (fitsHeader.imageType == 'DARK') {
         this.registerImageInCollection(this.darks, new ImageRecord(window, fitsHeader));
      } else if (fitsHeader.imageType == 'FLAT') {
         this.registerImageInCollection(this.flats, new ImageRecord(window, fitsHeader));
      }
   }

   this.closeRegisteredImages = function () {

      var closeRegisteredCollection = function (collection) {
         for (var gainKey of Object.keys(collection)) {
            for (var imageRecord of collection[gainKey]) {
               imageRecord.window.close();
            }
         }
      };

      closeRegisteredCollection(this.biases);
      closeRegisteredCollection(this.darks);
      closeRegisteredCollection(this.flats);
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
      var imagesStats = Object.keys(collection).reduce(function (acc, gainKey) {
               var images = collection[gainKey];
               acc.count += images.length;
               acc.exposures = images.reduce(function (expAcc, imageRecord) {
                     if (expAcc.indexOf(imageRecord.fitsHeader.exposure) === -1) {
                        expAcc.push(imageRecord.fitsHeader.exposure);
                     }
                     return expAcc;
                  }, acc.exposures);
               acc.temps = images.reduce(function (tempAcc, imageRecord) {
                     if (tempAcc.indexOf(imageRecord.fitsHeader.sensorTemp) === -1) {
                        tempAcc.push(imageRecord.fitsHeader.sensorTemp);
                     }
                     return tempAcc;
                  }, acc.temps);
               return acc;
            },
            { count: 0, exposures: [], temps: []}
         );

      console.writeln("Loaded " + imagesStats.count + " files, gains: [" + Object.keys(collection) + "], exposures: [" + imagesStats.exposures + "], sensor temperatures: [" + imagesStats.temps + "]");
   }

   this.report = function () {
      console.writeln("----------------------------------");
      console.writeln("<b>Images loaded</b>:");

      console.write("<b>Biases</b>: ");
      this.reportCollection(this.biases);

      console.write("<b>Darks</b>: ");
      this.reportCollection(this.darks);

      console.write("<b>Flats</b>: ");
      this.reportCollection(this.flats);
   }

}
