import { GAME_CONFIG } from '../core/Config.js';

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

export function resizeApp(app, rootElement) {
  const viewport = getViewportSize();
  const scale = Math.min(
    viewport.width / GAME_CONFIG.width,
    viewport.height / GAME_CONFIG.height,
  );

  const canvasWidth = Math.round(GAME_CONFIG.width * scale);
  const canvasHeight = Math.round(GAME_CONFIG.height * scale);
  const offsetX = Math.floor((viewport.width - canvasWidth) / 2);
  const offsetY = Math.floor((viewport.height - canvasHeight) / 2);

  rootElement.style.position = 'relative';
  rootElement.style.backgroundColor = '#060812';
  rootElement.style.touchAction = 'none';
  rootElement.style.userSelect = 'none';
  rootElement.style.webkitUserSelect = 'none';
  rootElement.style.overscrollBehavior = 'none';

  app.canvas.style.position = 'absolute';
  app.canvas.style.width = `${canvasWidth}px`;
  app.canvas.style.height = `${canvasHeight}px`;
  app.canvas.style.left = `${offsetX}px`;
  app.canvas.style.top = `${offsetY}px`;
}
