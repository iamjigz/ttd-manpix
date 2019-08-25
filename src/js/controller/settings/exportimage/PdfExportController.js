(function() {
  var ns = $.namespace('pskl.controller.settings.exportimage');
  var UserSettings = pskl.UserSettings;

  // scale canvas to avoid blurry text
  var CANVAS_SCALE = 3.1;
  var PX_TO_CM = 38 * CANVAS_SCALE;
  var PX_TO_PT = 0.75 / CANVAS_SCALE;

  function applyI18n() {
    pskl.utils.applyI18nDOM('.export-panel-header.export-info', {
      '|TYPE|': 'PDF'
    });
    pskl.utils.applyI18nDOM(
      '.settings-item.export-scale > label[for=scale-input]'
    );
    pskl.utils.applyI18nDOM(
      '.export-panel-section.export-panel-row label[for=pdf-show-grid]'
    );
    pskl.utils.applyI18nDOM(
      '.export-panel-section.export-panel-row .pdf-grid-note'
    );
    pskl.utils.applyI18nDOM(
      '.export-panel-section.export-panel-row label[for=pdf-show-cell-counter]'
    );
    pskl.utils.applyI18nDOM(
      '.export-panel-section.export-panel-row label[for=pdf-hide-image]'
    );
    pskl.utils.applyI18nDOM(
      '.export-panel-section.export-panel-row .pdf-download-button'
    );
    pskl.utils.applyI18nDOM(
      '.export-panel-section.export-panel-row .pdf-export-datauri-info.export-info'
    );
  }

  ns.PdfExportController = function(piskelController, exportController) {
    this.piskelController = piskelController;
    this.exportController = exportController;
  };

  pskl.utils.inherit(
    ns.PdfExportController,
    pskl.controller.settings.AbstractSettingController
  );

  ns.PdfExportController.prototype.init = function() {
    var downloadButton = document.querySelector('.pdf-download-button');
    var showGridInput = document.querySelector('input#pdf-show-grid');
    var hideImageInput = document.querySelector('input#pdf-hide-image');
    var showCellCounterInput = document.querySelector(
      'input#pdf-show-cell-counter'
    );

    // Initialize zoom controls
    this.widthInput = document.querySelector('.export-resize .resize-width');
    this.heightInput = document.querySelector('.export-resize .resize-height');

    this.showCellCounter = UserSettings.get(UserSettings.SHOW_CELL_COUNTER);
    this.showGrid = UserSettings.get(UserSettings.EXPORT_INCLUDE_GRID);
    this.hideImage = UserSettings.get(UserSettings.EXPORT_HIDE_IMAGE);
    this.layoutContainer = document.querySelector('.pdf-export-layout-section');
    this.dimensionInfo = document.querySelector('.pdf-export-dimension-info');

    this.rowsInput = document.querySelector('#pdf-export-rows');
    this.columnsInput = document.querySelector('#pdf-export-columns');

    showGridInput.checked = this.showGrid;
    hideImageInput.checked = this.hideImage;
    showCellCounterInput.checked = this.showCellCounter;

    this.initLayoutSection_();

    this.addEventListener(this.columnsInput, 'input', this.onColumnsInput_);
    this.addEventListener(downloadButton, 'click', this.onDownloadClick_);
    this.addEventListener(showGridInput, 'change', this.onShowGridChange_);
    this.addEventListener(hideImageInput, 'change', this.onHideImageChange_);
    this.addEventListener(
      showCellCounterInput,
      'change',
      this.onShowCellCounterChange_
    );

    applyI18n();
  };

  ns.PdfExportController.prototype.onScaleChange_ = function() {
    var value = PX_TO_CM;
    if (!isNaN(value)) {
      UserSettings.set(UserSettings.EXPORT_SCALE, value);
    }
  };

  ns.PdfExportController.prototype.destroy = function() {
    this.superclass.destroy.call(this);
  };

  ns.PdfExportController.prototype.getExportZoom = function() {
    return (
      parseInt(this.widthInput.value, 10) / this.piskelController.getWidth()
    );
  };

  /**
   * Initalize all controls related to the spritesheet layout.
   */
  ns.PdfExportController.prototype.initLayoutSection_ = function() {
    var frames = this.piskelController.getFrameCount();
    if (frames === 1) {
      // Hide the layout section if only one frame is defined.
      this.layoutContainer.style.display = 'none';
    } else {
      this.columnsInput.setAttribute('max', frames);
      this.columnsInput.value = this.getBestFit_();
      this.onColumnsInput_();
    }
  };

  ns.PdfExportController.prototype.getColumns_ = function() {
    return parseInt(this.columnsInput.value || 1, 10);
  };

  ns.PdfExportController.prototype.getRows_ = function() {
    return parseInt(this.rowsInput.value || 1, 10);
  };

  ns.PdfExportController.prototype.getBestFit_ = function() {
    var ratio =
      this.piskelController.getWidth() / this.piskelController.getHeight();
    var frameCount = this.piskelController.getFrameCount();
    var bestFit = Math.round(Math.sqrt(frameCount / ratio));

    return pskl.utils.Math.minmax(bestFit, 1, frameCount);
  };

  /**
   * Synchronise column and row inputs, called everytime a user input updates one of the
   * two inputs by the SynchronizedInputs widget.
   */
  ns.PdfExportController.prototype.onColumnsInput_ = function() {
    var value = this.columnsInput.value;
    if (value === '') {
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
  };

  ns.PdfExportController.prototype.createPngSpritesheet_ = function() {
    var renderer = new pskl.rendering.PiskelRenderer(
      this.piskelController,
      '#FFFFFF'
    );
    var outputCanvas = renderer.renderAsCanvas(
      this.getColumns_(),
      this.getRows_()
    );
    var width = outputCanvas.width;
    var height = outputCanvas.height;

    var zoom = PX_TO_CM;
    if (zoom != 1) {
      var gridWidth = UserSettings.get(UserSettings.GRID_WIDTH);
      var gridSpacing = UserSettings.get(UserSettings.GRID_SPACING);
      var gridColor = UserSettings.get(UserSettings.GRID_COLOR);

      outputCanvas = pskl.utils.ImageResizer.resize(
        outputCanvas,
        width * zoom,
        height * zoom,
        false,
        zoom
      );

      var CanvasUtils = pskl.utils.CanvasUtils;
      if (this.hideImage) {
        var pixels = this.piskelController.getCurrentFrame().pixels;
        CanvasUtils.drawNumberGrid(outputCanvas, pixels, width, height, zoom);
      }
      if (this.showCellCounter) {
        width += 1;
        height += 1;
        outputCanvas = CanvasUtils.drawCounterGuide(outputCanvas, zoom);
      }
      if (this.showGrid) {
        CanvasUtils.drawGrid(outputCanvas, width, height, zoom);
      }
    }

    return outputCanvas;
  };

  ns.PdfExportController.prototype.onDownloadClick_ = function(evt) {
    var canvas = this.createPngSpritesheet_();
    var headerHeight = 50;
    var legendSize = 8;
    var footerHeight = this.hideImage ? legendSize * 4 : 0;
    var fontSize = Math.floor(headerHeight / 5);
    var imgMargin = Math.floor(fontSize / 2);
    var frame = this.piskelController.getCurrentFrame();
    var orientation = canvas.width > canvas.height ? 'l' : 'p';
    var docWidth = orientation == 'l' ? 841.89 : 595.28; // A4 sizes
    var doc = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: [
        canvas.width * PX_TO_PT,
        canvas.height * PX_TO_PT + (headerHeight + imgMargin * 2) + footerHeight
      ]
    });

    doc.setFontStyle('bold');
    doc.setFontSize(fontSize);
    doc.text(
      // TODO: Header and PDP must be fetched through ajax
      [
        'www.manufacturedupixel.com',
        'Pixel art · Loisir créatif · Mosaïque · Fun !'
      ],
      imgMargin * 2.5 + headerHeight,
      headerHeight / 2,
      {
        baseline: 'middle'
      }
    );

    var logo = $('#manufacture-du-pixel');
    doc.addImage(
      logo[0],
      'PNG',
      imgMargin,
      imgMargin,
      headerHeight,
      headerHeight
    );

    var gridWidth = UserSettings.get(UserSettings.GRID_WIDTH);
    var lineHeight = gridWidth;
    var gridColor = pskl.UserSettings.get(pskl.UserSettings.GRID_COLOR);
    if (gridColor == Constants.TRANSPARENT_COLOR) {
      gridColor = '#000000';
    }
    try {
      doc.setFillColor(gridColor);
    } catch (e) {
      /* ignore unrecognized colors */
    }

    // line below header
    doc.rect(
      0,
      imgMargin * 2 + headerHeight - lineHeight,
      Math.max(canvas.width * PX_TO_PT, docWidth),
      lineHeight,
      'F'
    );

    doc.addImage(
      canvas,
      'PNG',
      0,
      imgMargin * 2 + headerHeight,
      canvas.width * PX_TO_PT,
      canvas.height * PX_TO_PT
    );

    var footerY = headerHeight + imgMargin * 2 + +canvas.height * PX_TO_PT;
    // line above footer
    doc.rect(
      0,
      footerY,
      Math.max(canvas.width * PX_TO_PT, docWidth),
      lineHeight,
      'F'
    );

    if (this.hideImage) {
      // draw color legend
      var colors = pskl.app.paletteService.getColors();
      var textLength = legendSize * 4;
      var nextLine = false;

      var i = 0;
      var n = 0;
      var w = ((legendSize / 5.0 + textLength) * (colors.length - 1)) / 2;
      var baseX = (canvas.width * PX_TO_PT - w) / 2;

      for (var i in colors) {
        var color = colors[i];
        if (color == Constants.TRANSPARENT_COLOR) {
          color = '#FFFFFF';
        }
        var x = baseX + (legendSize / 5.0 + textLength) * n;
        doc.setFillColor(color);
        doc.setDrawColor('#000000');
        doc.setFontSize(legendSize);
        doc.rect(x, footerY + legendSize, legendSize * 2, legendSize, 'FD');
        doc.text(i + '', x + legendSize * 2.5, footerY + legendSize, {
          baseline: 'top'
        });
        n++;
        if (n >= colors.length / 2 && !nextLine) {
          n = 0;
          footerY += legendSize + legendSize / 2;
          nextLine = true;
        }
      }
    }

    doc.save('piskel.pdf');
  };

  ns.PdfExportController.prototype.onShowGridChange_ = function(evt) {
    this.showGrid = evt.target.checked;
    UserSettings.set(UserSettings.EXPORT_INCLUDE_GRID, this.showGrid);
  };
  ns.PdfExportController.prototype.onHideImageChange_ = function(evt) {
    this.hideImage = evt.target.checked;
    UserSettings.set(UserSettings.EXPORT_HIDE_IMAGE, this.hideImage);
  };
  ns.PdfExportController.prototype.onShowCellCounterChange_ = function(evt) {
    this.showCellCounter = evt.target.checked;
    UserSettings.set(UserSettings.EXPORT_HIDE_IMAGE, this.showCellCounter);
  };
})();
