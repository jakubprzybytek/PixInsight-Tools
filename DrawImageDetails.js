#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define VERSION   0.1
#define TITLE     DrawImageDetails

var drawImageDetailsParameters = {
   title : "NGC2244 - Rosette",
   timestamp : "2018.01.07 23:50 CET",
   ota : "NT-203 (f=1000mm)",
   filters : "Ha"
};

function DrawImageDetails(parameters) {

   this.initialize = function() {

      this.textSensor = "ASI1600MM-C Pro (Exp 30s, Gain 139)";
//      this.textSensor = "Canon 550d (Exp 30s, ISO 800)";
      this.textStackInfo = "35 lights";
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
         this.parameters.title,
         this.parameters.timestamp,
         "",
         this.parameters.ota + ", " + this.parameters.filters,
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
      Parameters.set("title", this.parameters.title);
      Parameters.set("timestamp", this.parameters.timestamp);
      Parameters.set("ota", this.parameters.ota);
      Parameters.set("filters", this.parameters.filters);
      Parameters.set("textSensor", this.textSensor);
      Parameters.set("textStackInfo", this.textStackInfo);
      Parameters.set("textSoftware", this.textSoftware);
      Parameters.set("fontFace", this.fontFace);
      Parameters.set("fontSize", this.fontSize);
      Parameters.set("stretch", this.stretch);
      Parameters.set("textColor", format("0x%x", this.textColor));
      Parameters.set("bkgColor", format("0x%x", this.bkgColor));
      Parameters.set("margin", this.margin);
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

   this.parameters = parameters;
console.writeln("Tit: ", this.parameters.title);
   this.initialize();
}

function DrawImageDetailsDialog(parameters) {
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
      "</b> &mdash; This script...</p>";

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

   // Title
   this.title_Label = new Label(this);
   this.title_Label.text = "Title:";
   this.title_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.title_Label.minWidth = labelWidth1;

   this.title_Edit = new Edit(this);
   this.title_Edit.text = parameters.title;
   this.title_Edit.minWidth = 42 * emWidth;
   this.title_Edit.toolTip = "Enter title of the image";
   this.title_Edit.onEditCompleted = function()
   {
      parameters.title = this.text;
   };

   this.title_Sizer = new HorizontalSizer;
   this.title_Sizer.spacing = 4;
   this.title_Sizer.add(this.title_Label);
   this.title_Sizer.add(this.title_Edit);

   // Timestamp
   this.timestamp_Label = new Label(this);
   this.timestamp_Label.text = "Timestamp:";
   this.timestamp_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.timestamp_Label.minWidth = labelWidth1;

   this.timestamp_Edit = new Edit(this);
   this.timestamp_Edit.text = parameters.timestamp;
   this.timestamp_Edit.minWidth = 42 * emWidth;
   this.timestamp_Edit.toolTip = "Enter time when the image was taken";
   this.timestamp_Edit.onEditCompleted = function()
   {
      parameters.timestamp = this.text;
   };

   this.timestamp_Sizer = new HorizontalSizer;
   this.timestamp_Sizer.spacing = 4;
   this.timestamp_Sizer.add(this.timestamp_Label);
   this.timestamp_Sizer.add(this.timestamp_Edit);

   // ***********************
   // * Optic train
   // ***********************
   var labelWidthOpticTrain = this.font.width("Filters:");

   this.opticTrain_GroupBox = new GroupBox( this );
   this.opticTrain_GroupBox.title = "Optic train";

   // OTA
   this.opticTrain_Label = new Label(this);
   this.opticTrain_Label.text = "OTA:";
   this.opticTrain_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.opticTrain_Label.minWidth = labelWidthOpticTrain;

   this.opticTrain_Edit = new Edit(this);
   this.opticTrain_Edit.text = parameters.ota;
   this.opticTrain_Edit.minWidth = 21 * emWidth;
   this.opticTrain_Edit.toolTip = "Select the OTA";
   this.opticTrain_Edit.onEditCompleted = function()
   {
      parameters.ota = this.text;
   };

   // Filters
   this.filters_Label = new Label(this);
   this.filters_Label.text = "Filters:";
   this.filters_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.filters_Label.minWidth = labelWidthOpticTrain;


   this.filters_ComboBox = new ComboBox(this);
   this.filters_ComboBox.addItem( "None" );
   this.filters_ComboBox.addItem( "UHC" );
   this.filters_ComboBox.addItem( "Ha" );
   this.filters_ComboBox.editEnabled = true;
   this.filters_ComboBox.editText = parameters.filters;
   this.filters_ComboBox.toolTip = "Type or select filters set up.";
   this.filters_ComboBox.onEditTextUpdated = function()
   {
      parameters.filters = this.editText;
   };
   this.filters_ComboBox.onItemSelected = function(index)
   {
      parameters.filters = this.itemText(index);
   };

   this.otaFilters_Sizer = new HorizontalSizer;
   this.otaFilters_Sizer.spacing = 4;
   this.otaFilters_Sizer.add(this.opticTrain_Label);
   this.otaFilters_Sizer.add(this.opticTrain_Edit);
   this.otaFilters_Sizer.add(this.filters_Label);
   this.otaFilters_Sizer.add(this.filters_ComboBox);

   this.opticTrain_Sizer = new VerticalSizer;
   this.opticTrain_Sizer.margin = 4;
   this.opticTrain_Sizer.spacing = 4;
   this.opticTrain_Sizer.add(this.otaFilters_Sizer);

   this.opticTrain_GroupBox.sizer = this.opticTrain_Sizer;

   // ***********************
   // * Buttons
   // ***********************
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
   this.sizer.add(this.helpLabel);
   this.sizer.addSpacing( 4 );
   this.sizer.add(this.targetImage_Sizer);
   this.sizer.add(this.title_Sizer);
   this.sizer.add(this.timestamp_Sizer);
   this.sizer.add(this.opticTrain_GroupBox);
  //this.sizer.add( this.renderOptions_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = #TITLE + " Script";
   this.adjustToContents();
   //this.setFixedSize();
}

DrawImageDetailsDialog.prototype = new Dialog;

function main()
{
   var dialog = new DrawImageDetailsDialog(drawImageDetailsParameters);

   if (!dialog.execute()) {
      return;
   }

   var drawImageDetails = new DrawImageDetails(drawImageDetailsParameters);
   drawImageDetails.apply();
   return;
}

main();
