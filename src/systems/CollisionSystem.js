import { getBallBlockCollision } from '../utils/collision.js';

const SPECIAL_BOUNCE_CONFIG = {
  explosive: {
    angleOffset: 0.22,
    speedMultiplier: 1.12,
  },
  laser: {
    angleOffset: 0.3,
    speedMultiplier: 1.18,
  },
  metal: {
    angleOffset: 0.18,
    speedMultiplier: 1.1,
  },
  stone: {
    angleOffset: 0.14,
    speedMultiplier: 1.06,
  },
};

export class CollisionSystem {
  resolveBallVsDraggableBlocks(ball, blocks) {
    if (!ball.isActive) {
      return false;
    }

    for (const block of blocks) {
      const collision = getBallBlockCollision(ball, block);

      if (!collision) {
        continue;
      }

      ball.setPosition(collision.position.x, collision.position.y);
      ball.reflect(collision.normal);
      return true;
    }

    return false;
  }

  resolveBallVsTargetBlocks(ball, blocks) {
    if (!ball.isActive) {
      return null;
    }

    for (const block of blocks) {
      const collision = getBallBlockCollision(ball, block);

      if (!collision) {
        continue;
      }

      ball.setPosition(collision.position.x, collision.position.y);
      ball.reflect(collision.normal);
      this.applySpecialBlockBounce(ball, block, collision.normal);

      return {
        destroyedBlock: block.takeHit() ? block : null,
      };
    }

    return null;
  }

  applySpecialBlockBounce(ball, block, normal) {
    const specialConfig = SPECIAL_BOUNCE_CONFIG[block.type];

    if (!specialConfig) {
      return;
    }

    const currentDirection = ball.getDirection();
    const currentSpeed = ball.getSpeed();
    const sideX = Math.sign(ball.x - block.x) || Math.sign(currentDirection.x) || 1;
    const sideY = Math.sign(ball.y - block.y) || Math.sign(currentDirection.y) || -1;
    const adjustedDirection = normal.y !== 0
      ? normalizeDirection({
        x: currentDirection.x + sideX * specialConfig.angleOffset,
        y: currentDirection.y,
      })
      : normalizeDirection({
        x: currentDirection.x,
        y: currentDirection.y + sideY * specialConfig.angleOffset * 0.8,
      });

    ball.redirect(adjustedDirection, Math.min(currentSpeed * specialConfig.speedMultiplier, 520));
  }
}

function normalizeDirection(direction) {
  const length = Math.hypot(direction.x, direction.y) || 1;

  return {
    x: direction.x / length,
    y: direction.y / length,
  };
}
