(function() {
  var ns = $.namespace('pskl.controller.settings');

  function applyI18n() {
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .browse-local.settings-title'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .open-piskel.settings-title'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .import-pic.settings-title'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .recover.settings-title'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .browse-local-button'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .open-piskel-button'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .file-input-button'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .browse-backups-button'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .browse-local > .info-text'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .open-piskel > .info-text'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .import-pic > .info-text'
    );
    pskl.utils.applyI18nDOM(
      '.settings-section.settings-section-import .recover > .info-text'
    );
  }

  ns.ImportController = function(piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(
    ns.ImportController,
    pskl.controller.settings.AbstractSettingController
  );

  ns.ImportController.prototype.init = function() {
    this.hiddenFileInput = document.querySelector('[name="file-upload-input"]');
    this.addEventListener(
      this.hiddenFileInput,
      'change',
      this.onFileUploadChange_
    );

    this.hiddenOpenPiskelInput = document.querySelector(
      '[name="open-piskel-input"]'
    );

    this.addEventListener(
      '.browse-local-button',
      'click',
      this.onBrowseLocalClick_
    );
    this.addEventListener(
      '.browse-backups-button',
      'click',
      this.onBrowseBackupsClick_
    );
    this.addEventListener(
      '.file-input-button',
      'click',
      this.onFileInputClick_
    );

    // different handlers, depending on the Environment
    if (pskl.utils.Environment.detectNodeWebkit()) {
      this.addEventListener(
        '.open-piskel-button',
        'click',
        this.openPiskelDesktop_
      );
    } else {
      this.addEventListener(
        this.hiddenOpenPiskelInput,
        'change',
        this.onOpenPiskelChange_
      );
      this.addEventListener(
        '.open-piskel-button',
        'click',
        this.onOpenPiskelClick_
      );
    }

    applyI18n();
  };

  ns.ImportController.prototype.closeDrawer_ = function() {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };
  ns.ImportController.prototype.onFileUploadChange_ = function(evt) {
    this.importPictureFromFile_();
  };

  ns.ImportController.prototype.onFileInputClick_ = function(evt) {
    this.hiddenFileInput.click();
  };

  ns.ImportController.prototype.onOpenPiskelChange_ = function(evt) {
    var files = this.hiddenOpenPiskelInput.files;
    if (files.length == 1) {
      this.openPiskelFile_(files[0]);
    }
  };

  ns.ImportController.prototype.openPiskelDesktop_ = function(evt) {
    this.closeDrawer_();
    pskl.app.desktopStorageService.openPiskel();
  };

  ns.ImportController.prototype.onOpenPiskelClick_ = function(evt) {
    this.hiddenOpenPiskelInput.click();
  };

  ns.ImportController.prototype.onBrowseLocalClick_ = function(evt) {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: 'browse-local'
    });
    this.closeDrawer_();
  };

  ns.ImportController.prototype.onBrowseBackupsClick_ = function(evt) {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: 'browse-backups'
    });
    this.closeDrawer_();
  };

  ns.ImportController.prototype.openPiskelFile_ = function(file) {
    if (this.isPiskel_(file)) {
      $.publish(Events.DIALOG_SHOW, {
        dialogId: 'import',
        initArgs: {
          rawFiles: [file]
        }
      });
      this.closeDrawer_();
    } else {
      this.closeDrawer_();
      console.error('The selected file is not a piskel file');
    }
  };

  ns.ImportController.prototype.importPictureFromFile_ = function() {
    var files = this.hiddenFileInput.files;
    // TODO : Simply filter and remove stuff
    var areImages = Array.prototype.every.call(files, function(file) {
      return file.type.indexOf('image') === 0;
    });
    if (areImages) {
      $.publish(Events.DIALOG_SHOW, {
        dialogId: 'import',
        initArgs: {
          rawFiles: files
        }
      });
      this.closeDrawer_();
    } else {
      this.closeDrawer_();
      console.error('Some files are not images');
    }
  };

  ns.ImportController.prototype.isPiskel_ = function(file) {
    return /\.piskel$/.test(file.name);
  };

  ns.ImportController.prototype.onRestorePreviousSessionClick_ = function() {
    if (window.confirm('This will erase your current workspace. Continue ?')) {
      pskl.app.backupService.load();
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
    }
  };
})();
