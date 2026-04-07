import { Container, Graphics } from 'pixi.js';

export class Ball extends Container {
  constructor(config) {
    super();

    const startX = config.x ?? config.startX;
    const startY = config.y ?? config.startY;

    this.label = 'ball';
    this.radius = config.radius;
    this.fill = config.fill;
    this.outline = config.outline;
    this.shine = config.shine;
    this.isActive = true;
    this.state = {
      baseSpeed: config.speed,
      hitPulse: 0,
      fireballPhase: 0,
      fireballEnabled: false,
      previousPosition: {
        x: startX,
        y: startY,
      },
      speedMultiplier: 1,
      trailPoints: Array.from({ length: 4 }, () => ({ x: startX, y: startY })),
      trailTick: 0,
      velocity: createVelocity(config.direction, config.speed),
    };

    this.position.set(startX, startY);
    this.trail = createTrail(config);
    this.fireAura = createFireAura(config);
    this.view = createBallView(config);
    this.fireAura.visible = false;
    this.addChild(this.trail, this.fireAura, this.view);
  }

  update(deltaSeconds, bounds) {
    if (!this.isActive) {
      return;
    }

    this.state.previousPosition.x = this.x;
    this.state.previousPosition.y = this.y;

    this.x += this.state.velocity.x * deltaSeconds;
    this.y += this.state.velocity.y * deltaSeconds;

    if (this.x < bounds.left) {
      this.x = bounds.left;
      this.state.velocity.x *= -1;
    } else if (this.x > bounds.right) {
      this.x = bounds.right;
      this.state.velocity.x *= -1;
    }

    if (this.y < bounds.top) {
      this.y = bounds.top;
      this.state.velocity.y *= -1;
    }
  }

  animate(deltaSeconds) {
    this.updateTrail(deltaSeconds);

    if (this.state.hitPulse > 0) {
      this.state.hitPulse = Math.max(0, this.state.hitPulse - deltaSeconds);
    }

    const pulseProgress = this.state.hitPulse > 0 ? this.state.hitPulse / 0.12 : 0;
    const stretchX = 1 + pulseProgress * 0.16;
    const stretchY = 1 - pulseProgress * 0.12;

    this.view.scale.set(stretchX, stretchY);

    if (!this.state.fireballEnabled) {
      return;
    }

    this.state.fireballPhase += deltaSeconds * 8;

    const flare = this.fireAura;
    const shimmer = 0.82 + Math.sin(this.state.fireballPhase) * 0.18;

    flare.visible = true;
    flare.alpha = shimmer;
    flare.scale.set(1.05 + shimmer * 0.18);
    flare.rotation += deltaSeconds * 1.8;
  }

  stop() {
    this.isActive = false;
    this.state.velocity.x = 0;
    this.state.velocity.y = 0;
  }

  snapTo(x, y) {
    this.position.set(x, y);
    this.state.previousPosition.x = x;
    this.state.previousPosition.y = y;
    this.state.trailPoints = this.state.trailPoints.map(() => ({ x, y }));
  }

  setPosition(x, y) {
    this.position.set(x, y);
  }

  getVelocity() {
    return this.state.velocity;
  }

  getSpeed() {
    return Math.hypot(this.state.velocity.x, this.state.velocity.y);
  }

  setSpeedMultiplier(multiplier) {
    const direction = this.getDirection();
    const clampedMultiplier = Math.max(0.1, multiplier);

    this.state.speedMultiplier = clampedMultiplier;
    this.state.velocity.x = direction.x * this.state.baseSpeed * clampedMultiplier;
    this.state.velocity.y = direction.y * this.state.baseSpeed * clampedMultiplier;
  }

  setFireballEnabled(isEnabled) {
    this.state.fireballEnabled = isEnabled;
    this.fireAura.visible = isEnabled;

    if (!isEnabled) {
      this.fireAura.alpha = 0;
      this.fireAura.scale.set(1);
    }
  }

  isFireballEnabled() {
    return this.state.fireballEnabled;
  }

  getDirection() {
    const speed = this.getSpeed() || 1;

    return {
      x: this.state.velocity.x / speed,
      y: this.state.velocity.y / speed,
    };
  }

  redirect(direction, speed = this.getSpeed() || this.state.baseSpeed) {
    const normalizedDirection = normalizeDirection(direction);

    this.state.velocity.x = normalizedDirection.x * speed;
    this.state.velocity.y = normalizedDirection.y * speed;
  }

  createSplitConfig(direction, offsetX = 0) {
    return {
      x: this.x + offsetX,
      y: this.y,
      radius: this.radius,
      speed: this.state.baseSpeed,
      direction,
      fill: this.fill,
      outline: this.outline,
      shine: this.shine,
    };
  }

  getPreviousPosition() {
    return this.state.previousPosition;
  }

  reflect(normal) {
    const dot = this.state.velocity.x * normal.x + this.state.velocity.y * normal.y;

    if (dot >= 0) {
      return;
    }

    this.state.velocity.x -= 2 * dot * normal.x;
    this.state.velocity.y -= 2 * dot * normal.y;
    this.state.hitPulse = 0.12;
  }

  getBottom() {
    return this.y + this.radius;
  }

  updateTrail(deltaSeconds) {
    this.state.trailTick += deltaSeconds;

    if (this.state.trailTick >= 0.02) {
      this.state.trailTick = 0;
      this.state.trailPoints.pop();
      this.state.trailPoints.unshift({ x: this.x, y: this.y });
    }

    this.trail.children.forEach((ghost, index) => {
      const point = this.state.trailPoints[index];
      const progress = 1 - index / this.trail.children.length;

      ghost.position.set(point.x - this.x, point.y - this.y);
      ghost.scale.set(0.5 + progress * 0.35);
      ghost.alpha = this.isActive ? 0.08 + progress * 0.12 : 0;
    });
  }
}

function createVelocity(direction, speed) {
  const normalizedDirection = normalizeDirection(direction);

  return {
    x: normalizedDirection.x * speed,
    y: normalizedDirection.y * speed,
  };
}

function normalizeDirection(direction) {
  const length = Math.hypot(direction.x, direction.y) || 1;

  return {
    x: direction.x / length,
    y: direction.y / length,
  };
}

function createBallView(config) {
  const highlightOffset = config.radius * 0.36;
  const highlightRadius = config.radius * 0.34;

  return new Graphics()
    .circle(0, 0, config.radius * 1.54)
    .fill({ color: config.outline, alpha: 0.12 })
    .circle(0, 0, config.radius * 1.2)
    .fill({ color: config.shine, alpha: 0.08 })
    .circle(0, 0, config.radius)
    .fill({ color: config.fill })
    .circle(0, 0, config.radius)
    .stroke({ width: 2, color: config.outline, alpha: 0.95 })
    .circle(0, 0, config.radius * 0.72)
    .fill({ color: config.shine, alpha: 0.16 })
    .circle(-highlightOffset, -highlightOffset, highlightRadius)
    .fill({ color: config.shine, alpha: 0.62 })
    .circle(config.radius * 0.24, config.radius * 0.3, config.radius * 0.14)
    .fill({ color: config.outline, alpha: 0.45 });
}

function createTrail(config) {
  const trail = new Container();

  for (let index = 0; index < 4; index += 1) {
    const ghost = new Graphics()
      .circle(0, 0, config.radius * 0.84)
      .fill({ color: config.outline, alpha: 0.18 })
      .circle(0, 0, config.radius * 0.42)
      .fill({ color: config.shine, alpha: 0.12 });

    trail.addChild(ghost);
  }

  return trail;
}

function createFireAura(config) {
  return new Graphics()
    .circle(0, 0, config.radius * 1.7)
    .fill({ color: 0xff6a3d, alpha: 0.16 })
    .circle(0, 0, config.radius * 1.42)
    .fill({ color: 0xff9345, alpha: 0.2 })
    .circle(0, 0, config.radius * 1.08)
    .fill({ color: 0xffef9a, alpha: 0.18 })
    .star(0, 0, 8, config.radius * 1.6, config.radius * 0.92)
    .fill({ color: 0xffc66d, alpha: 0.14 });
}
