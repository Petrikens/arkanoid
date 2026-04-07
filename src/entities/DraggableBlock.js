import { Container, Graphics } from 'pixi.js';

export class DraggableBlock extends Container {
  constructor(config) {
    super();

    const startX = config.x ?? config.startX;
    const startY = config.y ?? config.startY;

    this.label = 'draggable-block';
    this.size = {
      width: config.width,
      height: config.height,
    };
    this.dragScale = config.dragScale;

    this.state = {
      controlsReversed: false,
      isDragging: false,
      gunEnabled: false,
      widthScale: 1,
    };

    this.controlBounds = null;
    this.eventMode = 'none';
    this.position.set(startX, startY);
    this.view = createBlockView(config);
    this.gunMounts = createGunMounts(config);
    this.gunMounts.visible = false;
    this.addChild(this.view, this.gunMounts);
  }

  moveTo(x, y) {
    let nextX = x;

    if (this.state.controlsReversed && this.controlBounds) {
      nextX = this.controlBounds.left + this.controlBounds.right - x;
    }

    this.position.set(nextX, y);
  }

  moveActualTo(x, y) {
    this.position.set(x, y);
  }

  setDragging(isDragging) {
    this.state.isDragging = isDragging;
    this.scale.set(isDragging ? this.dragScale : 1);
  }

  setGunEnabled(isEnabled) {
    this.state.gunEnabled = isEnabled;
    this.gunMounts.visible = isEnabled;
  }

  setControlBounds(bounds) {
    this.controlBounds = bounds;
  }

  setControlsReversed(isReversed) {
    this.state.controlsReversed = isReversed;
  }

  setWidthScale(scale) {
    this.state.widthScale = scale;
    this.view.scale.x = scale;
    this.gunMounts.scale.x = scale;
  }

  getCurrentWidth() {
    return this.size.width * this.state.widthScale;
  }

  update(deltaSeconds) {
    if (!this.state.isDragging) {
      return;
    }

    const wobble = Math.sin(performance.now() * 0.02) * 0.015;

    this.scale.set(this.dragScale + wobble, this.dragScale - wobble * 0.6);
  }

  getCollisionBounds() {
    const halfWidth = (this.size.width * this.state.widthScale * Math.abs(this.scale.x)) * 0.5;
    const halfHeight = (this.size.height * Math.abs(this.scale.y)) * 0.5;

    return {
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight,
    };
  }
}

function createBlockView(config) {
  const innerInset = 2;
  const accentHeight = Math.max(4, config.height * 0.28);
  const left = -config.width * 0.5;
  const top = -config.height * 0.5;

  return new Graphics()
    .roundRect(left - 5, top - 5, config.width + 10, config.height + 10, config.cornerRadius + 5)
    .fill({ color: config.accent, alpha: 0.12 })
    .roundRect(left, top + 4, config.width, config.height, config.cornerRadius)
    .fill({ color: config.shadow, alpha: 0.28 })
    .roundRect(left, top, config.width, config.height, config.cornerRadius)
    .fill({ color: config.fill })
    .roundRect(left, top, config.width, config.height, config.cornerRadius)
    .stroke({ width: 2, color: config.outline, alpha: 0.95 })
    .roundRect(left + 1, top + 1, config.width - 2, config.height - 2, config.cornerRadius - 1)
    .stroke({ width: 1, color: config.accent, alpha: 0.42 })
    .roundRect(
      left + innerInset,
      top + innerInset,
      config.width - innerInset * 2,
      accentHeight,
      Math.max(4, config.cornerRadius - 4),
    )
    .fill({ color: config.accent, alpha: 0.7 })
    .roundRect(left + 10, top + config.height * 0.56, config.width - 20, 3, 2)
    .fill({ color: config.outline, alpha: 0.45 });
}

function createGunMounts(config) {
  const mounts = new Container();
  const barrelOffsetX = Math.max(18, config.width * 0.28);
  const baseY = -config.height * 0.5 + 1;

  for (const direction of [-1, 1]) {
    const mount = new Graphics()
      .roundRect(-6, -6, 12, 8, 3)
      .fill({ color: 0x0d2038, alpha: 0.95 })
      .roundRect(-3, -18, 6, 16, 3)
      .fill({ color: 0xaaf7ff, alpha: 0.95 })
      .roundRect(-2, -20, 4, 6, 2)
      .fill({ color: 0x42efff, alpha: 0.95 })
      .roundRect(-8, -8, 16, 12, 4)
      .stroke({ width: 1, color: 0x7af1ff, alpha: 0.42 });

    mount.position.set(direction * barrelOffsetX, baseY);
    mounts.addChild(mount);
  }

  return mounts;
}
