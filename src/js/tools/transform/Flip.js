(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.Flip = function () {
    this.toolId = 'tool-flip';
    this.helpText = pskl.app.i18n('Flip vertically');
    this.tooltipDescriptors = [
      {key : 'alt', description : pskl.app.i18n('Flip horizontally')},
      {key : 'ctrl', description : pskl.app.i18n('Apply to all layers')},
      {key : 'shift', description : pskl.app.i18n('Apply to all frames')}
    ];
  };

  pskl.utils.inherit(ns.Flip, ns.AbstractTransformTool);

  ns.Flip.prototype.applyToolOnFrame_ = function (frame, altKey) {
    var axis;

    if (altKey) {
      axis = ns.TransformUtils.HORIZONTAL;
    } else {
      axis = ns.TransformUtils.VERTICAL;
    }

    ns.TransformUtils.flip(frame, axis);
  };

})();
