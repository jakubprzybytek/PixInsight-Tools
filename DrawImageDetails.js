#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define VERSION   0.1
#define TITLE     DrawImageDetails

function DrawSignature() {

   this.initialize = function() {

      this.text = "M15";
      this.textTimestamp = "2017.09.18 23:50 CEST";
      this.textOptics = "NT-203 (f=1000mm), UHC";
      this.textSensor = "Canon 550d (Exp 30s, ISO 800)";
      this.textStackInfo = "97 lights, 30 darks, 30 bias";
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

      var xResolution = Math.atan(plateSolvedData.xPixSize / 2000.0 / plateSolvedData.focalLength) * 2.0 * 180.0 / Math.PI * 3600;
      var xScale = Math.atan(plateSolvedData.xPixSize * 5202.0 / 2000.0 / plateSolvedData.focalLength) * 2.0 * 180.0 / Math.PI * 3600;
      var yScale = Math.atan(plateSolvedData.xPixSize * 3464.0 / 2000.0 / plateSolvedData.focalLength) * 2.0 * 180.0 / Math.PI * 3600;
      xScale /= 60.0;
      yScale /= 60.0;

      console.writeln("Computed X Pix Resolution [\"/px]: ", xResolution);
      console.writeln("Computed X Scale [\'/px]: ", xScale);
      console.writeln("Computed Y Scale [\'/px]: ", yScale);

      this.draw([
         "Calibration",
         "Center (RA, hms): " + plateSolvedData.ra,
         "Center (DEC, dms): " + plateSolvedData.dec,
         "Scale (\'/px): " + xScale.toFixed(2) + "' x " + yScale.toFixed(2) + "'",
         "Resolution (\"/px): " + xResolution.toFixed(2)], false);

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
            console.writeln("Found Image Center RA  [hms]: ", plateSolvedData.ra);
         }else
         if (this.keywords[i].name == "OBJCTDEC") {
            var match = /'(.+) (.+) (.+)'/.exec(this.keywords[i].value);
            plateSolvedData.dec = match[1] + "° " + match[2] + "' " + match[3] + "\"";
            console.writeln("Found Image Center Dec [deg]: ", plateSolvedData.dec);
         } else
         if (this.keywords[i].name == "FOCALLEN") {
            plateSolvedData.focalLength = Number(this.keywords[i].value);
            console.writeln("Found Focal Length      [mm]: ", plateSolvedData.focalLength);
         } else
         if (this.keywords[i].name == "XPIXSZ") {
            plateSolvedData.xPixSize = Number(this.keywords[i].value);
            console.writeln("Found X Pix Size         [u]: ", plateSolvedData.xPixSize);
         }
      }

      return plateSolvedData;
   }

   this.initialize();
}

function DrawImageDetailsDialog() {
   this.__base__ = Dialog;
   this.__base__();

   //

   var emWidth = this.font.width( 'M' );
   var labelWidth1 = this.font.width( "Target image:" );

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + #TITLE + " v" + #VERSION +
      "</b> &mdash; This script draws an arbitrary text at the lower-left corner of " +
      "an image. You can enter the text to draw and select the font, along with a " +
      "number of operating parameters below.</p>" +
      "<p>To apply the script, click the OK button. To close this dialog without " +
      "making any changes, click the Cancel button.</p>";

   //

   this.targetImage_Label = new Label( this );
   this.targetImage_Label.text = "Target image:";
   this.targetImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.targetImage_Label.minWidth = labelWidth1;

   this.targetImage_ViewList = new ViewList( this );
   this.targetImage_ViewList.getAll();
   //this.targetImage_ViewList.currentView = engine.targetView;
   this.targetImage_ViewList.toolTip = "Select the image to draw the text over";
   this.targetImage_ViewList.onViewSelected = function( view )
   {
      //engine.targetView = view;
   };

   this.targetImage_Sizer = new HorizontalSizer;
   this.targetImage_Sizer.spacing = 4;
   this.targetImage_Sizer.add( this.targetImage_Label );
   this.targetImage_Sizer.add( this.targetImage_ViewList, 100 );


   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 24, 24 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      engine.exportParameters();
      this.pushed = false;
      this.dialog.newInstance();
   };

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add( this.newInstance_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.targetImage_Sizer );
   //this.sizer.add( this.text_Sizer );
   //this.sizer.add( this.font_GroupBox );
   //this.sizer.add( this.renderOptions_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = #TITLE + " Script";
   this.adjustToContents();
   //this.setFixedSize();
}

DrawImageDetailsDialog.prototype = new Dialog;

function main()
{
   var dialog = new DrawImageDetailsDialog();

   if ( !dialog.execute() )
      return;

   var drawSignature = new DrawSignature;
   drawSignature.apply();
   return;
}

main();
