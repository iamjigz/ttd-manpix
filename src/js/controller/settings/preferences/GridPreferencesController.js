(function () {
  var ns = $.namespace('pskl.controller.settings.preferences');

  var colorsMap = {
    'transparent': Constants.TRANSPARENT_COLOR,
    'white': '#FFF1E8',
    'light-gray': '#C2C3C7',
    'dark-gray': '#5F574F',
    'black': '#000000',
    'blue': '#29ADFF',
    'dark-blue': '#1D2B53',
    'green': '#00E436',
    'dark-green': '#008751',
    'peach': '#FFCCAA',
    'pink': '#FF77A8',
    'yellow': '#FFEC27',
    'orange': '#FFA300',
    'red': '#FF004D',
  };

  ns.GridPreferencesController = function (piskelController, preferencesController) {
    this.piskelController = piskelController;
    this.preferencesController = preferencesController;
    this.sizePicker = new pskl.widgets.SizePicker(this.onSizePickerChanged_.bind(this));
    this.spacingPicker = new pskl.widgets.SizePicker(this.onSpacingPickerChanged_.bind(this));
  };

  pskl.utils.inherit(ns.GridPreferencesController, pskl.controller.settings.AbstractSettingController);

  ns.GridPreferencesController.prototype.init = function () {
    this.backgroundContainer = document.querySelector('.background-picker-wrapper');
    this.addEventListener(this.backgroundContainer, 'click', this.onBackgroundClick_);

    var background = pskl.UserSettings.get(pskl.UserSettings.CANVAS_BACKGROUND);
    var selectedBackground = this.backgroundContainer.querySelector('[data-background=' + background + ']');
    if (selectedBackground) {
      selectedBackground.classList.add('selected');
    }

    // Grid enabled
    var isEnabled = pskl.UserSettings.get(pskl.UserSettings.GRID_ENABLED);
    var enableGridCheckbox = document.querySelector('.enable-grid-checkbox');
    if (isEnabled) {
      enableGridCheckbox.setAttribute('checked', 'true');
    }
    this.addEventListener(enableGridCheckbox, 'change', this.onEnableGridChange_);

    // Grid size
    var gridWidth = pskl.UserSettings.get(pskl.UserSettings.GRID_WIDTH);
    this.sizePicker.init(document.querySelector('.grid-size-container'));
    this.sizePicker.setSize(gridWidth);

    //Grid Spacing
    var gridSpacing = pskl.UserSettings.get(pskl.UserSettings.GRID_SPACING);
    this.spacingPicker.init(document.querySelector('.grid-spacing-container'));
    this.spacingPicker.setSize(gridSpacing);

    // Grid color
    var colorListItemTemplate = pskl.utils.Template.get('color-list-item-template');

    var gridColor = pskl.UserSettings.get(pskl.UserSettings.GRID_COLOR);
    var gridColorSelect = document.querySelector('#grid-color');

    var markup = '';
    Object.keys(colorsMap).forEach(function (key, index) {
      var background = colorsMap[key];
      if (key === 'transparent') {
        background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZ' +
            'F8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==)';
      }
      markup += pskl.utils.Template.replace(colorListItemTemplate, {
        color: colorsMap[key],
        title: key,
        background: background,
        ':selected': gridColor === colorsMap[key]
      });
    });
    this.gridColorList = document.querySelector('.grid-colors-list');
    this.gridColorList.innerHTML = markup;

    this.addEventListener(this.gridColorList, 'click', this.onGridColorClicked_.bind(this));
  };

  ns.GridPreferencesController.prototype.onBackgroundClick_ = function (evt) {
    var target = evt.target;
    var background = target.dataset.background;
    if (background) {
      pskl.UserSettings.set(pskl.UserSettings.CANVAS_BACKGROUND, background);
      var selected = this.backgroundContainer.querySelector('.selected');
      if (selected) {
        selected.classList.remove('selected');
      }
      target.classList.add('selected');
    }
  };


  ns.GridPreferencesController.prototype.destroy = function () {
    this.sizePicker.destroy();
    this.spacingPicker.destroy();
    this.superclass.destroy.call(this);
  };

  ns.GridPreferencesController.prototype.onSizePickerChanged_ = function (size) {
    pskl.UserSettings.set(pskl.UserSettings.GRID_WIDTH, size);
  };

  ns.GridPreferencesController.prototype.onSpacingPickerChanged_ = function (size) {
    pskl.UserSettings.set(pskl.UserSettings.GRID_SPACING, size);
  };

  ns.GridPreferencesController.prototype.onEnableGridChange_ = function (evt) {
    pskl.UserSettings.set(pskl.UserSettings.GRID_ENABLED, evt.currentTarget.checked);
  };

  ns.GridPreferencesController.prototype.onGridColorClicked_ = function (evt) {
    var color = evt.target.dataset.color;
    if (color) {
      pskl.UserSettings.set(pskl.UserSettings.GRID_COLOR, color);
      this.gridColorList.querySelector('.selected').classList.remove('selected');
      evt.target.classList.add('selected');
    }
  };
})();
