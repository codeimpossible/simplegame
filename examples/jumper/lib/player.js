var Player = function() {
  var spritePath = 'img/simple-player.png';
  var ready = false;

  this.sprite = new SpriteSheet(spritePath, {
    cellSize: {
      height: 24,
      width: 24
    }
  });

  this.sprite.addAnim('idle', 1, [0]);
  this.sprite.addAnim('move', 0.15, [0,1,2,3], true);
  this.sprite.addAnim('jump', 1, [3]);

  this.speed = 25;
  this.jumpHeight = 500;

  this.update = function(delta, input) {
    this.sprite.currentAnimation = 'idle';
    var vel = { x: 0, y: 0 };
    if(input.keys.up) {
      vel.y -= this.jumpHeight * delta;
      this.sprite.currentAnimation = 'jump';
    }

    if(input.keys.left) {
      vel.x -= this.speed * delta;
      this.sprite.currentAnimation = 'move';
      this.sprite.flip.x = true;
    }

    if(input.keys.right) {
      vel.x += this.speed * delta;
      this.sprite.currentAnimation = 'move';
      this.sprite.flip.x = false;
    }

    this.pos = this.collisionMediator.mediateCollision(this, vel, delta);
    this.sprite.update(delta);
  };

  this.draw = function(canvas, ctx) {
    this.sprite.draw(ctx, this.pos);
  };

  // finish loading the player
  this.pos = { x: 0, y: 0 };
};
