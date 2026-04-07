import { Container, Graphics, Text } from 'pixi.js';

export class UISystem {
  constructor() {
    this.root = new Container();
    this.root.label = 'ui-layer';

    this.levelBadge = new Graphics();
    this.levelText = new Text({
      text: '',
      style: {
        fill: 0xf3f6ff,
        fontFamily: 'Trebuchet MS',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1.2,
      },
    });
    this.helperText = new Text({
      text: '',
      style: {
        fill: 0x9fd9ff,
        fontFamily: 'Trebuchet MS',
        fontSize: 11,
        letterSpacing: 0.5,
      },
    });
    this.statusBackdrop = new Graphics();
    this.statusText = new Text({
      text: '',
      style: {
        fill: 0xf8fbff,
        fontFamily: 'Trebuchet MS',
        fontSize: 24,
        fontWeight: '700',
        align: 'center',
        letterSpacing: 1.8,
      },
      anchor: 0.5,
    });
    this.statusHintText = new Text({
      text: '',
      style: {
        fill: 0xaedfff,
        fontFamily: 'Trebuchet MS',
        fontSize: 13,
        align: 'center',
        letterSpacing: 0.7,
      },
      anchor: 0.5,
    });
    this.actionText = new Text({
      text: '',
      style: {
        fill: 0xffffff,
        fontFamily: 'Trebuchet MS',
        fontSize: 14,
        fontWeight: '700',
        align: 'center',
        letterSpacing: 1.4,
      },
      anchor: 0.5,
    });

    this.levelText.position.set(22, 16);
    this.helperText.anchor.set(1, 0);
    this.helperText.position.set(398, 20);
    this.statusText.position.set(210, 278);
    this.statusHintText.position.set(210, 316);
    this.actionText.position.set(210, 348);

    this.root.addChild(
      this.levelBadge,
      this.levelText,
      this.helperText,
      this.statusBackdrop,
      this.statusText,
      this.statusHintText,
      this.actionText,
    );

    this.drawLevelBadge();
    this.setState({
      canRestart: false,
      gameState: 'running',
      hasNextLevel: false,
      levelLabel: '',
    });
  }

  setLevel(levelIndex, totalLevels) {
    this.levelText.text = `Level ${levelIndex + 1}/${totalLevels}`;
  }

  setState({ gameState, hasNextLevel, canRestart, levelLabel }) {
    this.helperText.text = this.getHelperText(gameState, canRestart);

    if (gameState === 'start') {
      this.showStatus('Reverse Arkanoid', 'Break every block and survive the danger zone', 'Start Game');
      return;
    }

    if (gameState === 'level_intro') {
      this.showStatus(levelLabel, 'Press Enter, Space, click, or tap to begin', 'Start');
      return;
    }

    if (gameState === 'lost') {
      this.showStatus('Attempt Failed', 'The ball reached the danger zone', 'Restart');
      return;
    }

    if (gameState === 'won' && hasNextLevel) {
      this.showStatus('Level Clear', 'Loading next level...', 'Stand by');
      return;
    }

    if (gameState === 'completed') {
      this.showStatus('Victory', 'All levels cleared', 'Restart Run');
      return;
    }

    this.hideStatus();
  }

  drawLevelBadge() {
    this.levelBadge
      .clear()
      .roundRect(12, 10, 104, 30, 12)
      .fill({ color: 0x081224, alpha: 0.84 })
      .roundRect(12, 10, 104, 30, 12)
      .stroke({ width: 1, color: 0x51e6ff, alpha: 0.65 })
      .roundRect(18, 15, 92, 8, 5)
      .fill({ color: 0x63f4ff, alpha: 0.12 });
  }

  showStatus(title, hint, actionLabel) {
    this.statusBackdrop
      .clear()
      .roundRect(48, 226, 324, 146, 20)
      .fill({ color: 0x071122, alpha: 0.84 })
      .roundRect(48, 226, 324, 146, 20)
      .stroke({ width: 1, color: 0x62ecff, alpha: 0.44 })
      .roundRect(58, 236, 304, 126, 16)
      .stroke({ width: 1, color: 0xff62d3, alpha: 0.16 })
      .roundRect(126, 334, 168, 26, 13)
      .fill({ color: 0x13274c, alpha: 0.94 })
      .roundRect(126, 334, 168, 26, 13)
      .stroke({ width: 1, color: 0x7ff5ff, alpha: 0.52 });

    this.statusText.text = title;
    this.statusHintText.text = hint;
    this.actionText.text = actionLabel;
    this.statusBackdrop.visible = true;
    this.statusText.visible = true;
    this.statusHintText.visible = true;
    this.actionText.visible = true;
  }

  hideStatus() {
    this.statusBackdrop.visible = false;
    this.statusText.visible = false;
    this.statusHintText.visible = false;
    this.actionText.visible = false;
  }

  getHelperText(gameState, canRestart) {
    if (gameState === 'start') {
      return 'Press Enter, Space, click, or tap';
    }

    if (gameState === 'level_intro') {
      return 'Level ready';
    }

    if (canRestart) {
      return 'R / Space / Enter / Tap to retry';
    }

    return 'Drag the paddle to redirect the ball';
  }
}
