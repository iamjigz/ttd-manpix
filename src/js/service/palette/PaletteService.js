(function () {
  var ns = $.namespace('pskl.service.palette');

  var dec2Hex = function(n) {
    var hex = (n || 0).toString(16).substr(-4).toUpperCase();
    return pskl.utils.StringUtils.leftPad(hex, 2, '0');
  };

  var rgbToHex = function(rgb) {
    return "#" + rgb.map(dec2Hex).join("");
  };

  var fixedPalette = {
      "id": "fixed-pallete",
      "name": "Fixed Palette",
      "colors": [
          [0,   0,   0],
          [255, 255, 255],
          [161, 173, 171],
          [66,  69,  76],
          [241, 106,  40],
          [255, 238,  74],
          [35,  72,  28],
          [61, 157,  49],
          [31, 163, 211],
          [20,  32, 150],
          [81,  27, 123],
          [190,  25, 101],
          [235, 160, 191],
          [249,  33,  52],
          [253, 201, 141],
          [101,  56,   0],
      ].map(rgbToHex)
  };

  var palettes = [fixedPalette].map(function (palette) {
    return pskl.model.Palette.fromObject(palette);
  });

  ns.PaletteService = function () {
    this.dynamicPalettes = [];
    // Exposed for tests.
    this.localStorageGlobal = window.localStorage;
  };

  ns.PaletteService.prototype.getPalettes = function () {
      return palettes;
  };

  ns.PaletteService.prototype.getPaletteById = function (paletteId) {
    return palettes[0];
  };

  ns.PaletteService.prototype.savePalette = function (palette) {
    var palettes = this.getPalettes();
    var existingPalette = this.findPaletteInArray_(palette.id, palettes);
    if (existingPalette) {
      var currentIndex = palettes.indexOf(existingPalette);
      palettes.splice(currentIndex, 1, palette);
    } else {
      palettes.push(palette);
    }

    this.savePalettes_(palettes);

    $.publish(Events.SHOW_NOTIFICATION, [{'content': 'Palette ' + palette.name + ' successfully saved !'}]);
    window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 2000);
  };

  ns.PaletteService.prototype.addDynamicPalette = function (palette) {
    this.dynamicPalettes.push(palette);
  };

  ns.PaletteService.prototype.deletePaletteById = function (id) {
    var palettes = this.getPalettes();
    var filteredPalettes = palettes.filter(function (palette) {
      return palette.id !== id;
    });

    this.savePalettes_(filteredPalettes);
  };

  ns.PaletteService.prototype.savePalettes_ = function (palettes) {
    palettes = palettes.filter(function (palette) {
      return this.dynamicPalettes.indexOf(palette) === -1;
    }.bind(this));
    this.localStorageGlobal.setItem('piskel.palettes', JSON.stringify(palettes));
    $.publish(Events.PALETTE_LIST_UPDATED);
  };

  ns.PaletteService.prototype.findPaletteInArray_ = function (paletteId, palettes) {
    var match = null;

    palettes.forEach(function (palette) {
      if (palette.id === paletteId) {
        match = palette;
      }
    });

    return match;
  };
})();
