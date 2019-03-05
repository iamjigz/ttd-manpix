(function() {
  var ns = $.namespace("pskl.controller.settings.exportimage");

  var dimensionInfoPattern =
    "{{width}} x {{height}} px, {{frames}}<br/>{{columns}}, {{rows}}.";

  var replace = pskl.utils.Template.replace;

  // Helper to return "X items" or "1 item" if X is 1.
  var pluralize = function(word, count) {
    if (count === 1) {
      return "1 " + word;
    }
    return count + " " + word + "s";
  };

  ns.PngExportController = function(piskelController, exportController) {
    this.piskelController = piskelController;
    this.exportController = exportController;
    this.onScaleChanged_ = this.onScaleChanged_.bind(this);
  };

  pskl.utils.inherit(
    ns.PngExportController,
    pskl.controller.settings.AbstractSettingController
  );

  ns.PngExportController.prototype.init = function() {
    this.showGrid = true;

    this.layoutContainer = document.querySelector(".png-export-layout-section");
    this.dimensionInfo = document.querySelector(".png-export-dimension-info");

    this.rowsInput = document.querySelector("#png-export-rows");
    this.columnsInput = document.querySelector("#png-export-columns");

    var downloadButton = document.querySelector(".png-download-button");
    var downloadPDFButton = document.querySelector(".png-download-pdf-button");
    var downloadPixiButton = document.querySelector(
      ".png-pixi-download-button"
    );
    var dataUriButton = document.querySelector(".datauri-open-button");

    var showGridInput = document.querySelector("input#png-show-grid");
    showGridInput.checked = this.showGrid;

    this.initLayoutSection_();
    this.updateDimensionLabel_();

    this.addEventListener(this.columnsInput, "input", this.onColumnsInput_);
    this.addEventListener(downloadButton, "click", this.onDownloadClick_);
    this.addEventListener(downloadPDFButton, "click", this.onDownloadPDFClick_);
    this.addEventListener(
      downloadPixiButton,
      "click",
      this.onPixiDownloadClick_
    );
    this.addEventListener(dataUriButton, "click", this.onDataUriClick_);
    this.addEventListener(showGridInput, "change", this.onShowGridChange_);
    $.subscribe(Events.EXPORT_SCALE_CHANGED, this.onScaleChanged_);
  };

  ns.PngExportController.prototype.destroy = function() {
    $.unsubscribe(Events.EXPORT_SCALE_CHANGED, this.onScaleChanged_);
    this.superclass.destroy.call(this);
  };

  /**
   * Initalize all controls related to the spritesheet layout.
   */
  ns.PngExportController.prototype.initLayoutSection_ = function() {
    var frames = this.piskelController.getFrameCount();
    if (frames === 1) {
      // Hide the layout section if only one frame is defined.
      this.layoutContainer.style.display = "none";
    } else {
      this.columnsInput.setAttribute("max", frames);
      this.columnsInput.value = this.getBestFit_();
      this.onColumnsInput_();
    }
  };

  ns.PngExportController.prototype.updateDimensionLabel_ = function() {
    var zoom = this.exportController.getExportZoom();
    var frames = this.piskelController.getFrameCount();
    var width = this.piskelController.getWidth() * zoom;
    var height = this.piskelController.getHeight() * zoom;

    var columns = this.getColumns_();
    var rows = this.getRows_();
    width = columns * width;
    height = rows * height;

    this.dimensionInfo.innerHTML = replace(dimensionInfoPattern, {
      width: width,
      height: height,
      rows: pluralize("row", rows),
      columns: pluralize("column", columns),
      frames: pluralize("frame", frames)
    });
  };

  ns.PngExportController.prototype.getColumns_ = function() {
    return parseInt(this.columnsInput.value || 1, 10);
  };

  ns.PngExportController.prototype.getRows_ = function() {
    return parseInt(this.rowsInput.value || 1, 10);
  };

  ns.PngExportController.prototype.getBestFit_ = function() {
    var ratio =
      this.piskelController.getWidth() / this.piskelController.getHeight();
    var frameCount = this.piskelController.getFrameCount();
    var bestFit = Math.round(Math.sqrt(frameCount / ratio));

    return pskl.utils.Math.minmax(bestFit, 1, frameCount);
  };

  ns.PngExportController.prototype.onScaleChanged_ = function() {
    this.updateDimensionLabel_();
  };

  /**
   * Synchronise column and row inputs, called everytime a user input updates one of the
   * two inputs by the SynchronizedInputs widget.
   */
  ns.PngExportController.prototype.onColumnsInput_ = function() {
    var value = this.columnsInput.value;
    if (value === "") {
      // Skip the synchronization if the input is empty.
      return;
    }

    value = parseInt(value, 10);
    if (isNaN(value)) {
      value = 1;
    }

    // Force the value to be in bounds, if the user tried to update it by directly typing
    // a value.
    value = pskl.utils.Math.minmax(
      value,
      1,
      this.piskelController.getFrameCount()
    );
    this.columnsInput.value = value;

    // Update readonly rowsInput
    this.rowsInput.value = Math.ceil(
      this.piskelController.getFrameCount() / value
    );
    this.updateDimensionLabel_();
  };

  ns.PngExportController.prototype.createPngSpritesheet_ = function() {
    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    var outputCanvas = renderer.renderAsCanvas(
      this.getColumns_(),
      this.getRows_()
    );
    var width = outputCanvas.width;
    var height = outputCanvas.height;

    var zoom = this.exportController.getExportZoom();
    if (zoom != 1) {
      var gridWidth = pskl.UserSettings.get(pskl.UserSettings.GRID_WIDTH);
      var gridSpacing = pskl.UserSettings.get(pskl.UserSettings.GRID_SPACING);
      var gridColor = pskl.UserSettings.get(pskl.UserSettings.GRID_COLOR);
      outputCanvas = pskl.utils.ImageResizer.resize(
        outputCanvas,
        width * zoom,
        height * zoom,
        false
      );

      if (this.showGrid) {
        var ctx = outputCanvas.getContext("2d");

        gridColor = pskl.utils.ColorUtils.hex2Rgb(gridColor);
        ctx.fillStyle = gridColor;
        var fillRect = ctx.fillRect.bind(ctx);
        if (gridColor === Constants.TRANSPARENT_COLOR) {
          fillRect = ctx.clearRect.bind(ctx);
        }

        for (var i = 1; i <= height; i++) {
          var y = i * zoom * gridSpacing;
          fillRect(0, y, zoom * width, (gridWidth * zoom) / 32);
        }
        for (var j = 1; j <= width; j++) {
          var x = j * zoom * gridSpacing;
          fillRect(x, 0, (gridWidth * zoom) / 32, zoom * height);
        }
      }
    }

    return outputCanvas;
  };

  ns.PngExportController.prototype.onDownloadClick_ = function(evt) {
    // Create PNG export.
    var canvas = this.createPngSpritesheet_();
    this.downloadCanvas_(canvas);
  };

  ns.PngExportController.prototype.onDownloadPDFClick_ = function(evt) {
    var canvas = this.createPngSpritesheet_();
    var headerHeight = canvas.height / 15;
    var fontSize = Math.floor(headerHeight / 6);
    var imgMargin = Math.floor(fontSize / 2);

    var orientation = canvas.width > canvas.height ? "l" : "p";
    var doc = new jsPDF({
      orientation: orientation,
      unit: "pt",
      format: [
        canvas.width * 0.75,
        canvas.height * 0.75 + (headerHeight + imgMargin * 2)
      ]
    });

    //A4 size: [ 841.89, 595.28],
    var n = orientation == "l" ? 841.89 : 595.28;

    doc.setFontStyle("bold");
    doc.setFontSize(fontSize);
    doc.text(
      // TODO: Header and PDP must be fetched through ajax
      ["manufacturedupixel.com", "00 Avenue AAA BBB CCC, 00000 DDD, France"],
      imgMargin * 2.5 + headerHeight,
      headerHeight / 2,
      {
        baseline: "middle"
      }
    );

    var logo = $("#manufacture-du-pixel");
    doc.addImage(
      logo[0],
      "PNG",
      imgMargin,
      imgMargin,
      headerHeight,
      headerHeight
    );
    doc.line(
      0,
      imgMargin * 2 + headerHeight,
      Math.max(canvas.width, n),
      imgMargin * 2 + headerHeight
    );

    doc.addImage(
      canvas,
      "PNG",
      0,
      imgMargin * 2 + headerHeight,
      canvas.width * 0.75,
      canvas.height * 0.75
    );
    doc.save();
  };

  // Used and overridden in casper integration tests.
  ns.PngExportController.prototype.downloadCanvas_ = function(canvas) {
    // Generate file name
    var name = this.piskelController.getPiskel().getDescriptor().name;
    var fileName = name + ".png";

    // Transform to blob and start download.
    pskl.utils.BlobUtils.canvasToBlob(canvas, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    });
  };

  ns.PngExportController.prototype.onPixiDownloadClick_ = function() {
    var zip = new window.JSZip();

    // Create PNG export.
    var canvas = this.createPngSpritesheet_();
    var name = this.piskelController.getPiskel().getDescriptor().name;

    zip.file(
      name + ".png",
      pskl.utils.CanvasUtils.getBase64FromCanvas(canvas) + "\n",
      { base64: true }
    );

    var width = canvas.width / this.getColumns_();
    var height = canvas.height / this.getRows_();

    var numFrames = this.piskelController.getFrameCount();
    var frames = {};
    for (var i = 0; i < numFrames; i++) {
      var column = i % this.getColumns_();
      var row = (i - column) / this.getColumns_();
      var frame = {
        frame: { x: width * column, y: height * row, w: width, h: height },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: width, h: height },
        sourceSize: { w: width, h: height }
      };
      frames[name + i + ".png"] = frame;
    }

    var json = {
      frames: frames,
      meta: {
        app: "https://github.com/piskelapp/piskel/",
        version: "1.0",
        image: name + ".png",
        format: "RGBA8888",
        size: { w: canvas.width, h: canvas.height }
      }
    };
    zip.file(name + ".json", JSON.stringify(json));

    var blob = zip.generate({
      type: "blob"
    });

    pskl.utils.FileUtils.downloadAsFile(blob, name + ".zip");
  };

  ns.PngExportController.prototype.onDataUriClick_ = function(evt) {
    var popup = window.open("about:blank");
    var dataUri = this.createPngSpritesheet_().toDataURL("image/png");
    window.setTimeout(
      function() {
        var html = pskl.utils.Template.getAndReplace(
          "data-uri-export-partial",
          {
            src: dataUri
          }
        );
        popup.document.title = dataUri;
        popup.document.body.innerHTML = html;
      }.bind(this),
      500
    );
  };

  ns.PngExportController.prototype.onShowGridChange_ = function(evt) {
    this.showGrid = evt.target.checked;
  };
})();
