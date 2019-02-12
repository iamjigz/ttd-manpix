(function () {

  var ns = $.namespace('pskl.controller');

  ns.DrawingController = function (piskelController, container) {
    /**
     * @public
     */
    this.piskelController = piskelController;

    this.dragHandler = new ns.drawing.DragHandler(this);

    /**
     * @public
     */
    this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(piskelController.getCurrentFrame());

    /**
     * @private
     */
    this.container = container;

    var cfg = {
      'zoom': this.calculateZoom_(),
      'supportGridRendering' : true,
      'height' : this.getContainerHeight_(),
      'width' : this.getContainerWidth_(),
      'xOffset' : 0,
      'yOffset' : 0
    };

    this.overlayRenderer = new pskl.rendering.frame.CachedFrameRenderer(this.container, cfg, ['canvas-overlay']);
    this.renderer = new pskl.rendering.frame.CachedFrameRenderer(this.container, cfg, ['drawing-canvas']);
    this.onionSkinRenderer = pskl.rendering.OnionSkinRenderer.createInContainer(this.container, cfg, piskelController);
    this.layersRenderer = new pskl.rendering.layer.LayersRenderer(this.container, cfg, piskelController);

    this.compositeRenderer = new pskl.rendering.CompositeRenderer();
    this.compositeRenderer
      .add(this.overlayRenderer)
      .add(this.renderer)
      .add(this.layersRenderer)
      .add(this.onionSkinRenderer);

    // State of drawing controller:
    this.isClicked = false;
    this.previousMousemoveTime = 0;
    this.currentToolBehavior = null;
  };

  ns.DrawingController.prototype.init = function () {
    this.initMouseBehavior();

    $.subscribe(Events.TOOL_SELECTED, $.proxy(function(evt, toolBehavior) {
      this.currentToolBehavior = toolBehavior;
      this.overlayFrame.clear();
    }, this));

    $(window).resize($.proxy(this.startResizeTimer_, this));

    $.subscribe(Events.USER_SETTINGS_CHANGED, this.onUserSettingsChange_.bind(this));
    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));

    var shortcuts = pskl.service.keyboard.Shortcuts;
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.RESET_ZOOM, this.resetZoom_.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.INCREASE_ZOOM, this.updateZoom_.bind(this, 1));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.DECREASE_ZOOM, this.updateZoom_.bind(this, -1));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.OFFSET_UP, this.updateOffset_.bind(this, 'up'));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.OFFSET_RIGHT, this.updateOffset_.bind(this, 'right'));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.OFFSET_DOWN, this.updateOffset_.bind(this, 'down'));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.OFFSET_LEFT, this.updateOffset_.bind(this, 'left'));

    window.setTimeout(function () {
      this.afterWindowResize_();
      this.resetZoom_();
    }.bind(this), 100);
  };

  ns.DrawingController.prototype.initMouseBehavior = function() {
    var body = $('body');
    this.container.mousedown($.proxy(this.onMousedown_, this));

    if (pskl.utils.UserAgent.isChrome || pskl.utils.UserAgent.isIE11) {
      this.container.on('mousewheel', $.proxy(this.onMousewheel_, this));
    } else {
      this.container.on('wheel', $.proxy(this.onMousewheel_, this));
    }

    window.addEventListener('mouseup', this.onMouseup_.bind(this));
    window.addEventListener('mousemove', this.onMousemove_.bind(this));
    window.addEventListener('keyup', this.onKeyup_.bind(this));
    window.addEventListener('touchstart', this.onTouchstart_.bind(this));
    window.addEventListener('touchmove' , this.onTouchmove_.bind(this));
    window.addEventListener('touchend', this.onTouchend_.bind(this));

    // Deactivate right click:
    body.contextmenu(this.onCanvasContextMenu_);

  };

  ns.DrawingController.prototype.startResizeTimer_ = function () {
    if (this.resizeTimer) {
      window.clearInterval(this.resizeTimer);
    }
    this.resizeTimer = window.setTimeout($.proxy(this.afterWindowResize_, this), 200);
  };

  ns.DrawingController.prototype.afterWindowResize_ = function () {
    var initialWidth = this.compositeRenderer.getDisplaySize().width;

    this.compositeRenderer.setDisplaySize(this.getContainerWidth_(), this.getContainerHeight_());
    this.centerColumnWrapperHorizontally_();
    var ratio = this.compositeRenderer.getDisplaySize().width / initialWidth;
    var newZoom = ratio * this.compositeRenderer.getZoom();
    this.compositeRenderer.setZoom(newZoom);

    $.publish(Events.ZOOM_CHANGED);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onUserSettingsChange_ = function (evt, settingsName, settingsValue) {
    if (settingsName == pskl.UserSettings.SHOW_GRID) {
      console.warn('DrawingController:onUserSettingsChange_ not implemented !');
    } else if (settingsName == pskl.UserSettings.ONION_SKIN || settingsName == pskl.UserSettings.LAYER_PREVIEW) {
      this.onionSkinRenderer.clear();
      this.onionSkinRenderer.flush();
      this.layersRenderer.clear();
      this.layersRenderer.flush();
      this.render();
    }
  };

  ns.DrawingController.prototype.onFrameSizeChange_ = function () {
    this.compositeRenderer.setDisplaySize(this.getContainerWidth_(), this.getContainerHeight_());
    this.centerColumnWrapperHorizontally_();
    this.compositeRenderer.setZoom(this.calculateZoom_());
    this.compositeRenderer.setOffset(0, 0);
    $.publish(Events.ZOOM_CHANGED);
  };

  ns.DrawingController.prototype.onTouchstart_ = function (event) {
    this.onMousedown_(event);
  };

  ns.DrawingController.prototype.onTouchmove_ = function (event) {
    this.onMousemove_(event);
    event.preventDefault();
  };

  ns.DrawingController.prototype.onTouchend_ = function (event) {
    this.onMouseup_(event);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousedown_ = function (event) {
    $.publish(Events.MOUSE_EVENT, [event, this]);
    var frame = this.piskelController.getCurrentFrame();
    var coords = this.getSpriteCoordinates(event.clientX, event.clientY);
    if (event.changedTouches && event.changedTouches[0]) {
      coords = this.getSpriteCoordinates(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }

    this.isClicked = true;

    if (event.button === Constants.MIDDLE_BUTTON) {
      this.dragHandler.startDrag(event.clientX, event.clientY);
    } else if (event.altKey && !this.currentToolBehavior.supportsAlt()) {
      this.currentToolBehavior.hideHighlightedPixel(this.overlayFrame);
      this.isPickingColor = true;
    } else {
      this.currentToolBehavior.hideHighlightedPixel(this.overlayFrame);
      $.publish(Events.TOOL_PRESSED);
      this.currentToolBehavior.applyToolAt(
        coords.x,
        coords.y,
        frame,
        this.overlayFrame,
        event
      );
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMousemove_ = function (event) {
    this._clientX = event.clientX;
    this._clientY = event.clientY;
    if (event.changedTouches && event.changedTouches[0]) {
      this._clientX = event.changedTouches[0].clientX;
      this._clientY = event.changedTouches[0].clientY;
    }

    var currentTime = new Date().getTime();
    // Throttling of the mousemove event:

    if ((currentTime - this.previousMousemoveTime) > Constants.MOUSEMOVE_THROTTLING) {
      this.moveTool_(this._clientX, this._clientY, event);
      this.previousMousemoveTime = currentTime;
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onKeyup_ = function (event) {
    this.moveTool_(this._clientX, this._clientY, event);
  };

  ns.DrawingController.prototype.moveTool_ = function (x, y, event) {
    var coords = this.getSpriteCoordinates(x, y);
    var currentFrame = this.piskelController.getCurrentFrame();

    if (this.isClicked) {
      if (pskl.app.mouseStateService.isMiddleButtonPressed()) {
        this.dragHandler.updateDrag(x, y);
      } else if (this.isPickingColor) {
        // Nothing to do on mousemove when picking a color with ALT+click.
      } else {
        $.publish(Events.MOUSE_EVENT, [event, this]);
        this.currentToolBehavior.moveToolAt(
          coords.x | 0,
          coords.y | 0,
          currentFrame,
          this.overlayFrame,
          event
        );
      }
    } else {
      this.currentToolBehavior.moveUnactiveToolAt(
        coords.x,
        coords.y,
        currentFrame,
        this.overlayFrame,
        event
      );
    }
    $.publish(Events.CURSOR_MOVED, [coords.x, coords.y]);
  };

  ns.DrawingController.prototype.onMousewheel_ = function (jQueryEvent) {
    var evt = jQueryEvent.originalEvent;
    // Ratio between wheelDeltaY (mousewheel event) and deltaY (wheel event) is -40
    var delta;
    if (pskl.utils.UserAgent.isIE11) {
      delta = evt.wheelDelta;
    } else if (pskl.utils.UserAgent.isFirefox) {
      delta = -40 * evt.deltaY;
    } else {
      delta = evt.wheelDeltaY;
    }

    delta = delta || 0;
    var modifier = (delta / 120);

    if (pskl.utils.UserAgent.isMac ? evt.metaKey : evt.ctrlKey) {
      modifier = modifier * 5;
      // prevent default to prevent the default browser UI resize
      evt.preventDefault();
    }

    var coords = this.getSpriteCoordinates(evt.clientX, evt.clientY);
    this.updateZoom_(modifier, coords);
  };

  /**
   * Update the current viewport offset of 1 pixel in the provided direction.
   * Direction can be one of 'up', 'right', 'down', 'left'.
   * Callback for the OFFSET_${DIR} shortcuts.
   */
  ns.DrawingController.prototype.updateOffset_ = function (direction) {
    var off = this.getOffset();
    if (direction === 'up') {
      off.y -= 1;
    } else if (direction === 'right') {
      off.x += 1;
    } else if (direction === 'down') {
      off.y += 1;
    } else if (direction === 'left') {
      off.x -= 1;
    }

    this.setOffset(
      off.x,
      off.y
    );
  };

  /**
   * Update the current zoom level by a given multiplier.
   *
   * @param {Number} zoomMultiplier: factor by which the zoom should be modified. Negative
   *        values will decrease the zoom, positive values will increase it.
   * @param {Object} centerCoords, optional:
   *        - {Number} x: x coordinate of the desired center the zoomed canvas
   *        - {Number} y: y coordinate of the desired center the zoomed canvas
   */
  ns.DrawingController.prototype.updateZoom_ = function (zoomMultiplier, centerCoords) {
    if (zoomMultiplier === 0) {
      return;
    }

    var off = this.getOffset();
    var oldWidth = this.getContainerWidth_() / this.renderer.getZoom();
    var oldHeight = this.getContainerHeight_() / this.renderer.getZoom();

    var step = zoomMultiplier * this.getZoomStep_();
    this.setZoom_(this.renderer.getZoom() + step);

    if (typeof centerCoords === 'object') {
      var xRatio = (centerCoords.x - off.x) / oldWidth;
      var yRatio = (centerCoords.y - off.y) / oldHeight;
      var newWidth = this.getContainerWidth_() / this.renderer.getZoom();
      var newHeight = this.getContainerHeight_() / this.renderer.getZoom();
      this.setOffset(
        off.x - ((newWidth - oldWidth) * xRatio),
        off.y - ((newHeight - oldHeight) * yRatio)
      );
    }
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onMouseup_ = function (event) {
    if (!this.isClicked) {
      return;
    }

    var coords = this.getSpriteCoordinates(event.clientX, event.clientY);
    if (event.changedTouches && event.changedTouches[0]) {
      coords = this.getSpriteCoordinates(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }

    // A mouse button was clicked on the drawing canvas before this mouseup event,
    // the user was probably drawing on the canvas.
    // Note: The mousemove movement (and the mouseup) may end up outside
    // of the drawing canvas.

    this.isClicked = false;

    var isMiddleButton = pskl.app.mouseStateService.isMiddleButtonPressed();
    var isMiddleClick = isMiddleButton && !this.dragHandler.isDragging();
    var isMiddleDrag = isMiddleButton && this.dragHandler.isDragging();

    if (this.isPickingColor || isMiddleClick) {
      // Picking color after ALT+click or middle mouse button click.
      this.pickColorAt_(coords);
      this.isPickingColor = false;
    } else if (isMiddleDrag) {
      // Stop the drag handler after a middle button drag action.
      this.dragHandler.stopDrag();
    } else {
      // Regular tool click, release the current tool.
      this.currentToolBehavior.releaseToolAt(
        coords.x,
        coords.y,
        this.piskelController.getCurrentFrame(),
        this.overlayFrame,
        event
      );
      $.publish(Events.TOOL_RELEASED);
    }

    $.publish(Events.MOUSE_EVENT, [event, this]);
  };

  /**
   * Send a COLOR selection event for the color contained at the provided coordinates.
   * No-op if the coordinate is outside of the drawing canvas.
   * @param  {Object} coords {x: Number, y: Number}
   */
  ns.DrawingController.prototype.pickColorAt_ = function (coords) {
    var frame = this.piskelController.getCurrentFrame();
    if (!frame.containsPixel(coords.x, coords.y)) {
      return;
    }

    var color = pskl.utils.intToColor(frame.getPixel(coords.x, coords.y));
    var isRightButton = pskl.app.mouseStateService.isRightButtonPressed();
    var evt = isRightButton ? Events.SELECT_SECONDARY_COLOR : Events.SELECT_PRIMARY_COLOR;
    $.publish(evt, [color]);
  };

  /**
   * Translate absolute x,y screen coordinates into sprite coordinates
   * @param  {Number} screenX
   * @param  {Number} screenY
   * @return {Object} {x:Number, y:Number}
   */
  ns.DrawingController.prototype.getSpriteCoordinates = function(screenX, screenY) {
    return this.renderer.getCoordinates(screenX, screenY);
  };

  ns.DrawingController.prototype.getScreenCoordinates = function(spriteX, spriteY) {
    return this.renderer.reverseCoordinates(spriteX, spriteY);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.onCanvasContextMenu_ = function (event) {
    if ($(event.target).closest('#drawing-canvas-container').length) {
      // Deactivate right click on drawing canvas only.
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    }
  };

  ns.DrawingController.prototype.render = function () {
    var currentFrame = this.piskelController.getCurrentFrame();
    if (!currentFrame.isSameSize(this.overlayFrame)) {
      this.overlayFrame = pskl.model.Frame.createEmptyFromFrame(currentFrame);
    }

    if (pskl.UserSettings.get(pskl.UserSettings.ONION_SKIN)) {
      this.onionSkinRenderer.render();
    }

    if (pskl.UserSettings.get(pskl.UserSettings.LAYER_PREVIEW)) {
      this.layersRenderer.render();
    }

    this.renderer.render(currentFrame);
    this.overlayRenderer.render(this.overlayFrame);
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.calculateZoom_ = function() {
    var frameHeight = this.piskelController.getCurrentFrame().getHeight();
    var frameWidth = this.piskelController.getCurrentFrame().getWidth();

    return Math.min(this.getAvailableWidth_() / frameWidth, this.getAvailableHeight_() / frameHeight);
  };

  ns.DrawingController.prototype.getAvailableHeight_ = function () {
    return $('#main-wrapper').height();
  };

  ns.DrawingController.prototype.getAvailableWidth_ = function () {
    var leftSectionWidth = $('.left-column').outerWidth(true);
    //var rightSectionWidth = $('.right-column').outerWidth(true);
    var toolsContainerWidth = $('#tool-section').outerWidth(true);
    var settingsContainerWidth = $('#application-action-section').outerWidth(true);

    var usedWidth = leftSectionWidth /*+ rightSectionWidth*/ + toolsContainerWidth /*+ settingsContainerWidth*/;
    var availableWidth = $('#main-wrapper').width() - usedWidth;

    var comfortMargin = 10;
    return availableWidth - comfortMargin;
  };

  ns.DrawingController.prototype.getContainerHeight_ = function () {
    return this.getAvailableHeight_();
  };

  ns.DrawingController.prototype.getContainerWidth_ = function () {
    return this.getAvailableWidth_();
  };

  /**
   * @private
   */
  ns.DrawingController.prototype.centerColumnWrapperHorizontally_ = function() {
    var containerHeight = this.getContainerHeight_();
    var verticalGapInPixel = Math.floor(($('#main-wrapper').height() - containerHeight) / 2);
    $('#column-wrapper').css({
      'top': verticalGapInPixel + 'px'
    });
  };

  ns.DrawingController.prototype.getRenderer = function () {
    return this.compositeRenderer;
  };

  ns.DrawingController.prototype.getOffset = function () {
    return this.compositeRenderer.getOffset();
  };

  ns.DrawingController.prototype.setOffset = function (x, y) {
    this.compositeRenderer.setOffset(x, y);
    $.publish(Events.ZOOM_CHANGED);
  };

  ns.DrawingController.prototype.resetZoom_ = function () {
    this.setZoom_(this.calculateZoom_());
  };

  ns.DrawingController.prototype.getZoomStep_ = function () {
    return Math.max(0.1, this.renderer.getZoom() / 15);
  };

  ns.DrawingController.prototype.setZoom_ = function (zoom) {
    this.compositeRenderer.setZoom(zoom);
    $.publish(Events.ZOOM_CHANGED);
  };

})();
