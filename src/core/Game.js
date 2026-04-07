import { createApp } from '../renderer/createApp.js';
import { resizeApp } from '../renderer/resize.js';
import { GameScene } from '../scenes/GameScene.js';

export class Game {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.app = null;
    this.scene = null;
    this.handleResize = () => {
      if (this.app) {
        resizeApp(this.app, this.rootElement);
      }
    };
  }

  async init() {
    this.app = await createApp();
    this.scene = new GameScene();
    this.app.stage.addChild(this.scene);
    this.rootElement.appendChild(this.app.canvas);
    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleResize);
    }
  }
}
