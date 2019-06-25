(function() {
  var ns = $.namespace('pskl.controller');

  /**
   * When embedded in piskelapp.com, the page adds a header containing the name of the currently edited sprite
   * This controller will keep the displayed name in sync with the actual piskel name
   */
  ns.HeaderController = function(piskelController, savedStatusService) {
    this.piskelController = piskelController;
    this.savedStatusService = savedStatusService;
  };

  ns.HeaderController.prototype.init = function() {
    this.user = null;
    this.showPopup = false;
    this.piskelName_ = document.querySelector('.piskel-name');
    this.signinContainer = document.querySelector('.signin-popup');
    this.userButton = document.querySelector('.user-button');

    this.createSpriteButton = document.querySelector('.create-sprite-button');
    this.signoutButton = document.querySelector('.signout-button');
    this.toggleSigninButton = document.querySelector('.toggle-signin-button');
    this.usernameInput = document.querySelector('.signin-popup input#username');
    this.passwordInput = document.querySelector('.signin-popup input#password');
    this.password2Input = document.querySelector(
      '.signin-popup input#password2'
    );

    this.signinButton = document.querySelector('.signin-popup .action-button');
    this.actionName = document.querySelector('.signin-popup .action-name');
    this.formError = document.querySelector('.signin-popup .error');
    this.otherAction = document.querySelector('.signin-popup .other-action');

    this.createSpriteButton.href =
      location.origin + location.pathname + location.search;

    this.updateSigninContainer_();

    pskl.utils.Event.addEventListener(
      this.signoutButton,
      'click',
      this.onSignout,
      this
    );
    pskl.utils.Event.addEventListener(
      this.toggleSigninButton,
      'click',
      this.onToggleSignin,
      this
    );
    pskl.utils.Event.addEventListener(
      this.otherAction,
      'click',
      this.onChangeAction,
      this
    );
    pskl.utils.Event.addEventListener(
      this.signinButton,
      'click',
      this.onSignin,
      this
    );
    pskl.utils.Event.addEventListener(
      this.createSpriteButton,
      'click',
      this.onCreateSprite,
      this
    );

    $.subscribe(
      Events.BEFORE_SAVING_PISKEL,
      this.onBeforeSavingPiskelEvent_.bind(this)
    );
    $.subscribe(
      Events.AFTER_SAVING_PISKEL,
      this.onAfterSavingPiskelEvent_.bind(this)
    );

    $.subscribe(
      Events.PISKEL_DESCRIPTOR_UPDATED,
      this.updateHeader_.bind(this)
    );
    $.subscribe(Events.PISKEL_RESET, this.updateHeader_.bind(this));
    $.subscribe(
      Events.PISKEL_SAVED_STATUS_UPDATE,
      this.updateHeader_.bind(this)
    );

    $.subscribe(Events.SERVER_CONNECT, this.onServerConnect.bind(this));
  };

  ns.HeaderController.prototype.updateSigninContainer_ = function() {
    if (this.user) {
      this.userButton.textContent = this.user.username;
      this.userButton.href = '/todo';
      this.userButton.classList.remove('hidden');
      this.toggleSigninButton.classList.add('hidden');
      this.signoutButton.classList.remove('hidden');
    } else {
      this.userButton.classList.add('hidden');
      this.toggleSigninButton.classList.remove('hidden');
      this.signoutButton.classList.add('hidden');
    }
  };

  ns.HeaderController.prototype.updateHeader_ = function() {
    try {
      var name = this.piskelController.getPiskel().getDescriptor().name;
      if (this.savedStatusService.isDirty()) {
        name = name + ' foo*';
      }

      if (this.piskelName_) {
        this.piskelName_.textContent = name;
      }
    } catch (e) {
      console.warn('Could not update header : ' + e.message);
    }
  };

  ns.HeaderController.prototype.onBeforeSavingPiskelEvent_ = function() {
    if (!this.piskelName_) {
      return;
    }
    this.piskelName_.classList.add('piskel-name-saving');
  };

  ns.HeaderController.prototype.onAfterSavingPiskelEvent_ = function() {
    if (!this.piskelName_) {
      return;
    }
    this.piskelName_.classList.remove('piskel-name-saving');
  };

  ns.HeaderController.prototype.togglePopup_ = function(val) {
    this.showPopup = val != null ? !!val : !this.showPopup;
    if (this.showPopup) {
      this.signinContainer.classList.remove('hidden');
    } else {
      this.signinContainer.classList.add('hidden');
    }
  };

  ns.HeaderController.prototype.onServerConnect = function(e, user) {
    this.user = !user || user.error ? null : user;
    this.updateHeader_();
    this.updateSigninContainer_();
  };

  ns.HeaderController.prototype.onToggleSignin = function(e) {
    e.preventDefault();
    this.togglePopup_();
  };

  ns.HeaderController.prototype.onChangeAction = function() {
    if (this.actionName.textContent == 'login') {
      this.actionName.textContent = 'register';
      this.password2Input.classList.remove('hidden');
      this.otherAction.textContent = 'login';
    } else {
      this.actionName.textContent = 'login';
      this.password2Input.classList.add('hidden');
      this.otherAction.textContent = 'register';
    }
  };

  ns.HeaderController.prototype.onSignout = function(e) {
    e.preventDefault();
    var self = this;
    window.Api.logout().then(function() {
      self.user = null;
      self.updateHeader_();
      self.updateSigninContainer_();
      pskl.app.currentUser = null;
      location.hash = '';
    });
  };

  ns.HeaderController.prototype.clearInput = function(e) {
    this.usernameInput.value = '';
    this.passwordInput.value = '';
    this.password2Input.value = '';
  };

  ns.HeaderController.prototype.onCreateSprite = function(e) {};

  ns.HeaderController.prototype.onSignin = function(e) {
    e.preventDefault();
    var api = window.Api;
    this.formError.textContent = '';
    this.togglePopup_(true);

    var self = this;
    if (self.usernameInput.value.trim() == '') {
      self.formError.textContent = 'username is required';
      return;
    } else if (self.passwordInput.value.trim() == '') {
      self.formError.textContent = 'password is required';
      return;
    }
    if (self.actionName.textContent == 'login') {
      var p = !pskl.app.onLogin ?
        api.login(
            self.usernameInput.value.trim(),
            self.passwordInput.value.trim()
          ) :
        new Promise(function(resolve, reject) {
          pskl.app.onLogin(
              self.usernameInput.value.trim(),
              self.passwordInput.value.trim(),
              function(resp) {
                resolve({ data: resp });
              }
            );
        });
    } else {
      if (self.passwordInput.value.trim() != self.password2Input.value.trim()) {
        self.formError.textContent = 'password does not match';
        return;
      }
      var p = !pskl.app.onRegister ?
        api.register(
            self.usernameInput.value.trim(),
            self.passwordInput.value.trim()
          ) :
        new Promise(function(resolve, reject) {
          pskl.app.onRegister(
              self.usernameInput.value.trim(),
              self.passwordInput.value.trim(),
              function(resp) {
                resolve({ data: resp });
              }
            );
        });
    }
    p.then(function(resp) {
      var data = resp.data;
      if (data.error) {
        self.formError.textContent = data.error;
        return;
      }
      self.user = data;
      self.updateSigninContainer_();
      self.togglePopup_();
      self.clearInput();
      pskl.app.currentUser = data;
    });
  };
})();
