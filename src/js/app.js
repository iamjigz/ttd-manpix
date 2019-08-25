/**
 * @require Constants
 * @require Events
 */
(function() {
  var ns = $.namespace('pskl');
  /**
   * Main application controller
   */
  ns.app = {
    currentUser: null,

    init: function() {
      // Run preferences migration scripts for version v0.12.0
      pskl.UserSettings.migrate_to_v0_12();

      /**
       * When started from APP Engine, appEngineToken_ (Boolean) should be set on window.pskl
       */
      this.isAppEngineVersion = !!pskl.appEngineToken_;

      // This id is used to keep track of sessions in the BackupService.
      this.sessionId = pskl.utils.Uuid.generate();

      this.shortcutService = new pskl.service.keyboard.ShortcutService();
      this.shortcutService.init();

      var size = pskl.UserSettings.get(pskl.UserSettings.DEFAULT_SIZE);
      var fps = Constants.DEFAULT.FPS;
      var descriptor = new pskl.model.piskel.Descriptor('New Piskel', '');
      var piskel = new pskl.model.Piskel(
        size.width,
        size.height,
        fps,
        descriptor
      );

      var layer = new pskl.model.Layer('Layer 1');
      var frame = new pskl.model.Frame(size.width, size.height);

      layer.addFrame(frame);
      piskel.addLayer(layer);

      this.corePiskelController = new pskl.controller.piskel.PiskelController(
        piskel
      );
      this.corePiskelController.init();

      this.piskelController = new pskl.controller.piskel.PublicPiskelController(
        this.corePiskelController
      );
      this.piskelController.init();

      this.paletteImportService = new pskl.service.palette.PaletteImportService();
      this.paletteImportService.init();

      this.paletteService = new pskl.service.palette.PaletteService();
      this.paletteService.addDynamicPalette(
        new pskl.service.palette.CurrentColorsPalette()
      );

      this.selectedColorsService = new pskl.service.SelectedColorsService();
      this.selectedColorsService.init();

      this.mouseStateService = new pskl.service.MouseStateService();
      this.mouseStateService.init();

      this.paletteController = new pskl.controller.PaletteController();
      this.paletteController.init();

      this.currentColorsService = new pskl.service.CurrentColorsService(
        this.piskelController
      );
      this.currentColorsService.init();

      this.palettesListController = new pskl.controller.PalettesListController(
        this.currentColorsService
      );
      this.palettesListController.init();

      this.cursorCoordinatesController = new pskl.controller.CursorCoordinatesController(
        this.piskelController
      );
      this.cursorCoordinatesController.init();

      this.drawingController = new pskl.controller.DrawingController(
        this.piskelController,
        $('#drawing-canvas-container')
      );
      this.drawingController.init();

      //this.previewController = new pskl.controller.preview.PreviewController(
      //  this.piskelController,
      //  $('#animated-preview-canvas-container'));
      //this.previewController.init();

      //this.minimapController = new pskl.controller.MinimapController(
      //  this.piskelController,
      //  this.previewController,
      //  this.drawingController,
      //  $('.minimap-container'));
      //this.minimapController.init();

      //this.framesListController = new pskl.controller.FramesListController(
      //  this.piskelController,
      //  $('#preview-list-wrapper').get(0));
      //this.framesListController.init();

      //this.layersListController = new pskl.controller.LayersListController(this.piskelController);
      //this.layersListController.init();

      this.settingsController = new pskl.controller.settings.SettingsController(
        this.piskelController
      );
      this.settingsController.init();

      this.dialogsController = new pskl.controller.dialogs.DialogsController(
        this.piskelController
      );
      this.dialogsController.init();

      this.toolController = new pskl.controller.ToolController();
      this.toolController.init();

      this.selectionManager = new pskl.selection.SelectionManager(
        this.piskelController
      );
      this.selectionManager.init();

      this.historyService = new pskl.service.HistoryService(
        this.piskelController
      );
      this.historyService.init();

      this.notificationController = new pskl.controller.NotificationController();
      this.notificationController.init();

      this.transformationsController = new pskl.controller.TransformationsController();
      this.transformationsController.init();

      this.progressBarController = new pskl.controller.ProgressBarController();
      this.progressBarController.init();

      this.canvasBackgroundController = new pskl.controller.CanvasBackgroundController();
      this.canvasBackgroundController.init();

      this.indexedDbStorageService = new pskl.service.storage.IndexedDbStorageService(
        this.piskelController
      );
      this.indexedDbStorageService.init();

      this.localStorageService = new pskl.service.storage.LocalStorageService(
        this.piskelController
      );
      this.localStorageService.init();

      this.fileDownloadStorageService = new pskl.service.storage.FileDownloadStorageService(
        this.piskelController
      );
      this.fileDownloadStorageService.init();

      this.desktopStorageService = new pskl.service.storage.DesktopStorageService(
        this.piskelController
      );
      this.desktopStorageService.init();

      this.galleryStorageService = new pskl.service.storage.GalleryStorageService(
        this.piskelController
      );
      this.galleryStorageService.init();

      this.storageService = new pskl.service.storage.StorageService(
        this.piskelController
      );
      this.storageService.init();

      this.importService = new pskl.service.ImportService(
        this.piskelController
      );
      this.importService.init();

      this.imageUploadService = new pskl.service.ImageUploadService();
      this.imageUploadService.init();

      this.savedStatusService = new pskl.service.SavedStatusService(
        this.piskelController,
        this.historyService
      );
      this.savedStatusService.init();

      this.backupService = new pskl.service.BackupService(
        this.piskelController
      );
      this.backupService.init();

      this.beforeUnloadService = new pskl.service.BeforeUnloadService(
        this.piskelController
      );
      this.beforeUnloadService.init();

      this.headerController = new pskl.controller.HeaderController(
        this.piskelController,
        this.savedStatusService
      );
      this.headerController.init();

      this.penSizeService = new pskl.service.pensize.PenSizeService();
      this.penSizeService.init();

      this.penSizeController = new pskl.controller.PenSizeController();
      this.penSizeController.init();

      this.fileDropperService = new pskl.service.FileDropperService(
        this.piskelController
      );
      this.fileDropperService.init();

      this.userWarningController = new pskl.controller.UserWarningController(
        this.piskelController
      );
      this.userWarningController.init();

      this.performanceReportService = new pskl.service.performance.PerformanceReportService(
        this.piskelController,
        this.currentColorsService
      );
      this.performanceReportService.init();

      this.clipboardService = new pskl.service.ClipboardService(
        this.piskelController
      );
      this.clipboardService.init();

      this.drawingLoop = new pskl.rendering.DrawingLoop();
      this.drawingLoop.addCallback(this.render, this);
      this.drawingLoop.start();

      this.initTooltips_();

      $.ajaxSetup({
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true
      });

      // TODO: check if sprite_id exists or can be edited
      $.get(
        'config.json',
        function(data) {
          var api = window.Api;
          api.serverURL = data.serverURL || api.serverURL;
          api.basePath = data.basePath || api.basePath;
          api.pathSuffix = data.pathSuffix || api.pathSuffix;

          if (window.loadPiskelPlugin) {
            window.loadPiskelPlugin();
          }
          this.connectServer();
        }.bind(this)
      ).fail(function(message) {
        alert('Failed to load config.json: check syntax');
      });

      if (pskl.devtools) {
        pskl.devtools.init();
      }

      if (
        pskl.utils.Environment.detectNodeWebkit() &&
        pskl.utils.UserAgent.isMac
      ) {
        var gui = require('nw.gui');
        var mb = new gui.Menu({ type: 'menubar' });
        mb.createMacBuiltin('Piskel');
        gui.Window.get().menu = mb;
      }

      if (
        !pskl.utils.Environment.isIntegrationTest() &&
        pskl.utils.UserAgent.isUnsupported()
      ) {
        $.publish(Events.DIALOG_SHOW, {
          dialogId: 'unsupported-browser'
        });
      }

      if (pskl.utils.Environment.isDebug()) {
        pskl.app.shortcutService.registerShortcut(
          pskl.service.keyboard.Shortcuts.DEBUG.RELOAD_STYLES,
          window.reloadStyles
        );
      }

      //setTimeout(
      //  function() {
      //    this.canvasBackgroundColor = "#0000AA";
      //    pskl.app.drawingController.render(true);
      //  }.bind(this),
      //  1500
      //);
    },

    connectServer: function() {
      var axios = window.axios;
      var api = window.Api;
      var params = api.getCustomURLParams();
      axios.defaults.withCredentials = true;

      this.setI18n(this._i18n);

      var self = this;

      var authPromise = !pskl.app.onGetLoggedInUser ?
        api.auth() :
        new Promise(function(resolve, reject) {
          pskl.app.onGetLoggedInUser(function(resp) {
            resolve({ data: resp });
          });
        });

      authPromise.then(function(resp) {
        if (resp.data.success) {
          self.currentUser = resp.data;
          $.publish(Events.SERVER_CONNECT, [resp.data]);
        } else {
          self.currentUser = null;
        }
      });

      if (params.sprite_id) {
        var promise = !pskl.app.onFetchSprite ?
          api.getSprite(params.sprite_id) :
          new Promise(function(resolve, reject) {
            pskl.app.onFetchSprite(params.sprite_id, function(resp) {
              resolve({ data: resp });
            });
          });

        promise.then(function(resp) {
          var sprite = resp.data.sprite;
          if (sprite) {
            self.loadPiskel(sprite.data);
          }
        });
      }
    },

    getHeader: function() {
      return document.querySelector('.fake-piskelapp-header');
    },

    getHeaderNav: function(html) {
      return document.querySelector('.fake-piskelapp-header .button-group');
    },

    setHeaderNavHTML: function(html) {
      var header = this.getHeaderNav();
      header.innerHTML = html;
      return header;
    },

    showPopup: function(node, containerClass) {
      $.publish(Events.DIALOG_SHOW, {
        dialogId: 'popup',
        initArgs: {
          node: node,
          containerClass: containerClass
        }
      });
    },

    closePopup: function() {
      $.publish(Events.DIALOG_HIDE, {
        dialogId: 'popup'
      });
    },

    loadPiskelDataOnly: function(piskelData, onSuccess, onError) {
      pskl.utils.PiskelFileUtils.decodePiskelFile(
        piskelData,
        function(piskel) {
          var oldPiskel = pskl.app.piskelController.getPiskel();
          if (piskel.descriptor && oldPiskel) {
            piskel.descriptor.name = oldPiskel.descriptor.name;
            piskel.descriptor.isPublic = oldPiskel.descriptor.isPublic;
            piskel.descriptor.description = oldPiskel.descriptor.description;
          }
          pskl.app.piskelController.setPiskel(piskel);

          $.publish(Events.PISKEL_SAVED);
          if (piskelData.descriptor) {
            // Backward compatibility for v2 or older
            piskel.setDescriptor(piskelData.descriptor);
          }
          if (onSuccess) {
            onSuccess();
          }
        },
        onError ||
          function(error) {
            console.log('failed to load piskel: ', error);
          }
      );
    },

    _piskelLoaded: false,

    canvasBackgroundColor: null,

    isPiskelLoaded: function() {
      return this._piskelLoaded;
    },

    loadPiskel: function(piskelData, onSuccess, onError) {
      if (this._piskelLoaded) {
        return;
      }
      var self = this;
      pskl.utils.PiskelFileUtils.decodePiskelFile(
        piskelData,
        function(piskel) {
          pskl.app.piskelController.setPiskel(piskel);
          self._piskelLoaded = true;
          $.publish(Events.PISKEL_SAVED);
          if (piskelData.descriptor) {
            // Backward compatibility for v2 or older
            piskel.setDescriptor(piskelData.descriptor);
          }
          if (onSuccess) {
            onSuccess();
          }
        },
        onError ||
          function(error) {
            console.log('failed to load piskel: ', error);
          }
      );
    },

    _i18n: {
      'Pen tool': 'Pansulat kagamitan',
      'Vertical Mirror pen': 'Pabaliktad kagamitan',
      'Use horizontal axis': 'Gamitin ang pahalang na aksis',
      'Use horizontal and vertical axis':
        'Gamitin ang pahalang at patayong aksis',
      'Paint bucket tool': 'Pintang balde',
      'Paint all pixels of the same color':
        'Pintahan lahat ng piksel ng parehang kulay',

      'Apply to all layers': 'I-apply sa lahat ng layer',
      'Apply to all frames': 'I-apply sa lahat ng frame',
      'Eraser tool': 'Pang-bura',
      'Stroke tool': 'Pang-stroke',
      'Hold shift to draw straight lines':
        'I-hold ang shift para mag-guhit ng linya',
      'Rectangle tool': 'Pang-parisukat',
      'Keep 1 to 1 ratio': 'I-maintain ang 1 ratio',
      'Circle tool': 'Pang-bilog',
      'Move tool': 'Pang-galaw',
      'Shape selection': 'Pang-pili ng hugis',
      'Rectangle selection': 'Pang-pili ng rektanggulo',
      'Lasso selection': 'Pang-pili ng lasso',
      'Wrap canvas borders': 'I-balot sa canvas borders',
      'Drag the selection to move it. You may switch to other layers and frames.':
        'Hilain ang pinili para gumalaw. Pwedeng lumipat sa obang mga layer at mga frame',
      'Copy the selected area': 'Kopyahin ang piniling area lugar',
      'Paste the copied area': 'I-dikit ang kinopyang lugar',
      'Hold to move the content': 'Hawakan ang ginalaw na nilalaman',
      'Dithering tool': 'Pang-dither',
      'Color picker': 'Pang-pili ng kulay',
      'Flip horizontally': 'I-baliktad ng pahalang',
      'Flip vertically': 'I-baliktad ng patayo',
      'Clockwise rotation': 'sunod-sunod na pag-ikot',
      'Align image to the center': 'I-sentro ang imahe',
      'Show resize settings': 'Ipakita ang mga setting ng pangbago ng laki',
      'Show color counter': 'Ipakita ang bilangan ng kulay',

      'Vertical mirror pen tool': 'Patayong baligtad na pang-sulat',
      'Reset zoom level': 'I-reset ang zoom level',
      'Increase zoom level': 'Dagdagan ang zoom level',
      'Decrease zoom level': 'Bawasan ang zoom level',
      'Increase pen size': 'Dagdagan ang laki ng pang-sulat',
      'Decrease pen size': 'Bawasan ang laki ng pang-sulat',
      Undo: 'Ibalik',
      Redo: 'Ulitin',

      'Select previous frame': 'I-select ang nakaraang frame',
      'Select next frame': 'I-select ang susunod na frame',
      'Create new empty frame': 'Gumawa ng bagong frame',
      'Duplicate selected frame': 'Doblehin ang nakapiling frame',
      'Open the keyboard shortcut cheatsheet':
        'Buksan ang keyboard shortcut cheatsheet',

      'Select original size preview': 'Piliin ang orihinal na laki ng preview',
      'Select best size preview': 'Piliin ang best na laki ng preview',
      'Select full size preview': 'Piliin ang full na laki ng preview',

      'Toggle onion skin': 'I-toggle ang onion skin',
      'Toggle layer preview': 'I-toggle ang layer preview',

      'Open merge animation popup': 'Buksan ang merge animation popup',
      'Close an opened popup': 'Isara ang nakabukas na popup',
      'Move viewport up': 'Ilipat ang viewport pataas',
      'Move viewport right': 'Ilipat ang viewport sa kanan',
      'Move viewport left': 'Ilipat ang viewport sa kaliwa',
      'Move viewport down': 'Ilipat ang viewport sa baba',

      'Cut selection': 'Alisin ang nakapili',
      'Copy selection': 'Kopyahin ang nakapili',
      'Paste selection': 'I-paste ang nakapili',
      'Delete selection': 'I-delete ang nakapili',
      'Commit selection': 'I-commit ang nakapili',

      'Swap primary/secondary colors':
        'I-swap ang primary/secondary na mga kulay',
      'Reset default colors': 'I-reset ang mga default na kulay',

      'Open the palette creation popup':
        'I-open ang popup ng paggawa ng palette',

      'Select the previous color in the current palette':
        'Piliiin ang nakaraang kulay sa pangkasalakuyang palette,',

      'Select the next color in the current palette':
        'Piliiin ang susunod kulay sa pangkasalakuyang palette',

      'Select a palette color in the current palette':
        'Pumili ng kulay sa pangkasalukuyang palette',

      '(desktop) Open a .piskel file': '(desktop) Mag-bukas ng .piskel file',
      '(desktop) Save as new': '(desktop) Mag-save ng bago',

      'Save the current sprite': 'I-save ang pangkasalukuyang sprite',

      'Pen size': 'Laki ng panulat',
      'from 1 to 4 pixels': 'Mula sa 1 hanggang 4 na piksel',

      Preferences: 'Mga kagustuhan',

      Resize: 'Baguhin ang laki',
      'Resize the drawing area': 'Baguhin ang laki ng lugar ng pagguhitan',

      Save: 'I-save',
      'Save to your gallery, save locally': 'I-ligtas sa inyong galerya',
      'or export as a file': 'o i-export bilang isang file',

      Export: 'I-export',
      'Export Image as PNG': 'I-export bilang isang PNG',

      Import: 'I-import',
      'Import an existing image': 'I-import ang dating imahe',

      'Sprite Information': 'Impormasyon sa sprite',
      Title: 'titulo',
      Description: 'Diskripsyon',
      Public: 'Publiko',

      'Save offline in Browser': 'I-save offline sa browser',
      'Your piskel will be saved locally and will only be accessible from this browser.':
        'Ang inyong piskel ay masasaved locally',

      'Save as File': 'I-save bilang isang file',
      'Your sprite will be saved as a .piskel file.':
        'Ang inyong sprite ay masasaved bilang isang .piskel file',

      'Save offline as File': 'I-save offline bilang isang file',
      'Your sprite will be downloaded as a .piskel file.':
        'Ang inyong sprite ay madodownload bilang isang .piskel file',

      'Save online': 'I-save online',
      'Your piskel will be stored online in your gallery.':
        'Ang inyong piskel ay ma-sasave sa online galerya',

      'Export your animation as a |TYPE| image.':
        'I-export ang inyong animation bilang isang |TYPE| image',

      Scale: 'Antas',
      'Include grid in image': 'I-sama ang grid sa imahe',
      'Note: You must configure the grid first in the preferences':
        'N.B. Kailangan mong i-configure ang grid muna sa mga preferences',
      'Show cell counter': 'I-pakita ang cell counter',
      'Hide image with numbers': 'I-tago ang imahe gamit ang mga numbers',

      Download: 'I-download',
      'Download as a PNG file': 'I-download bilang isang PNG file',

      'LOAD FROM BROWSER': 'I-load mula sa browser',
      'LOAD .PISKEL FILE': 'I-load ang .piskel file',
      'IMPORT FROM PICTURE': 'Mag-import mula sa picture',

      'Browse local saves': 'I-browse mula sa mga local na save',
      'Browse .piskel files': 'I-browse ang mga .piskel files',
      'Browse images': 'I-browse ang mga imahe',

      'Load a local piskel saved in this Browser':
        'Mag-load ng local na piskel sa browser na ito',
      'Load a .piskel file from your computer':
        'Mag-load ng .piskel mula sa inyong kompyuter',
      'Supports PNG, JPG, BMP': 'Pwede ang PNG, JPG, BMP',

      'RECOVER RECENT SESSIONS': 'I-recover ang nakaraang sessions',
      'Browse backups of previous sessions.':
        'I-browse ang mga backup ng nakaraang sessions',
      'Browse backups': 'I-browse ang backups',

      Background: 'Likud-lupa',
      'Enable grid': 'Ipakita ang grid',
      'Grid size': 'Laki o lapad ng grid',
      'Grid spacing': 'Spasyo ng grid',
      'Grid color': 'Kulay ng grid',

      'COLOR COUNTER': 'Bilangan ng kulay',
      'Empty canvas': 'Blankong kanvas'
    },

    setI18n(i18n) {
      if (!i18n) {
        return;
      }
      if (typeof i18n == 'function') {
        this._i18nFn = i18n;
      } else {
        this._i18nFn = null;
        for (var k in Object.keys(i18n)) {
          this._i18n[k] = i18n[k];
        }
      }

      document.querySelector(
        '.pen-size-container.size-picker-container'
      ).title =
        this.i18n('Pen size') + '<br>' + this.i18n('from 1 to 4 pixels');

      document.querySelector('.tool-icon.icon-settings-gear-white').title =
        '<span class=\'highlight\'>' +
        pskl.app.i18n('Preferences') +
        '</span></br>';
      document.querySelector('.tool-icon.icon-settings-resize-white').title =
        '<span class=\'highlight\'>' +
        pskl.app.i18n('Resize') +
        '</span></br>' +
        pskl.app.i18n('Resize the drawing area');
      document.querySelector('.tool-icon.icon-settings-save-white').title =
        '<span class=\'highlight\'>' +
        pskl.app.i18n('Save') +
        '</span></br>' +
        pskl.app.i18n('Save to your gallery, save locally') +
        '<br/>' +
        pskl.app.i18n('or export as a file');
      document.querySelector('.tool-icon.icon-settings-export-white').title =
        '<span class=\'highlight\'>' +
        pskl.app.i18n('Export') +
        '</span></br>' +
        pskl.app.i18n('Export Image as PNG');
      document.querySelector(
        '.tool-icon.icon-settings-open-folder-white'
      ).title =
        '<span class=\'highlight\'>' +
        pskl.app.i18n('Import') +
        '</span></br>' +
        pskl.app.i18n('Import an existing image');
    },

    i18n(text) {
      if (this._i18nFn) {
        return this._i18nFn(text) || text;
      }
      return this._i18n[text] || text;
    },

    getPiskelInitData_: function() {
      return pskl.appEnginePiskelData_;
    },

    isLoggedIn: function() {
      return this.currentUser != null;
    },

    initTooltips_: function() {
      $('body').tooltip({
        selector: '[rel=tooltip]'
      });
    },

    render: function(delta) {
      this.drawingController.render(delta);
      //this.previewController.render(delta);
      //this.framesListController.render(delta);
    },

    getFirstFrameAsPng: function() {
      var frame = pskl.utils.LayerUtils.mergeFrameAt(
        this.piskelController.getLayers(),
        0
      );
      var canvas;
      if (frame instanceof pskl.model.frame.RenderedFrame) {
        canvas = pskl.utils.CanvasUtils.createFromImage(
          frame.getRenderedFrame()
        );
      } else {
        canvas = pskl.utils.FrameUtils.toImage(frame);
      }
      return canvas.toDataURL('image/png');
    },

    getFramesheetAsPng: function() {
      var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
      var framesheetCanvas = renderer.renderAsCanvas();
      return framesheetCanvas.toDataURL('image/png');
    }
  };
})();
