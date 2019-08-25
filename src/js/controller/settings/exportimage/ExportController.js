(function() {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var tabs = {
    png: {
      template: 'templates/settings/export/png.html',
      controller: ns.PngExportController
    },
    pdf: {
      template: 'templates/settings/export/pdf.html',
      controller: ns.PdfExportController
    },
    gif: {
      template: 'templates/settings/export/gif.html',
      controller: ns.GifExportController
    },
    zip: {
      template: 'templates/settings/export/zip.html',
      controller: ns.ZipExportController
    },
    misc: {
      template: 'templates/settings/export/misc.html',
      controller: ns.MiscExportController
    }
  };

  function applyI18n() {
    document.querySelector(
      '.settings-section-export .settings-title'
    ).textContent = pskl.app.i18n('Export');
  }

  ns.ExportController = function(piskelController) {
    this.piskelController = piskelController;
    this.tabsWidget = new pskl.widgets.Tabs(
      tabs,
      this,
      pskl.UserSettings.EXPORT_TAB
    );
    applyI18n();
  };

  pskl.utils.inherit(
    ns.ExportController,
    pskl.controller.settings.AbstractSettingController
  );

  ns.ExportController.prototype.init = function() {
    // Initialize tabs and panel
    var container = document.querySelector('.settings-section-export');
    this.tabsWidget.init(container);
  };

  ns.ExportController.prototype.destroy = function() {
    this.tabsWidget.destroy();
    this.superclass.destroy.call(this);
  };
})();
