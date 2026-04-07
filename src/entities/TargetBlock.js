import { Container, Graphics } from 'pixi.js';

const BLOCK_TYPE_CONFIGS = {
  standard: {
    colors: null,
    defaultHitPoints: 2,
  },
  stone: {
    colors: {
      fill: 0x4e6078,
      damagedFill: 0x36475d,
      outline: 0xc6ddff,
      accent: 0x91b8ff,
      crack: 0x131c29,
      shadow: 0x060b14,
      glow: 0x90b3ff,
    },
    defaultHitPoints: 4,
  },
  metal: {
    colors: {
      fill: 0x7186aa,
      damagedFill: 0x4b5d7a,
      outline: 0xf3fbff,
      accent: 0x9af3ff,
      crack: 0x102131,
      shadow: 0x040914,
      glow: 0x8ce7ff,
    },
    defaultHitPoints: 10,
  },
  explosive: {
    colors: {
      fill: 0x5e1427,
      damagedFill: 0x420d1b,
      outline: 0xffb78c,
      accent: 0xff6a5e,
      crack: 0x23040c,
      shadow: 0x140209,
      glow: 0xff6d66,
    },
    defaultHitPoints: 1,
  },
  laser: {
    colors: {
      fill: 0x24103c,
      damagedFill: 0x180929,
      outline: 0xffa8ff,
      accent: 0xff4bde,
      crack: 0x0b0413,
      shadow: 0x08020f,
      glow: 0xff52ea,
    },
    defaultHitPoints: 2,
  },
};

export class TargetBlock extends Container {
  constructor(config) {
    super();

    const x = config.x;
    const y = config.y;

    this.label = 'target-block';
    this.type = getBlockType(config.type);
    const typeConfig = BLOCK_TYPE_CONFIGS[this.type];

    this.size = {
      width: config.width,
      height: config.height,
    };
    this.explosionRadius = config.explosionRadius ?? Math.max(config.width * 1.3, 76);
    this.maxHitPoints = config.hitPoints ?? typeConfig.defaultHitPoints;
    this.hitPoints = this.maxHitPoints;
    this.isDestroyed = false;
    this.cornerRadius = config.cornerRadius;
    this.colors = resolveBlockColors(typeConfig.colors ?? config.colors);
    this.laserDirection = config.laserDirection ?? 'vertical';
    this.state = {
      hitPulse: 0,
      pendingHitFeedback: false,
    };
    this.view = new Graphics();

    this.position.set(x, y);
    this.addChild(this.view);
    this.redraw();
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

  takeHit() {
    this.hitPoints -= 1;
    this.state.hitPulse = 0.16;
    this.state.pendingHitFeedback = true;

    if (this.hitPoints <= 0) {
      this.isDestroyed = true;
      return true;
    }

    this.redraw();

    return false;
  }

  isExplosive() {
    return this.type === 'explosive';
  }

  isLaser() {
    return this.type === 'laser';
  }

  isMetal() {
    return this.type === 'metal';
  }

  getLaserDirection() {
    return this.laserDirection;
  }

  update(deltaSeconds) {
    if (this.state.hitPulse <= 0) {
      this.scale.set(1);
    } else {
      this.state.hitPulse = Math.max(0, this.state.hitPulse - deltaSeconds);

      const progress = this.state.hitPulse / 0.16;
      const pulse = 1 + progress * 0.08;

      this.scale.set(pulse, 1 - progress * 0.04);
    }
  }

  consumeHitFeedback() {
    if (!this.state.pendingHitFeedback) {
      return false;
    }

    this.state.pendingHitFeedback = false;

    return true;
  }

  redraw() {
    const left = -this.size.width * 0.5;
    const top = -this.size.height * 0.5;
    const damageRatio = 1 - this.hitPoints / this.maxHitPoints;
    const fill = this.hitPoints === this.maxHitPoints ? this.colors.fill : this.colors.damagedFill;
    const accentAlpha = this.hitPoints === this.maxHitPoints ? 0.75 : 0.95;
    const crackWidth = Math.max(2, this.size.width * 0.14);

    this.view
      .clear()
      .roundRect(left - 4, top - 4, this.size.width + 8, this.size.height + 8, this.cornerRadius + 4)
      .fill({ color: this.colors.glow, alpha: 0.13 + damageRatio * 0.08 })
      .roundRect(left, top + 3, this.size.width, this.size.height, this.cornerRadius)
      .fill({ color: this.colors.shadow, alpha: 0.22 })
      .roundRect(left, top, this.size.width, this.size.height, this.cornerRadius)
      .fill({ color: fill })
      .roundRect(left, top, this.size.width, this.size.height, this.cornerRadius)
      .stroke({ width: 2, color: this.colors.outline, alpha: 0.95 })
      .roundRect(left + 1, top + 1, this.size.width - 2, this.size.height - 2, this.cornerRadius - 1)
      .stroke({ width: 1, color: this.colors.glow, alpha: 0.32 })
      .roundRect(
        left + 2,
        top + 2,
        this.size.width - 4,
        Math.max(4, this.size.height * 0.3),
        Math.max(4, this.cornerRadius - 4),
      )
      .fill({ color: this.colors.accent, alpha: accentAlpha });

    this.view
      .roundRect(left + 8, top + this.size.height * 0.58, this.size.width - 16, 3, 2)
      .fill({ color: this.colors.outline, alpha: 0.34 });

    if (this.type === 'stone') {
      this.drawStoneDetail();
    }

    if (this.isMetal()) {
      this.drawMetalDetail();
    }

    if (this.isExplosive()) {
      this.view
        .roundRect(left + 8, top + 7, this.size.width - 16, this.size.height - 14, 6)
        .stroke({ width: 2, color: 0x2b070e, alpha: 0.92 })
        .moveTo(-8, -4)
        .lineTo(8, 10)
        .moveTo(8, -4)
        .lineTo(-8, 10)
        .stroke({ width: 3, color: 0x2b070e, alpha: 0.92 });
    }

    if (this.isLaser()) {
      this.drawLaserEmitter();
    }

    if (damageRatio > 0) {
      this.view
        .moveTo(left + this.size.width * 0.32, top + this.size.height * 0.2)
        .lineTo(left + this.size.width * 0.54, top + this.size.height * 0.56)
        .lineTo(left + this.size.width * 0.42, top + this.size.height * 0.72)
        .lineTo(left + this.size.width * 0.66, top + this.size.height * 0.92)
        .stroke({ width: crackWidth * 0.12, color: this.colors.crack, alpha: 0.9 });
    }
  }

  drawStoneDetail() {
    this.view
      .circle(-12, -2, 3.2)
      .fill({ color: 0xd6e6ff, alpha: 0.3 })
      .circle(14, 5, 2.5)
      .fill({ color: 0x253044, alpha: 0.5 })
      .circle(3, -5, 1.8)
      .fill({ color: 0xf4fbff, alpha: 0.24 });
  }

  drawMetalDetail() {
    const left = -this.size.width * 0.5;

    this.view
      .roundRect(left + 8, -5, this.size.width - 16, 10, 4)
      .fill({ color: 0xf2fbff, alpha: 0.22 })
      .moveTo(-10, -9)
      .lineTo(-10, 9)
      .moveTo(10, -9)
      .lineTo(10, 9)
      .stroke({ width: 2, color: 0x14324d, alpha: 0.72 })
      .circle(-18, 0, 2)
      .fill({ color: 0xeafcff, alpha: 0.9 })
      .circle(18, 0, 2)
      .fill({ color: 0xeafcff, alpha: 0.9 });
  }

  drawLaserEmitter() {
    const isVertical = this.getLaserDirection() === 'vertical';

    this.view
      .roundRect(-18, -10, 36, 20, 8)
      .fill({ color: this.colors.glow, alpha: 0.12 })
      .roundRect(-14, -6, 28, 12, 5)
      .fill({ color: 0x13061f, alpha: 0.9 })
      .roundRect(-10, -2.5, 20, 5, 2.5)
      .fill({ color: 0xff67e5, alpha: 0.9 });

    if (isVertical) {
      this.view
        .moveTo(0, -8)
        .lineTo(0, 8)
        .stroke({ width: 3, color: 0xffefff, alpha: 0.92 });
      return;
    }

    this.view
      .moveTo(-8, 0)
      .lineTo(8, 0)
      .stroke({ width: 3, color: 0xffefff, alpha: 0.92 });
  }
}

function getBlockType(type) {
  if (BLOCK_TYPE_CONFIGS[type]) {
    return type;
  }

  return 'standard';
}

function resolveBlockColors(colors) {
  return {
    ...colors,
    glow: colors.glow ?? colors.outline,
  };
}
