import { Container, Graphics } from 'pixi.js';

export class Projectile extends Container {
  constructor(config) {
    super();

    this.label = 'projectile';
    this.speed = config.speed ?? 520;
    this.size = {
      width: config.width ?? 6,
      height: config.height ?? 18,
    };

    this.position.set(config.x, config.y);
    this.view = createProjectileView(this.size);
    this.addChild(this.view);
  }

  update(deltaSeconds) {
    this.y -= this.speed * deltaSeconds;
  }

  getCollisionBounds() {
    const halfWidth = this.size.width * 0.5;
    const halfHeight = this.size.height * 0.5;

    return {
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight,
    };
  }
}

function createProjectileView(size) {
  return new Graphics()
    .roundRect(-size.width * 0.5, -size.height * 0.5 + 3, size.width, size.height, 3)
    .fill({ color: 0xffb86b, alpha: 0.35 })
    .roundRect(-size.width * 0.5, -size.height * 0.5, size.width, size.height, 3)
    .fill({ color: 0xfff2c6, alpha: 0.95 })
    .roundRect(-size.width * 0.22, -size.height * 0.5 - 4, size.width * 0.44, 6, 2)
    .fill({ color: 0xff7f6a, alpha: 0.95 });
}
