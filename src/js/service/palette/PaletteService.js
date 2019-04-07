(function () {
  var ns = $.namespace('pskl.service.palette');

  var dec2Hex = function(n) {
    var hex = (n || 0).toString(16).substr(-4).toUpperCase();
    return pskl.utils.StringUtils.leftPad(hex, 2, '0');
  };

  var rgbToHex = function(rgb) {
    return '#' + rgb.map(dec2Hex).join('');
  };

  var colors = [
      {name: 'black', value: [0,   0,   0]},
      {name: 'white', value: [255, 255, 255]},
      {name: 'silver', value: [161, 173, 171]},
      {name: 'gray', value: [66,  69,  76]},
      {name: 'orange', value: [241, 106,  40]},
      {name: 'yellow', value: [255, 238,  74]},
      {name: 'dark green', value: [35,  72,  28]},
      {name: 'green', value: [61, 157,  49]},
      {name: 'light blue', value: [31, 163, 211]},
      {name: 'blue', value: [20,  32, 150]},
      {name: 'violet', value: [81,  27, 123]},
      {name: 'purple', value: [190,  25, 101]},
      {name: 'pink', value: [235, 160, 191]},
      {name: 'red orange', value: [249,  33,  52]},
      {name: 'flesh', value: [253, 201, 141]},
      {name: 'brown', value: [101,  56,   0]},
  ];
  var colorSet = new Set();
  for (var k in colors) {
    colors[k].value = rgbToHex(colors[k].value);
    colorSet.add(colors[k].value);
  }

  var fixedPalette = {
    'id': 'fixed-pallete',
    'name': 'Fixed Palette',
    'colors': colors.map(function(color) {
      return color.value;
    }),
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

  ns.PaletteService.prototype.getFixedNamedColors = function () {
    return colors;
  };

  ns.PaletteService.prototype.getColorSet = function () {
    return colorSet;
  };

  ns.PaletteService.prototype.getColors = function () {
    return colors.map(function(color) {
      return color.value;
    });
  };

  ns.PaletteService.prototype.getColorIndexMap = function () {
    var colorValues = colors.map(function(color) {
      return color.value;
    });
    var colorMap = {};
    for (var i = 0; i < colorValues.length; i++) {
      var color = colorValues[i];
      if (color != Constants.TRANSPARENT_COLOR) {
        colorMap[pskl.utils.colorToInt(color)] = i;
      }
    }
    return colorMap;
  };

  ns.PaletteService.prototype.getClosestColor = function (color) {
    if (colorSet.has(color)) {
      return color;
    }
      // strip alpha values
    var m = color.match(/#\w{6}/);
    if (!m) {
      return '#000000';
    }
    color = m[0];
    if (colorSet.has(color)) {
      return color;
    }
    var color_ = color;
    var minDist = Infinity;
    var ColorUtils = pskl.utils.ColorUtils;
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i].value;
      var dist = ColorUtils.colorDistance(color, c);
      if (dist < minDist) {
        color_ = c;
        minDist = dist;
      }
    }
    return color_;
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
