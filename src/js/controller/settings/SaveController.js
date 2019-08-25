(function() {
  var ns = $.namespace('pskl.controller.settings');

  var PARTIALS = {
    DESKTOP: 'save-desktop-partial',
    GALLERY: 'save-gallery-partial',
    GALLERY_UNAVAILABLE: 'save-gallery-unavailable-partial',
    LOCALSTORAGE: 'save-localstorage-partial',
    FILEDOWNLOAD: 'save-file-download-partial'
  };

  function applyI18n() {
    document.querySelector(
      '.save-form .settings-title'
    ).textContent = pskl.app.i18n('Sprite Information');
    document.querySelector(
      '.save-form .settings-form-section-title > label'
    ).textContent = pskl.app.i18n('Title') + ' : ';
    document.querySelector(
      '.save-form .settings-form-section-desc > label'
    ).textContent = pskl.app.i18n('Description') + ' : ';
    document.querySelector(
      '.save-form .save-public-section > label > span'
    ).textContent = pskl.app.i18n('Public') + ' : ';

    document.querySelector(
      '.save-localstorage.settings-title'
    ).textContent = pskl.app.i18n('Save offline in Browser');
    document.querySelector(
      '.save-localstorage.save-status'
    ).textContent = pskl.app.i18n(
      'Your piskel will be saved locally and will only be accessible from this browser.'
    );

    try {
      document.querySelector(
        '.save-file.settings-title'
      ).textContent = pskl.app.i18n('Save offline as File');
      document.querySelector(
        '.save-file.save-status'
      ).textContent = pskl.app.i18n(
        'Your sprite will be downloaded as a .piskel file.'
      );
    } catch (e) {
      console.log(e);
    }

    try {
      document.querySelector(
        '.save-online.settings-title'
      ).textContent = pskl.app.i18n('Save online');
      document.querySelector(
        '.save-online.save-status'
      ).textContent = pskl.app.i18n(
        'Your piskel will be stored online in your gallery.'
      );
    } catch (e) {
      console.log(e);
    }

    try {
      document.querySelector(
        '.save-desktop.settings-title'
      ).textContent = pskl.app.i18n('Save as File');
      document.querySelector(
        '.save-desktop.save-status'
      ).textContent = pskl.app.i18n(
        'Your sprite will be saved as a .piskel file.'
      );
    } catch (e) {
      console.log(e);
    }
  }

  ns.SaveController = function(piskelController) {
    this.piskelController = piskelController;
  };

  pskl.utils.inherit(
    ns.SaveController,
    pskl.controller.settings.AbstractSettingController
  );

  /**
   * @public
   */
  ns.SaveController.prototype.init = function() {
    this.saveForm = document.querySelector('.save-form');
    this.insertSavePartials_();

    this.piskelName = document.querySelector('.piskel-name');
    this.descriptionInput = document.querySelector('#save-description');
    this.nameInput = document.querySelector('#save-name');
    this.isPublicCheckbox = document.querySelector(
      'input[name=save-public-checkbox]'
    );
    this.updateDescriptorInputs_();

    this.saveLocalStorageButton = document.querySelector(
      '#save-localstorage-button'
    );
    this.saveGalleryButton = document.querySelector('#save-gallery-button');
    this.saveDesktopButton = document.querySelector('#save-desktop-button');
    this.saveDesktopAsNewButton = document.querySelector(
      '#save-desktop-as-new-button'
    );
    this.saveFileDownloadButton = document.querySelector(
      '#save-file-download-button'
    );
    this.showLoginButton = document.querySelector('#show-login-dialog-button');

    this.safeAddEventListener_(
      this.saveLocalStorageButton,
      'click',
      this.saveToIndexedDb_
    );
    this.safeAddEventListener_(
      this.saveGalleryButton,
      'click',
      this.saveToGallery_
    );
    this.safeAddEventListener_(
      this.saveDesktopButton,
      'click',
      this.saveToDesktop_
    );
    this.safeAddEventListener_(
      this.saveDesktopAsNewButton,
      'click',
      this.saveToDesktopAsNew_
    );
    this.safeAddEventListener_(
      this.saveFileDownloadButton,
      'click',
      this.saveToFileDownload_
    );

    if (this.showLoginButton && pskl.app.onShowLoginDialog) {
      this.safeAddEventListener_(
        this.showLoginButton,
        'click',
        this.showLoginDialog_
      );
    }

    this.addEventListener(this.saveForm, 'submit', this.onSaveFormSubmit_);

    if (pskl.app.storageService.isSaving()) {
      this.disableSaveButtons_();
    }

    this.updateSaveToGalleryMessage_();

    $.subscribe(
      Events.BEFORE_SAVING_PISKEL,
      this.disableSaveButtons_.bind(this)
    );
    $.subscribe(Events.AFTER_SAVING_PISKEL, this.enableSaveButtons_.bind(this));

    applyI18n();
  };

  ns.SaveController.prototype.updateSaveToGalleryMessage_ = function(
    spritesheetSize
  ) {
    var saveToGalleryStatus = document.querySelector('.save-online-status');
    if (saveToGalleryStatus && pskl.app.performanceReportService.hasProblem()) {
      var warningPartial = pskl.utils.Template.get(
        'save-gallery-warning-partial'
      );
      saveToGalleryStatus.innerHTML = warningPartial;
    }
  };

  ns.SaveController.prototype.insertSavePartials_ = function() {
    this.getPartials_().forEach(
      function(partial) {
        this.saveForm.insertAdjacentHTML(
          'beforeend',
          pskl.utils.Template.get(partial)
        );
      }.bind(this)
    );
  };

  ns.SaveController.prototype.getPartials_ = function() {
    if (pskl.utils.Environment.detectNodeWebkit()) {
      return [
        PARTIALS.DESKTOP,
        PARTIALS.LOCALSTORAGE,
        PARTIALS.GALLERY_UNAVAILABLE
      ];
    }

    if (pskl.app.isLoggedIn()) {
      return [PARTIALS.GALLERY, PARTIALS.LOCALSTORAGE, PARTIALS.FILEDOWNLOAD];
    }

    return [
      PARTIALS.FILEDOWNLOAD,
      PARTIALS.LOCALSTORAGE,
      PARTIALS.GALLERY_UNAVAILABLE
    ];
  };

  ns.SaveController.prototype.updateDescriptorInputs_ = function(evt) {
    var descriptor = this.piskelController.getPiskel().getDescriptor();
    this.descriptionInput.value = descriptor.description;
    this.nameInput.value = descriptor.name;
    if (descriptor.isPublic) {
      this.isPublicCheckbox.setAttribute('checked', true);
    }

    if (!pskl.app.isLoggedIn()) {
      var isPublicCheckboxContainer = document.querySelector(
        '.save-public-section'
      );
      isPublicCheckboxContainer.style.display = 'none';
    }
  };

  ns.SaveController.prototype.onSaveFormSubmit_ = function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (pskl.app.isLoggedIn()) {
      this.saveToGallery_();
    } else {
      this.saveToIndexedDb_();
    }
  };

  ns.SaveController.prototype.saveToFileDownload_ = function() {
    this.saveTo_('saveToFileDownload', false);
  };

  ns.SaveController.prototype.saveToGallery_ = function() {
    this.saveTo_('saveToGallery', false);
  };

  ns.SaveController.prototype.saveToIndexedDb_ = function() {
    this.saveTo_('saveToIndexedDb', false);
  };

  ns.SaveController.prototype.saveToDesktop_ = function() {
    this.saveTo_('saveToDesktop', false);
  };

  ns.SaveController.prototype.saveToDesktopAsNew_ = function() {
    this.saveTo_('saveToDesktop', true);
  };

  ns.SaveController.prototype.saveTo_ = function(methodName, saveAsNew) {
    var piskel = this.piskelController.getPiskel();
    piskel.setDescriptor(this.getDescriptor_());
    pskl.app.storageService[methodName](piskel, !!saveAsNew).then(
      this.onSaveSuccess_
    );
  };

  ns.SaveController.prototype.getDescriptor_ = function() {
    var name = this.nameInput.value;
    var description = this.descriptionInput.value;
    return new pskl.model.piskel.Descriptor(
      name,
      description,
      this.isPublic_()
    );
  };

  ns.SaveController.prototype.isPublic_ = function() {
    if (!this.isPublicCheckbox) {
      return true;
    }

    return !!this.isPublicCheckbox.checked;
  };

  ns.SaveController.prototype.onSaveSuccess_ = function() {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.SaveController.prototype.disableSaveButtons_ = function() {
    this.setDisabled_(this.saveLocalStorageButton, true);
    this.setDisabled_(this.saveGalleryButton, true);
    this.setDisabled_(this.saveDesktopButton, true);
    this.setDisabled_(this.saveDesktopAsNewButton, true);
    this.setDisabled_(this.saveFileDownloadButton, true);
  };

  ns.SaveController.prototype.enableSaveButtons_ = function() {
    this.setDisabled_(this.saveLocalStorageButton, false);
    this.setDisabled_(this.saveGalleryButton, false);
    this.setDisabled_(this.saveDesktopButton, false);
    this.setDisabled_(this.saveDesktopAsNewButton, false);
    this.setDisabled_(this.saveFileDownloadButton, false);
  };

  ns.SaveController.prototype.setDisabled_ = function(element, isDisabled) {
    if (!element) {
      return;
    }

    if (isDisabled) {
      element.setAttribute('disabled', 'disabled');
    } else {
      element.removeAttribute('disabled');
    }
  };

  ns.SaveController.prototype.safeAddEventListener_ = function(
    element,
    type,
    callback
  ) {
    if (element) {
      this.addEventListener(element, type, callback);
    }
  };

  ns.SaveController.prototype.showLoginDialog_ = function() {
    var handler = pskl.app.onShowLoginDialog;
    if (handler) {
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
      handler();
    } else {
      alert('just kidding');
    }
  };
})();
