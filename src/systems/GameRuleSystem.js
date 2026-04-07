import { SCENE_CONSTANTS } from '../core/Constants.js';

export class GameRuleSystem {
  constructor() {
    this.state = SCENE_CONSTANTS.gameState.running;
  }

  isRunning() {
    return this.state === SCENE_CONSTANTS.gameState.running;
  }

  canRestartLevel() {
    return this.state === SCENE_CONSTANTS.gameState.lost;
  }

  reset() {
    this.state = SCENE_CONSTANTS.gameState.running;
  }

  update(balls, targetBlocks) {
    if (this.state !== SCENE_CONSTANTS.gameState.running) {
      return this.state;
    }

    if (targetBlocks.length === 0) {
      this.state = SCENE_CONSTANTS.gameState.won;
      return this.state;
    }

    if (getActiveBallCount(balls) === 0) {
      this.state = SCENE_CONSTANTS.gameState.lost;
    }

    return this.state;
  }
}

function getActiveBallCount(balls) {
  if (Array.isArray(balls)) {
    return balls.filter((ball) => ball?.isActive).length;
  }

  return balls?.isActive ? 1 : 0;
}
