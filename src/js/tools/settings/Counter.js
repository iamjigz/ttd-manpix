(function () {
  var ns_ = $.namespace('pskl.tools.transform');
  var ns = $.namespace('pskl.tools.settings');

  ns.Counter = function () {
    this.toolId = 'settings-counter-white';
    this.helpText = 'Show color counter';
    this.isSettings = true;
    this.tooltipDescriptors = [
    ];
  };

  pskl.utils.inherit(ns.Counter, ns_.AbstractTransformTool);

  ns.Counter.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var pskl = $.namespace('pskl');
    var settings = pskl.app.settingsController;
    if (settings) {
      settings.loadSetting_('color-counter');
    }
  };

})();
