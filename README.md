simplegame.js
=============

a (very) simple game engine written in javascript. I gave a presentation at #BostonCodeCamp22 about this
game engine. You can view [the slides online.](http://slides.com/jaredbarboza/let-s-build-2d-game-engine)


## using simple game, the really simple case.

    var game = new Game();

    // add a simple box
    game.addObject({
      color: 'green',
      pos: { x: 100, y: 100 },
      height: 100,
      width: 100,
      draw: function(canvas, ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.rect(this.pos.x, this.pos.y, this.width, this.height);
        ctx.fill();
        ctx.stroke();
      }
    });


## Examples

 - `/examples/jumper/index.html` - a super simple platformer
