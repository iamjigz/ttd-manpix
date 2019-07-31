(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.PopupController = function () {};

  pskl.utils.inherit(ns.PopupController, ns.AbstractDialogController);

  ns.PopupController.prototype.init = function (args) {
    this.superclass.init.call(this);

    var node = args.node;

    this._container = document.getElementById('popupContainer');
    this._container.innerHTML = '';
    this._container.appendChild(node);

    this._containerClass = args.containerClass;
    this._container.parentNode.classList.add(this._containerClass);
  };

  ns.PopupController.prototype.destroy = function () {
    this._container.parentNode.classList.remove(this._containerClass);
    this.superclass.destroy.call(this);
  };

})();
