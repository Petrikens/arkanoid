import { Container, Graphics } from 'pixi.js';

const POWER_UP_COLORS = {
  multiball: {
    fill: 0x7de3ff,
    accent: 0xe8fbff,
  },
  gun: {
    fill: 0xff7f6a,
    accent: 0xffe4c7,
  },
  fireball: {
    fill: 0xff8b3d,
    accent: 0xffd39a,
  },
  paddle_expand: {
    fill: 0x7df0b1,
    accent: 0xe2ffe7,
  },
  paddle_shrink: {
    fill: 0xb48cff,
    accent: 0xf0e6ff,
  },
  ball_speed_up: {
    fill: 0xffe36b,
    accent: 0xfff7c9,
  },
  block_spawn: {
    fill: 0x6ee7a8,
    accent: 0xe6ffef,
  },
};

export class PowerUpCapsule extends Container {
  constructor(config) {
    super();

    const palette = POWER_UP_COLORS[config.type] ?? POWER_UP_COLORS.multiball;

    this.label = `power-up-${config.type}`;
    this.type = config.type;
    this.radius = config.radius ?? 12;
    this.speed = config.speed ?? 150;
    this.rotationSpeed = config.rotationSpeed ?? 2.6;

    this.position.set(config.x, config.y);
    this.view = createCapsuleView(this.radius, palette);
    this.addChild(this.view);
  }

  update(deltaSeconds) {
    this.y += this.speed * deltaSeconds;
    this.view.rotation += this.rotationSpeed * deltaSeconds;
  }

  getCollisionBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius,
    };
  }

  getBottom() {
    return this.y + this.radius;
  }
}

function createCapsuleView(radius, palette) {
  const coreWidth = radius * 1.6;
  const coreHeight = radius * 1.2;

  return new Graphics()
    .roundRect(-coreWidth * 0.5, -coreHeight * 0.5 + 3, coreWidth, coreHeight, radius * 0.55)
    .fill({ color: 0x0a1022, alpha: 0.24 })
    .circle(0, 0, radius)
    .fill({ color: palette.fill, alpha: 0.95 })
    .circle(0, 0, radius)
    .stroke({ width: 2, color: palette.accent, alpha: 0.95 })
    .roundRect(-coreWidth * 0.5, -coreHeight * 0.5, coreWidth, coreHeight, radius * 0.55)
    .fill({ color: palette.accent, alpha: 0.75 })
    .roundRect(-coreWidth * 0.24, -coreHeight * 0.28, coreWidth * 0.48, coreHeight * 0.56, radius * 0.2)
    .fill({ color: palette.fill, alpha: 0.95 });
}
