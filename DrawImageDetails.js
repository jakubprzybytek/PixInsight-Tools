#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define VERSION   0.1
#define TITLE     DrawImageDetails

var drawImageDetailsParameters = {
   title : "M1 - Crab Nebula",
   timestamp : "07.01.2018 23:50 CET",
   ota : "TS-102/7, TSRED379 (f=578)",
   sensor: "ASI1600MM-C Pro (Gain 139)",
   lightFrames: "Ha 60x2min, OIII 20x2min, SII 20x2min",
   calibrationFrames: "40 Flat, 30 Dark, 50 Bias",
   software : "SGPro, PI",
   options : {
         otas : [ "TS-102/7, TSRED379 (f=578)", "NT-203 (f=1000mm), MPCC" ],
         //filters : [ "None", "UHC", "CLS", "IRpass", "Ha", "OIII", "SII" ],
         sensor : ["ASI1600MM-C Pro (Gain 139)", "Canon 550d (ISO 800)"]
   },
   targetView: ImageWindow.activeWindow.currentView
};

function DrawImageDetails(parameters) {

   this.initialize = function() {

      this.fontFace = "Verdana";
      this.fontSize = 64; // px, 64
      this.stretch = 100;
      this.textColor = 0xff85929e;
      this.bkgColor = 0x80000000;
      this.margin = 32;

      var window = ImageWindow.windowById(parameters.targetView.id);// ImageWindow.activeWindow;
      if (!window.isNull) {
         this.targetView = window.currentView;
         this.keywords = window.keywords;
      }

      console.writeln("Using view: ", this.targetView.id);
   }

   this.apply = function() {
      this.exportParameters();

      this.targetView.beginProcess();

      // Image Details
      this.drawImageDetails();

      // Plate Solving Data
      this.drawImageSolveData();

      this.targetView.endProcess();
   };

   this.drawImageDetails = function() {
      this.draw([
         this.parameters.title,
         this.parameters.timestamp,
         "",
         this.parameters.ota,
         this.parameters.sensor,
         this.parameters.lightFrames,
         this.parameters.calibrationFrames,
         "",
         this.parameters.software], true);
   }

   this.drawImageSolveData = function() {
      var imageWidth = this.targetView.image.width;
      var imageHeight = this.targetView.image.height;
      var plateSolvedData = this.readPlateSolvedData();

      var xResolution = Math.atan(plateSolvedData.xPixSize / 2000.0 / plateSolvedData.focalLength) * 2.0 * 180.0 / Math.PI * 3600;
      var xScale = Math.atan(plateSolvedData.xPixSize * imageWidth / 2000.0 / plateSolvedData.focalLength) * 2.0 * 180.0 / Math.PI * 3600;
      var yScale = Math.atan(plateSolvedData.xPixSize * imageHeight / 2000.0 / plateSolvedData.focalLength) * 2.0 * 180.0 / Math.PI * 3600;
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
   }

   this.exportParameters = function()
   {
      Parameters.set("title", this.parameters.title);
      Parameters.set("timestamp", this.parameters.timestamp);
      Parameters.set("ota", this.parameters.ota);
      Parameters.set("sensor", this.parameters.sensor);
      Parameters.set("lightFrames", this.parameters.lightFrames);
      Parameters.set("calibrationFrames", this.parameters.calibrationFrames);
      Parameters.set("software", this.parameters.software);
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

   this.initialize();
}

function DrawImageDetailsDialog(parameters) {
   this.__base__ = Dialog;
   this.__base__();

   //

   var emWidth = this.font.width( 'M' );
   var labelWidth1 = this.font.width( "Target image:" );

   //

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + #TITLE + " v" + #VERSION +
      "</b> &mdash; This script annotates the image using plate solving data and details provided by the user.</p>";

   //

   this.targetImage_Label = new Label(this);
   this.targetImage_Label.text = "Target image:";
   this.targetImage_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.targetImage_Label.minWidth = labelWidth1;

   this.targetImage_ViewList = new ViewList(this);
   this.targetImage_ViewList.getAll();
   this.targetImage_ViewList.currentView = parameters.targetView;
   this.targetImage_ViewList.toolTip = "Select the image to draw the text over";
   this.targetImage_ViewList.onViewSelected = function(view)
   {
      parameters.targetView = view;
   };

   this.targetImage_Sizer = new HorizontalSizer;
   this.targetImage_Sizer.spacing = 4;
   this.targetImage_Sizer.add(this.targetImage_Label);
   this.targetImage_Sizer.add(this.targetImage_ViewList, 100);

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

   this.now_Button = new PushButton(this);
   this.now_Button.text = "Now";
   this.now_Button.onClick = function()
   {
      var now = new Date();
      var dd = now.getDate();
      var mm = now.getMonth() + 1;
      var date = (dd < 10 ? '0' : '') + dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + now.getFullYear();
      var time = now.getHours() + ":00";
      this.dialog.timestamp_Edit.text = date + " " + time;
      parameters.timestamp = date + " " + time;
   };

   this.timestamp_Sizer = new HorizontalSizer;
   this.timestamp_Sizer.spacing = 4;
   this.timestamp_Sizer.add(this.timestamp_Label);
   this.timestamp_Sizer.add(this.timestamp_Edit);
   this.timestamp_Sizer.add(this.now_Button);

   // ***********************
   // * Optical train and sensor
   // ***********************
   var labelWidthOpticTrain = this.font.width("Sensor:");

   this.opticTrain_GroupBox = new GroupBox( this );
   this.opticTrain_GroupBox.title = "Optical train";

   // OTA
   this.ota_Label = new Label(this);
   this.ota_Label.text = "OTA:";
   this.ota_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.ota_Label.minWidth = labelWidthOpticTrain;

   this.ota_ComboBox = new ComboBox(this);
   for (var ota of parameters.options.otas) {
      this.ota_ComboBox.addItem(ota);
   }
   this.ota_ComboBox.editEnabled = true;
   this.ota_ComboBox.editText = parameters.ota;
   this.ota_ComboBox.minWidth = 42 * emWidth;
   this.ota_ComboBox.toolTip = "Type or select the OTA";
   this.ota_ComboBox.onEditTextUpdated = function()
   {
      parameters.ota = this.editText;
   };
   this.ota_ComboBox.onItemSelected = function(index)
   {
      parameters.ota = this.itemText(index);
   };

   this.ota_Sizer = new HorizontalSizer;
   this.ota_Sizer.spacing = 4;
   this.ota_Sizer.add(this.ota_Label);
   this.ota_Sizer.add(this.ota_ComboBox);

   // Sensor
   this.sensor_Label = new Label(this);
   this.sensor_Label.text = "Sensor:";
   this.sensor_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.sensor_Label.minWidth = labelWidthOpticTrain;

   this.sensor_ComboBox = new ComboBox(this);
   for (var sensor of parameters.options.sensor) {
      this.sensor_ComboBox.addItem(sensor);
   }
   this.sensor_ComboBox.editEnabled = true;
   this.sensor_ComboBox.editText = parameters.sensor;
   this.sensor_ComboBox.minWidth = 21 * emWidth;
   this.sensor_ComboBox.toolTip = "Type or select sensor from the list.";
   this.sensor_ComboBox.onEditTextUpdated = function()
   {
      parameters.sensor = this.editText;
   };
   this.sensor_ComboBox.onItemSelected = function(index)
   {
      parameters.sensor = this.itemText(index);
   };

   this.sensor_Sizer = new HorizontalSizer;
   this.sensor_Sizer.spacing = 4;
   this.sensor_Sizer.add(this.sensor_Label);
   this.sensor_Sizer.add(this.sensor_ComboBox);

   this.opticTrain_Sizer = new VerticalSizer;
   this.opticTrain_Sizer.margin = 4;
   this.opticTrain_Sizer.spacing = 4;
   this.opticTrain_Sizer.add(this.ota_Sizer);
   this.opticTrain_Sizer.add(this.sensor_Sizer);

   this.opticTrain_GroupBox.sizer = this.opticTrain_Sizer;

   // ***********************
   // * Integration details
   // ***********************
   var labelWidthIntegration = this.font.width("Calibration frames:");

   this.integrationDetails_GroupBox = new GroupBox(this);
   this.integrationDetails_GroupBox.title = "Integration details";

   // Light frames
   this.lightFrames_Label = new Label(this);
   this.lightFrames_Label.text = "Light frames:";
   this.lightFrames_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.lightFrames_Label.minWidth = labelWidthIntegration;

   this.lightFrames_Edit = new Edit(this);
   this.lightFrames_Edit.text = parameters.lightFrames;
   this.lightFrames_Edit.minWidth = 21 * emWidth;
   this.lightFrames_Edit.toolTip = "Enter number of light frames";
   this.lightFrames_Edit.onEditCompleted = function()
   {
      parameters.lightFrames = this.text;
   };

   this.ligthFrames_Sizer = new HorizontalSizer;
   this.ligthFrames_Sizer.spacing = 4;
   this.ligthFrames_Sizer.add(this.lightFrames_Label);
   this.ligthFrames_Sizer.add(this.lightFrames_Edit);

   // Calibration frames
   this.calibrationFrames_Label = new Label(this);
   this.calibrationFrames_Label.text = "Calibration frames:";
   this.calibrationFrames_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.calibrationFrames_Label.minWidth = labelWidthIntegration;

   this.calibrationFrames_Edit = new Edit(this);
   this.calibrationFrames_Edit.text = parameters.calibrationFrames;
   this.calibrationFrames_Edit.minWidth = 21 * emWidth;
   this.calibrationFrames_Edit.toolTip = "Enter number of calibration frames";
   this.calibrationFrames_Edit.onEditCompleted = function()
   {
      parameters.calibrationFrames = this.text;
   };

   this.calibrationFrames_Sizer = new HorizontalSizer;
   this.calibrationFrames_Sizer.spacing = 4;
   this.calibrationFrames_Sizer.add(this.calibrationFrames_Label);
   this.calibrationFrames_Sizer.add(this.calibrationFrames_Edit);

   this.integrationDetails_Sizer = new VerticalSizer;
   this.integrationDetails_Sizer.margin = 4;
   this.integrationDetails_Sizer.spacing = 4;
   this.integrationDetails_Sizer.add(this.ligthFrames_Sizer);
   this.integrationDetails_Sizer.add(this.calibrationFrames_Sizer);

   this.integrationDetails_GroupBox.sizer = this.integrationDetails_Sizer;

   // ***********************
   // * Software
   // ***********************
   var labelWidthSoftware = this.font.width("Software:");

   this.software_GroupBox = new GroupBox(this);
   this.software_GroupBox.title = "Software used";

   this.software_Label = new Label(this);
   this.software_Label.text = "Software:";
   this.software_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.software_Label.minWidth = labelWidthSoftware;

   this.software_Edit = new Edit(this);
   this.software_Edit.text = parameters.software;
   this.software_Edit.minWidth = 21 * emWidth;
   this.software_Edit.toolTip = "Enter software used in acquisition and processing";
   this.software_Edit.onEditCompleted = function()
   {
      parameters.software = this.text;
   };

   this.software_Sizer = new HorizontalSizer;
   this.software_Sizer.spacing = 4;
   this.software_Sizer.add(this.software_Label);
   this.software_Sizer.add(this.software_Edit);

   this.softwareGroup_Sizer = new VerticalSizer;
   this.softwareGroup_Sizer.margin = 4;
   this.softwareGroup_Sizer.spacing = 4;
   this.softwareGroup_Sizer.add(this.software_Sizer);

   this.software_GroupBox.sizer = this.softwareGroup_Sizer;

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
   this.sizer.add(this.integrationDetails_GroupBox);
   this.sizer.add(this.software_GroupBox);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = #TITLE + " Script";
   this.adjustToContents();
   //this.setFixedSize();
}

DrawImageDetailsDialog.prototype = new Dialog;

function main()
{
   //drawImageDetailsParameters.targetView = window.currentView;

   var dialog = new DrawImageDetailsDialog(drawImageDetailsParameters);

   if (!dialog.execute()) {
      return;
   }

   var drawImageDetails = new DrawImageDetails(drawImageDetailsParameters);
   drawImageDetails.apply();
   return;
}

main();
