(function(root) {
  var Util = {
    each: function(arr, fn) {
      for(var i = -1, l = arr.length; ++i < l;) {
        fn(arr[i]);
      }
    },
    extend: function(obj) {
      this.each(Array.prototype.slice.call(arguments, 1), function(src) {
        if(src) {
          for(var prop in src) {
            obj[prop] = src[prop];
          }
        }
      });
      return obj;
    },
    throwError: function(msg, name) {
      var error = new Error(msg);
      error.name = name || 'Error';
      throw error;
    }
  };

  var AssetManager = {
    assets: [],
    load: function(callback) {
      var count = this.assets.length;
      for (var i = 0; i < this.assets.length; i++) {
        var asset = this.assets[i].asset;
        if(asset instanceof Image) {
          asset.src = this.assets[i].path;
          asset.onload = function() { if(--count === 0) callback(); }
        }
      }
    }
  };

  var InputManager = {
    keys: {},
    load: function() {
      var keys = this.keys = {};
      document.addEventListener('keyup', function(e) {
        if(e.keyIdentifier) keys[e.keyIdentifier.toLowerCase()] = false;
        if(e.keyCode) keys[e.keyCode] = false;
      });

      document.addEventListener('keydown', function(e) {
        if(e.keyIdentifier) keys[e.keyIdentifier.toLowerCase()] = true;
        if(e.keyCode) keys[e.keyCode] = true;
      });
    }
  };

  var Physics = {
    gravity: 9.8,
    gravityFactor: 8.0,
    applyGravity: function(vel, delta) {
      vel.y += (this.gravity * this.gravityFactor) * delta;
      return vel;
    }
  };

  var CollisionMediator = function(options) {
    this.mediateCollision = function(obj, vel, delta) {
      vel = Physics.applyGravity(vel, delta);
      // takes a game object and a velocity
      // verifies that the game object can move at the velocity
      // if not it returns the position closest to where the velocity
      // would take the object.
      var pos = { x: obj.pos.x + vel.x, y: obj.pos.y + vel.y };

      // in a real game these checks would be replaced
      // with some kind of collision check against other objects
      if(pos.y >= 110) pos.y = 110;
      return pos;
    };
  };


  var Game = function(options) {
    Game.current = this;
    this.options = options = Util.extend({}, Game.defaults, options);
    var canvas = options.canvas || document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var _objects = options.objects || [];
    var lastFrameTime = Date.now();
    var mediator = new CollisionMediator();

    this.input = InputManager;
    this.input.load();

    var update = this.update = function() {
      var now = Date.now();
      var delta = now - lastFrameTime;
      Util.each(_objects, function(o) {
        if(o.update) o.update(delta/1000, InputManager); // convert to fraction before sending to others
      });
      lastFrameTime = now;
    };

    var draw = this.draw = function() {
      ctx.fillStyle = options.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      _objects = _objects.sort(function(a,b) {
        return a.depth - b.depth;
      });

      Util.each(_objects, function(o) {
        if(o.draw) o.draw(canvas, ctx);
      });

      ctx.restore();
    };

    this.addObject = function(obj) {
      if(!obj.hasOwnProperty('draw') && obj.hasOwnProperty('update')) {
        Util.throwError('a game object needs a draw() or update()');
        return;
      }
      obj.depth = obj.depth || 1;
      obj.physics = Physics; // share physics
      obj.collisionMediator = mediator; // share mediator
      _objects.push(obj);
    };

    this.getObject = function(fn) {
      if(typeof(fn) === 'number') return _objects[fn];
      for(var i = -1, l = _objects.length; ++i < l;) {
        if((fn instanceof Function && fn(_objects[i]))) {
          return _objects[i];
        }
      }
    };

    var loop = function() {
      update();
      draw();
      window.requestAnimationFrame(loop);
    };

    // when the document is ready, start loading the assets
    document.addEventListener( "DOMContentLoaded", function() {
      AssetManager.load(function() {
        requestAnimationFrame(loop);
      });
    }, false );
  };

  Util.extend(Game, {
    defaults: {
      fps: 60,
      bg: '#ffffff',
      scale: 1
    }
  });

  var Animation = function(name, time, spritesheet, frames) {
    this.name = name;
    this.time = time;
    this.frames = frames;
    this.loopCount = 0;
    this.currentFrame = 0;

    var timeForCurrentFrame = 0;
    this.update = function(delta) {
      timeForCurrentFrame += delta;
      if(timeForCurrentFrame >= this.time) {
        this.currentFrame++;
        if((this.loopCount < 1 && this.repeat) || (this.currentFrame >= this.frames.length)) {
          this.loopCount++;
          this.currentFrame = this.repeat ? 0 : this.frames.length - 1;
        }
        timeForCurrentFrame = 0;
      }
    };

    this.draw = function(ctx, pos) {
      var offsetX = spritesheet.options.cellSize.width  * this.frames[this.currentFrame];
      var offsetY = 0;
      while(offsetX >= spritesheet.img.width) {
        offsetX = offsetX - spritesheet.img.width;
        offsetY += spritesheet.options.cellSize.height;
      }

      // drawImage takes a billion args, doc them here so we know wtf we're doing
      var srcSize = spritesheet.options.cellSize;
      var x = pos.x;
      var y = pos.y;
      if(spritesheet.flip.x || spritesheet.flip.y) {
        ctx.save();
        ctx.scale( spritesheet.flip.x ? -1 : 1, spritesheet.flip.y ? -1 : 1 );

        if(spritesheet.flip.x) {
          x *= -1;
          x -= srcSize.width;
        }
        if(spritesheet.flip.y) {
          y *= -1;
          y -= srcSize.height;
        }
      }

      ctx.drawImage(
        spritesheet.img,                             // the source image to draw
        offsetX,                                     // source x co-ord, where in the image to start reading
        offsetY,                                     // source y co-ord, where in the image to start reading
        srcSize.width,                               // destination width
        srcSize.height,                              // destination height
        x,                                           // destination x co-ord
        y,                                           // destination y co-ord
        srcSize.width,                               // source width, how much to read from source
        srcSize.height);                             // source height, how much to read from source

        if(spritesheet.flip.x || spritesheet.flip.y) {
          ctx.restore();
        }
    };
  };

  var SpriteSheet = function(path, options) {
    this.options = options;
    this.animations = {};
    this.img = new Image();
    this.flip = { x: false, y: false };
    AssetManager.assets.push({ path: path, asset: this.img });

    this.currentAnimation = '';

    this.totalFrames = function() {
      var rows = this.img.height / this.options.cellSize.height;
      var cols = this.img.width / this.options.cellSize.width;
      return rows * cols;
    };

    this.addAnim = function(name, time, frames, repeat) {
      this.animations[name] = new Animation(name, time, this, frames);
      this.animations[name].repeat = !!repeat;
      this.currentAnimation = this.currentAnimation || name;
    };

    this.draw = function(ctx, pos) {
      this.animations[this.currentAnimation].draw(ctx, pos);
    };

    this.update = function(delta) {
      this.animations[this.currentAnimation].update(delta);
    };
  };

  root.Game = Game;
  root.SpriteSheet = SpriteSheet;
})(this);
