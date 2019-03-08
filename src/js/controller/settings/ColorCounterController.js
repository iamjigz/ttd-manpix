(function () {
  var ns = $.namespace('pskl.controller.settings');

  ns.ColorCounterController = function (piskelController) {
    this.piskelController = piskelController;
    this.contents = document.querySelector('.settings-section-color-counter .contents');
  };

  pskl.utils.inherit(ns.ColorCounterController, pskl.controller.settings.AbstractSettingController);

  ns.ColorCounterController.prototype.init = function () {
    this.update();
  };

  ns.ColorCounterController.prototype.getCounter = function () {
    var counter = {};
    var frame = this.piskelController.getCurrentFrame();
    for (var i = 0; i < frame.pixels.length; i++) {
      var color = pskl.utils.ColorUtils.rgbToHex(pskl.utils.intToColor(frame.pixels[i]));
      if (counter[color] == null) {
        counter[color] = 0;
      }
      counter[color]++;
    }
    return counter;
  };

  ns.ColorCounterController.prototype.update = function () {
    var colorCounter = this.getCounter();
    var colors = pskl.app.paletteService.getFixedNamedColors();

    var counts = [];
    for (var i = 0; i < colors.length; i++) {
      var color = colors[i];
      var count = colorCounter[color.value] || 0;
      if (count > 0) {
        counts.push({
          name: color.name,
          value: color.value,
          count: count,
        });
      }
    }
    counts.sort(function(a, b) { return b.count - a.count; });

    var html = '';
    counts.forEach(function(color) {
      html += '<div class=\'color-entry\'>' +
              '<span class=\'color-block\' style=\'background-color: ' + color.value + '\'></span> ' +
              '<span class=\'color-name\'>' + color.name + '</span>' +
              '<span class=\'color-count\'>' + color.count + '</span>' +
              '</div>';
    });

    this.contents.innerHTML = html.length > 0 ? html : '<span class=\'msg\'>(Empty canvas)</span>';
  };

})();
