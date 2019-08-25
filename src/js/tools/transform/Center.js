(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Center = function () {
    this.toolId = 'tool-center';
    this.helpText = pskl.app.i18n('Align image to the center');
    this.tooltipDescriptors = [
      {key : 'ctrl', description : pskl.app.i18n('Apply to all layers')},
      {key : 'shift', description : pskl.app.i18n('Apply to all frames')}
    ];
  };

  pskl.utils.inherit(ns.Center, ns.AbstractTransformTool);

  ns.Center.prototype.applyToolOnFrame_ = function (frame) {
    ns.TransformUtils.center(frame);
  };

})();
