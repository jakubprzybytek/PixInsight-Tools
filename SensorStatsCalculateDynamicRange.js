function CalculateDynamicRange(stats) {

   console.writeln("----------------------------------");
   console.writeln("<b>Calculating dynamic range</b> for " + stats.bitRate + " bit rate");

   stats.dynamicRange = {};

   for (var gainKey of Object.keys(stats.eGain)) {
      stats.dynamicRange[gainKey] = stats.eGain[gainKey] * (Math.pow(2, stats.bitRate));
   }

   console.writeln("<b>Dynamic</b> range: " + JSON.stringify(stats.dynamicRange));
}
