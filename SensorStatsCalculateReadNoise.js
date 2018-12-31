function CalculateReadNoise(stats, biases) {

   for (var gainKey of Object.keys(biases)) {

      var eGain = stats.eGain[gainKey];
      if (eGain === undefined) {
         console.warningln("Missing eGain for gain ", gainKey, ", skipping");
         continue;
      }

      console.writeln("----------------------------------");
      console.writeln("<b>Calculating read noise</b> for gain ", gainKey);

      var readNoiseValues = [];

      for (var imageRecord of biases[gainKey]) {


         var imageView = imageRecord.getView();
         var shrunkImageView = ImageMath.simplePixelMath(imageView, imageView.id + " / " + stats.getShrinkingFactor());

         var stdDev = shrunkImageView.image.stdDev() * 65535;
         shrunkImageView.window.close();

         readNoiseValues.push(stdDev * eGain);
      }

      console.writeln("Calculating avg: ", readNoiseValues);
      stats.readNoise[gainKey] = MyMath.avg(readNoiseValues);
   }

   console.writeln("<b>Read noise</b>: ", JSON.stringify(stats.readNoise));
}
