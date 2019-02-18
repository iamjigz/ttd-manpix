(function () {
  var ns_ = $.namespace('pskl.tools.transform');
  var ns = $.namespace('pskl.tools.settings');

  ns.Resize = function () {
    this.toolId = 'settings-resize-white';
    this.helpText = 'Show resize settings';
    this.isSettings = true;
    this.tooltipDescriptors = [
    ];
  };

  pskl.utils.inherit(ns.Resize, ns_.AbstractTransformTool);

  ns.Resize.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var pskl = $.namespace('pskl');
    var settings = pskl.app.settingsController;
    if (settings) {
      settings.loadSetting_('resize');
    }
  };

})();
