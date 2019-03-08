(function () {
  var ns = $.namespace('pskl.utils');

  var dec2Hex = function(n) {
    var hex = (parseInt(n) || 0).toString(16).substr(-4).toUpperCase();
    return pskl.utils.StringUtils.leftPad(hex, 2, '0');
  };

  var all = function(array, pred) {
    for (var i = 0; i < array.length; i++) {
      if (!pred(array[i])) {
        return false;
      }
    }
    return true;
  };

  ns.ColorUtils = {
    hex2Rgb: function(hex) {
      var values = hex.match(/\w\w/g);
      if (!values) {
        values = hex.match(/\w/g);
      }
      if (!values || values.length != 3) {
        return hex;
      }
      return (
        'rgb(' +
        values
          .map(function(n) {
            return parseInt(n, 16);
          })
          .join(', ') +
        ')'
      );
    },


    rgbToHex: function(rgb) {
      if (rgb[0] == '#') {
        return rgb;
      }
      var nums = rgb.match(/\d+/g);
      if (!nums) {
        return rgb;
      }

      if (nums.length == 4 && all(nums, function(x) { return x == '0';})) {
        return '#00000000';
      }

      return '#' + nums.slice(0, 3).map(dec2Hex).join('');
    },

    hexToVector: function(hex) {
      if (hex[0] == '#') {
        hex = hex.slice(1); // remove hash
      }
      var m = hex.match(/\w\w/g);
      if (!m) {
        return [0, 0, 0];
      }
      var vec = m.slice(0, 3).map(function(s) {
        return parseInt(s, 16);
      });
      return vec;
    },

    colorDistance: function(hex1, hex2) {
      var v = this.hexToVector(hex1);
      var w = this.hexToVector(hex2);
      var sum = 0;
      for (var i = 0; i < v.length; i++) {
        var n = (w[i] || 0) - (v[i] || 0);
        sum += Math.pow(n, 2);
      }
      return Math.sqrt(sum);
    },

    getUnusedColor : function(usedColors) {
      usedColors = usedColors || [];
      // create check map
      var colorMap = {};
      usedColors.forEach(function (color) {
        colorMap[color.toUpperCase()] = true;
      });

      // start with white
      var color = {
        r : 255,
        g : 255,
        b : 0
      };
      var match = null;
      while (true) {
        var hex = window.tinycolor(color).toHexString().toUpperCase();

        if (!colorMap[hex]) {
          match = hex;
          break;
        } else {
          // pick a non null component to decrease its value
          var component = (color.r && 'r') || (color.g && 'g') || (color.b && 'b');
          if (component) {
            color[component] = color[component] - 1;
          } else {
            // no component available, no match found
            break;
          }
        }
      }

      return match;
    }
  };
})();
