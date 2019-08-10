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
    },

    connectServer: function() {
      var axios = window.axios;
      var api = window.Api;
      var params = api.getCustomURLParams();
      axios.defaults.withCredentials = true;

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
