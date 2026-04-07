import { Container, Graphics } from 'pixi.js';

export class EffectsSystem {
  constructor() {
    this.root = new Container();
    this.root.label = 'effects-layer';
    this.effects = [];
  }

  clear() {
    this.effects = [];
    this.root.removeChildren().forEach((child) => child.destroy());
  }

  update(deltaSeconds) {
    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index];

      effect.life -= deltaSeconds;
      effect.update(effect, deltaSeconds);

      if (effect.life > 0) {
        continue;
      }

      this.root.removeChild(effect.view);
      effect.view.destroy();
      this.effects.splice(index, 1);
    }
  }

  emitImpact(x, y, color = 0xd9e6ff) {
    const view = new Container();
    const ring = new Graphics();
    const flash = new Graphics()
      .circle(0, 0, 8)
      .fill({ color, alpha: 0.2 });

    ring.circle(0, 0, 12).stroke({ width: 2, color, alpha: 0.95 });
    view.position.set(x, y);
    view.addChild(flash, ring);
    this.root.addChild(view);
    this.effects.push({
      life: 0.16,
      duration: 0.16,
      view,
      update: (effect) => {
        const progress = 1 - effect.life / effect.duration;
        const ringScale = 1 + progress * 0.85;
        const flashScale = 1 + progress * 0.5;

        ring.scale.set(ringScale);
        ring.alpha = 1 - progress;
        flash.scale.set(flashScale);
        flash.alpha = (1 - progress) * 0.7;
      },
    });
  }

  emitDestroy(x, y, color = 0xffd36f) {
    const view = new Container();
    const burst = new Graphics()
      .circle(0, 0, 10)
      .fill({ color, alpha: 0.18 });
    const shards = Array.from({ length: 5 }, (_, index) => {
      const angle = (-0.8 + index * 0.4) * Math.PI;
      const shard = new Graphics()
        .roundRect(-3, -2, 6, 4, 2)
        .fill({ color, alpha: 0.92 });

      shard.rotation = angle;
      shard.userData = {
        velocityX: Math.cos(angle) * (42 + index * 9),
        velocityY: Math.sin(angle) * (42 + index * 9) - 18,
      };

      view.addChild(shard);

      return shard;
    });

    view.position.set(x, y);
    view.addChildAt(burst, 0);
    this.root.addChild(view);
    this.effects.push({
      life: 0.28,
      duration: 0.28,
      view,
      update: (effect, deltaSeconds) => {
        const progress = 1 - effect.life / effect.duration;

        burst.scale.set(1 + progress * 1.2);
        burst.alpha = (1 - progress) * 0.8;
        view.alpha = 1 - progress * 0.35;

        for (const shard of shards) {
          shard.x += shard.userData.velocityX * deltaSeconds;
          shard.y += shard.userData.velocityY * deltaSeconds;
          shard.userData.velocityY += 220 * deltaSeconds;
          shard.alpha = 1 - progress;
          shard.scale.set(1 - progress * 0.35);
        }
      },
    });
  }

  emitExplosion(x, y, color = 0xff8f5b) {
    const view = new Container();
    const shockwave = new Graphics()
      .circle(0, 0, 14)
      .stroke({ width: 3, color, alpha: 0.95 });
    const core = new Graphics()
      .circle(0, 0, 16)
      .fill({ color, alpha: 0.2 });
    const sparks = Array.from({ length: 8 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 8;
      const spark = new Graphics()
        .roundRect(-2, -8, 4, 16, 2)
        .fill({ color: 0xffe3b0, alpha: 0.95 });

      spark.rotation = angle;
      spark.userData = {
        velocityX: Math.cos(angle) * 110,
        velocityY: Math.sin(angle) * 110,
      };

      view.addChild(spark);

      return spark;
    });

    view.position.set(x, y);
    view.addChildAt(core, 0);
    view.addChildAt(shockwave, 1);
    this.root.addChild(view);
    this.effects.push({
      life: 0.24,
      duration: 0.24,
      view,
      update: (effect, deltaSeconds) => {
        const progress = 1 - effect.life / effect.duration;

        core.scale.set(1 + progress * 1.6);
        core.alpha = (1 - progress) * 0.75;
        shockwave.scale.set(1 + progress * 1.25);
        shockwave.alpha = 1 - progress;

        for (const spark of sparks) {
          spark.x += spark.userData.velocityX * deltaSeconds;
          spark.y += spark.userData.velocityY * deltaSeconds;
          spark.alpha = 1 - progress;
          spark.scale.set(1 - progress * 0.4, 1 + progress * 0.25);
        }
      },
    });
  }

  emitPickup(x, y, color = 0x7de3ff) {
    const view = new Container();
    const ring = new Graphics()
      .circle(0, 0, 10)
      .stroke({ width: 2, color, alpha: 0.9 });
    const flash = new Graphics()
      .circle(0, 0, 6)
      .fill({ color, alpha: 0.32 });

    view.position.set(x, y);
    view.addChild(flash, ring);
    this.root.addChild(view);
    this.effects.push({
      life: 0.22,
      duration: 0.22,
      view,
      update: (effect) => {
        const progress = 1 - effect.life / effect.duration;

        ring.scale.set(1 + progress * 1.4);
        ring.alpha = 1 - progress;
        flash.scale.set(1 + progress * 0.75);
        flash.alpha = (1 - progress) * 0.85;
      },
    });
  }

  emitShot(x, y, color = 0xffb86b) {
    const view = new Container();
    const flash = new Graphics()
      .circle(0, 0, 5)
      .fill({ color, alpha: 0.3 });
    const streak = new Graphics()
      .roundRect(-2, -12, 4, 16, 2)
      .fill({ color, alpha: 0.92 });

    view.position.set(x, y);
    view.addChild(flash, streak);
    this.root.addChild(view);
    this.effects.push({
      life: 0.1,
      duration: 0.1,
      view,
      update: (effect) => {
        const progress = 1 - effect.life / effect.duration;

        flash.scale.set(1 + progress);
        flash.alpha = (1 - progress) * 0.75;
        streak.alpha = 1 - progress;
        streak.scale.set(1, 1 + progress * 0.4);
      },
    });
  }
}
