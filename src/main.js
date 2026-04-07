import { Game } from './core/Game.js';

document.body.style.margin = '0';
document.body.style.width = '100vw';
document.body.style.height = '100vh';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';
document.body.style.overscrollBehavior = 'none';

const game = new Game(document.body);

game.init().catch((error) => {
  console.error('Failed to initialize game', error);
});
