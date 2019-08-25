(function() {
  var ns = $.namespace('pskl.tools.transform');

  ns.Rotate = function() {
    this.toolId = 'tool-rotate';
    this.helpText = pskl.app.i18n('Counter-clockwise rotation');
    this.tooltipDescriptors = [
      { key: 'alt', description: pskl.app.i18n('Clockwise rotation') },
      { key: 'ctrl', description: pskl.app.i18n('Apply to all layers') },
      { key: 'shift', description: pskl.app.i18n('Apply to all frames') }
    ];
  };

  pskl.utils.inherit(ns.Rotate, ns.AbstractTransformTool);

  ns.Rotate.prototype.applyToolOnFrame_ = function(frame, altKey) {
    var direction;

    if (altKey) {
      direction = ns.TransformUtils.CLOCKWISE;
    } else {
      direction = ns.TransformUtils.COUNTERCLOCKWISE;
    }

    ns.TransformUtils.rotate(frame, direction);
  };
})();
