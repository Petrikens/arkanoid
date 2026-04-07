import { Application } from 'pixi.js';
import { GAME_CONFIG } from '../core/Config.js';

export async function createApp() {
  const app = new Application();

  await app.init({
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    background: GAME_CONFIG.appBackground,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });

  app.canvas.style.touchAction = 'none';
  app.canvas.style.userSelect = 'none';
  app.canvas.style.webkitUserSelect = 'none';
  app.canvas.style.webkitTapHighlightColor = 'transparent';

  return app;
}
