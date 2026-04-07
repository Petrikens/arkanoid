import { SCENE_CONSTANTS } from '../core/Constants.js';

export class LevelSystem {
  constructor(levels) {
    this.levels = levels;
  }

  isLastLevel(levelIndex) {
    return this.getNextLevelIndex(levelIndex) === null;
  }

  restartLevel(levelIndex = 0) {
    return this.loadLevel(levelIndex);
  }

  getLevelCount() {
    return this.levels.length;
  }

  hasLevel(levelIndex) {
    return levelIndex >= 0 && levelIndex < this.levels.length;
  }

  getNextLevelIndex(levelIndex) {
    const nextLevelIndex = levelIndex + 1;

    return this.hasLevel(nextLevelIndex) ? nextLevelIndex : null;
  }

  loadLevel(levelIndex = 0) {
    const level = this.levels[levelIndex];

    if (!level) {
      throw new Error(`Level not found: ${levelIndex}`);
    }

    const targetBlocks = typeof level.targetBlocks === 'function'
      ? level.targetBlocks()
      : level.targetBlocks;

    return {
      id: level.id,
      index: levelIndex,
      ball: this.createBallConfig(level.ball),
      draggableBlocks: level.draggableBlocks.map((block) =>
        this.createDraggableBlockConfig(block, levelIndex),
      ),
      targetBlocks: targetBlocks.map((block) => this.createTargetBlockConfig(block)),
    };
  }

  createBallConfig(ball = {}) {
    return {
      ...SCENE_CONSTANTS.ball,
      startX: ball.x ?? SCENE_CONSTANTS.ball.startX,
      startY: ball.y ?? SCENE_CONSTANTS.ball.startY,
      direction: ball.direction ?? SCENE_CONSTANTS.ball.direction,
      speed: ball.speed ?? SCENE_CONSTANTS.ball.speed,
    };
  }

  createDraggableBlockConfig(block = {}, levelIndex = 0) {
    return {
      ...SCENE_CONSTANTS.draggableBlock,
      width: this.getPrimaryPlatformWidth(levelIndex),
      startX: block.x ?? SCENE_CONSTANTS.draggableBlock.startX,
      startY: block.y ?? SCENE_CONSTANTS.draggableBlock.startY,
    };
  }

  getPrimaryPlatformWidth(levelIndex) {
    const { width, widthDecreasePerLevel, minWidth } = SCENE_CONSTANTS.draggableBlock;

    return Math.max(minWidth, width - levelIndex * widthDecreasePerLevel);
  }

  createTargetBlockConfig(block = {}) {
    return {
      ...SCENE_CONSTANTS.targetBlock,
      x: block.x,
      y: block.y,
      type: block.type ?? 'standard',
      explosionRadius: block.explosionRadius,
      laserDirection: block.laserDirection,
      hitPoints: block.hitPoints,
    };
  }
}
