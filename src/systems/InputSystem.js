import { GAME_CONFIG } from '../core/Config.js';
import { clamp } from '../utils/math.js';

export class InputSystem {
  constructor() {
    this.controlledBlock = null;
    this.moveBounds = null;
    this.fixedY = 0;
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);

    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
  }

  registerDraggableBlock(block, dragBounds) {
    this.controlledBlock = block;
    this.moveBounds = dragBounds;
    this.fixedY = block.y;
  }

  clearActiveDrag() {
    this.controlledBlock = null;
    this.moveBounds = null;
  }

  destroy() {
    this.clearActiveDrag();
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
  }

  handlePointerDown(event) {
    this.moveControlledBlock(event);
  }

  handlePointerMove(event) {
    this.moveControlledBlock(event);
  }

  moveControlledBlock(event) {
    if (!this.controlledBlock || !this.moveBounds) {
      return;
    }

    if (event.pointerType !== 'mouse' && event.cancelable) {
      event.preventDefault();
    }

    const pointerPosition = this.getPointerPosition(event);
    const nextX = clamp(pointerPosition.x, this.moveBounds.left, this.moveBounds.right);

    this.controlledBlock.moveTo(nextX, this.fixedY);
  }

  getPointerPosition(event) {
    const viewport = getViewportSize();
    const scale = Math.min(
      viewport.width / GAME_CONFIG.width,
      viewport.height / GAME_CONFIG.height,
    );
    const canvasWidth = Math.round(GAME_CONFIG.width * scale);
    const canvasHeight = Math.round(GAME_CONFIG.height * scale);
    const offsetX = Math.floor((viewport.width - canvasWidth) / 2);
    const offsetY = Math.floor((viewport.height - canvasHeight) / 2);

    return {
      x: (event.clientX - offsetX) / scale,
      y: (event.clientY - offsetY) / scale,
    };
  }
}

function getViewportSize() {
  if (window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
