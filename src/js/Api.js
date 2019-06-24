var Api = {
  serverURL: '',
  basePath: '/piskel/api',
  pathSuffix: '.php',

  getCustomURLParams: function() {
    var hash = location.hash;
    if (!hash || hash.slice(0, 2) != '#!') {
      return {};
    }
    var params = {};
    hash
      .slice(2)
      .split('&')
      .forEach(function(defs) {
        var fields = defs.split('=');
        var key = fields[0];
        var value = fields[1] || true;
        params[key] = value;
      });
    return params;
  },

  url: function(path) {
    return this.serverURL + this.basePath + path + this.pathSuffix;
  },

  merge: function(obj1, obj2) {
    var m = {};
    Object.keys(obj1).forEach(function(k) {
      m[k] = obj1[k];
    });
    Object.keys(obj2).forEach(function(k) {
      m[k] = obj2[k];
    });
    return m;
  },

  get: function(path, data) {
    return window.axios.get(this.url(path), { params: data });
  },

  toQueryString: function(data) {
    var q = {};
    return Object.keys(data)
      .map(function(k) {
        return k + '=' + encodeURIComponent(data[k]);
      })
      .join('&');
  },

  post: function(path, data) {
    var params = new URLSearchParams();
    Object.keys(data).forEach(function(k) {
      params.append(k, data[k]);
    });

    return window.axios.post(this.url(path), params);
  },

  fetchSprite: function() {
    var params = this.getCustomURLParams();
    return this.getSprite(params.pid);
  },

  login: function(username, password) {
    return this.get('/login', { username: username, password: password });
  },

  logout: function() {
    return this.get('/logout');
  },

  register: function(username, password) {
    return this.get('/register', { username: username, password: password });
  },

  verify: function() {
    return this.get('/verify');
  },

  auth: function() {
    return this.get('/auth');
  },

  getSprite: function(id) {
    return this.get('/sprite-get', { id: id });
  },

  createSprite: function(title, description, public, data) {
    return this.post('/sprite-create', {
      title: title,
      description: description,
      public: public,
      data: data,
    });
  },

  updateSprite: function(id, title, description, public, data) {
    return this.post('/sprite-update', {
      id: id,
      title: title,
      description: description,
      public: public,
      data: data,
    });
  },

  createOrUpdate: function(title, description, public, data) {
    var params = this.getCustomURLParams();
    if (params.sprite_id) {
      return this.updateSprite(params.sprite_id, title, description, public, data);
    } else {
      return this.createSprite(title, description, public, data);
    }
  }
};
