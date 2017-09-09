function DrawSignature() {

   this.initialize = function() {

      this.text = "M11";
      this.textTimestamp = "2017.08.29 00:00 CEST";
      this.textOptics = "NT-203 (f=1000mm), UHC";
      this.textSensor = "Canon 550d (Exp 60s, ISO 800)";
      this.textStackInfo = "10 lights, 15 darks, 15 bias";
      this.textSoftware = "SGPro, PI";
      this.fontFace = "Verdana";
      this.fontSize = 64; // px
      this.stretch = 100;
      this.textColor = 0xff85929e;
      this.bkgColor = 0x80000000;
      this.margin = 32;

      var window = ImageWindow.activeWindow;
      if ( !window.isNull ) {
         this.targetView = window.currentView;
         this.keywords = window.keywords;
      }

      console.writeln("Using view: ", this.targetView.id);
   }

   this.apply = function() {
      this.exportParameters();

      this.targetView.beginProcess();

      this.draw([
         this.text,
         this.textTimestamp,
         "",
         this.textOptics,
         this.textSensor,
         this.textStackInfo,
         "",
         this.textSoftware], true);

      var plateSolvedData = this.readPlateSolvedData();

      this.draw([
         "Calibration",
         "Center (RA, hms): " + plateSolvedData.ra,
         "Center (DEC, dms): " + plateSolvedData.dec], false);

      this.targetView.endProcess();
   };

   this.exportParameters = function()
   {
      Parameters.set( "text", this.text );
      Parameters.set( "textTimestamp", this.textTimestamp );
      Parameters.set( "textOptics", this.textOptics );
      Parameters.set( "textSensor", this.textSensor );
      Parameters.set( "textStackInfo", this.textStackInfo );
      Parameters.set( "textSoftware", this.textSoftware );
      Parameters.set( "fontFace", this.fontFace );
      Parameters.set( "fontSize", this.fontSize );
      Parameters.set( "stretch", this.stretch );
      Parameters.set( "textColor", format( "0x%x", this.textColor ) );
      Parameters.set( "bkgColor", format( "0x%x", this.bkgColor ) );
      Parameters.set( "margin", this.margin );
   };

   this.draw = function(texts, leftAlign)
   {
      var image = this.targetView.image;

      // Create the font
      var font = new Font(this.fontFace);
      font.pixelSize = this.fontSize;
      font.stretchFactor = this.stretch;

      var innerMargin = Math.round( font.pixelSize/5 );

      var width = font.width(texts[0]) + 2 * innerMargin;
      for (var i = 1; i < texts.length; i++) {
         width = Math.max(width, font.width(texts[i])) + 2 * innerMargin;
      }
      var height = font.ascent + font.descent + 2 * innerMargin;
      for (var i = 1; i < texts.length; i++) {
         height += (texts[i].length > 0) ? font.descent + font.ascent : font.ascent / 2;
      }

      var bmp = new Bitmap(width, height);
      bmp.fill( this.bkgColor );

      var G = new Graphics(bmp);
      G.font = font;
      G.pen = new Pen(this.textColor);
      G.transparentBackground = true;
      G.textAntialiasing = true;

      var y = innerMargin + font.ascent;
      for (var i = 0; i < texts.length; i++) {
         if (i == 0) {font.bold = true;} else {font.bold = false;}
         G.font = font;
         G.drawText(innerMargin, y, texts[i]);
         y += (texts[i].length > 0) ? font.descent + font.ascent : font.ascent / 2;
      }

      G.end();

      if (leftAlign) {
         image.selectedPoint = new Point(this.margin, image.height - this.margin - height );
      } else {
         image.selectedPoint = new Point(image.width - width - this.margin, image.height - this.margin - height );
      }
      image.blend( bmp );
   }

   this.readPlateSolvedData = function() {
      var plateSolvedData = {};
      for (var i = 0; i < this.keywords.length; i++) {

         if (this.keywords[i].name == "OBJCTRA") {
            var match = /'(.+) (.+) (.+)'/.exec(this.keywords[i].value);
            plateSolvedData.ra = match[1] + "h " + match[2] + "m " + match[3] + "s";
            console.writeln("Found Image Center RA : ", plateSolvedData.ra);
         }else
         if (this.keywords[i].name == "OBJCTDEC") {
            var match = /'(.+) (.+) (.+)'/.exec(this.keywords[i].value);
            plateSolvedData.dec = match[1] + "° " + match[2] + "' " + match[3] + "\"";
            console.writeln("Found Image Center Dec: ", plateSolvedData.dec);
         } else
         if (this.keywords[i].name == "FOCALLEN") {
            plateSolvedData.focalLength = Number(this.keywords[i].value);
            console.writeln("Found Focal Length    : ", plateSolvedData.focalLength);
         }
      }

      return plateSolvedData;
   }

   this.initialize();
}


function main()
{
   var drawSignature = new DrawSignature;
   drawSignature.apply();
   return;
}

main();
