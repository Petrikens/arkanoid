import { Container, Graphics, Text } from 'pixi.js';
import { GAME_CONFIG } from '../core/Config.js';
import { SCENE_CONSTANTS } from '../core/Constants.js';
import { LEVELS } from '../data/levels.js';
import { getBallBlockCollision } from '../utils/collision.js';
import { clamp } from '../utils/math.js';
import { Ball } from '../entities/Ball.js';
import { DraggableBlock } from '../entities/DraggableBlock.js';
import { PowerUpCapsule } from '../entities/PowerUpCapsule.js';
import { Projectile } from '../entities/Projectile.js';
import { TargetBlock } from '../entities/TargetBlock.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { GameRuleSystem } from '../systems/GameRuleSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { UISystem } from '../systems/UISystem.js';
import { createSceneLayers } from '../renderer/layers.js';

const POWER_UP_TYPES = [
  'multiball',
  'gun',
  'fireball',
  'fireball',
  'fireball',
  'block_spawn',
  'paddle_expand',
  'paddle_shrink',
  'ball_speed_up',
];
const POWER_UP_DROP_CHANCE = 0.65;
const MAX_BALLS = 3;
const BLOCK_SPAWN_COUNT = 3;
const GUN_VOLLEYS = 10;
const GUN_FIRE_INTERVAL = 0.35;
const FIREBALL_DURATION = 9;
const BALL_SPEED_UP_DURATION = 8;
const BALL_SPEED_UP_MULTIPLIER = 1.32;
const PADDLE_MODIFIER_DURATION = 10;
const PADDLE_EXPAND_SCALE = 1.35;
const PADDLE_SHRINK_SCALE = 0.76;
const RANDOM_EVENT_INTERVAL_MIN = 14;
const RANDOM_EVENT_INTERVAL_MAX = 24;
const RANDOM_EVENT_REVERSE_DURATION = 4.5;
const RANDOM_EVENT_SPEED_DURATION = 5;
const RANDOM_EVENT_SPEED_MULTIPLIER = 1.18;
const RANDOM_EVENT_MIRROR_DURATION = 4.5;

export class GameScene extends Container {
  constructor() {
    super();

    this.label = 'game-scene';
    this.layers = createSceneLayers();
    this.entityLayer = new Container();
    this.entityLayer.label = 'entities-layer';
    this.blockLayer = new Container();
    this.blockLayer.label = 'block-layer';
    this.targetLayer = new Container();
    this.targetLayer.label = 'target-layer';
    this.ballLayer = new Container();
    this.ballLayer.label = 'ball-layer';
    this.projectileLayer = new Container();
    this.projectileLayer.label = 'projectile-layer';
    this.powerUpLayer = new Container();
    this.powerUpLayer.label = 'power-up-layer';
    this.effectsSystem = new EffectsSystem();
    this.uiSystem = new UISystem();
    this.eventOverlay = createEventOverlay();
    this.ball = null;
    this.balls = [];
    this.draggableBlocks = [];
    this.targetBlocks = [];
    this.projectiles = [];
    this.powerUps = [];
    this.levelSystem = new LevelSystem(LEVELS);
    this.currentLevelIndex = 0;
    this.currentLevelId = null;
    this.collisionSystem = new CollisionSystem();
    this.inputSystem = new InputSystem();
    this.ruleSystem = new GameRuleSystem();
    this.gameState = SCENE_CONSTANTS.gameState.start;
    this.pendingLevelIndex = null;
    this.levelAdvanceAt = 0;
    this.levelAdvanceDelayMs = 700;
    this.gunMode = {
      volleysRemaining: 0,
      fireCooldown: 0,
    };
    this.powerUpState = {
      fireballTimeLeft: 0,
      paddleScaleTimeLeft: 0,
      paddleScaleValue: 1,
      speedUpTimeLeft: 0,
    };
    this.randomEventState = {
      bannerColor: 0x7de3ff,
      bannerText: '',
      bannerTimeLeft: 0,
      mirrorTimeLeft: 0,
      nextTriggerIn: getRandomRange(RANDOM_EVENT_INTERVAL_MIN, RANDOM_EVENT_INTERVAL_MAX),
      reverseControlsTimeLeft: 0,
      speedUpTimeLeft: 0,
    };
    this.lastFrameTime = performance.now();
    this.handleActionInput = this.handleActionInput.bind(this);

    this.addChild(this.layers.root);
    this.layers.root.addChildAt(this.entityLayer, 1);
    this.entityLayer.addChild(
      this.targetLayer,
      this.blockLayer,
      this.projectileLayer,
      this.powerUpLayer,
      this.ballLayer,
      this.effectsSystem.root,
    );
    this.addChild(this.uiSystem.root, this.eventOverlay.root);
    this.drawBackground();
    this.drawBoundaries();
    this.drawDangerZone();
    this.setWorldMirrored(false);
    this.loadLevel(0);
    this.enterStartScreen();
    window.addEventListener('keydown', this.handleActionInput);
    window.addEventListener('pointerdown', this.handleActionInput);

    this.onRender = () => {
      const now = performance.now();
      const deltaSeconds = Math.min((now - this.lastFrameTime) / 1000, 1 / 20);

      this.lastFrameTime = now;
      this.update(deltaSeconds);
    };
  }

  loadLevel(levelIndex) {
    const levelConfig = this.levelSystem.loadLevel(levelIndex);

    this.currentLevelIndex = levelConfig.index;
    this.applyLevel(levelConfig);
  }

  restartCurrentLevel() {
    const levelConfig = this.levelSystem.restartLevel(this.currentLevelIndex);

    this.applyLevel(levelConfig);
  }

  applyLevel(levelConfig) {
    this.currentLevelId = levelConfig.id;
    this.resetLevelState();
    this.createTargetBlocks(levelConfig.targetBlocks);
    this.createDraggableBlocks(levelConfig.draggableBlocks);
    this.createBall(levelConfig.ball);
    this.mountBallOnPlatform();
    this.syncUI();
    this.lastFrameTime = performance.now();
  }

  resetLevelState() {
    this.inputSystem.clearActiveDrag();

    this.pendingLevelIndex = null;
    this.levelAdvanceAt = 0;
    this.gameState = SCENE_CONSTANTS.gameState.levelIntro;
    this.ruleSystem.reset();
    this.ball = null;
    this.balls = [];
    this.draggableBlocks = [];
    this.targetBlocks = [];
    this.projectiles = [];
    this.powerUps = [];
    this.gunMode.volleysRemaining = 0;
    this.gunMode.fireCooldown = 0;
    this.powerUpState.fireballTimeLeft = 0;
    this.powerUpState.paddleScaleTimeLeft = 0;
    this.powerUpState.paddleScaleValue = 1;
    this.powerUpState.speedUpTimeLeft = 0;
    this.randomEventState.bannerText = '';
    this.randomEventState.bannerTimeLeft = 0;
    this.randomEventState.mirrorTimeLeft = 0;
    this.randomEventState.nextTriggerIn = getRandomRange(RANDOM_EVENT_INTERVAL_MIN, RANDOM_EVENT_INTERVAL_MAX);
    this.randomEventState.reverseControlsTimeLeft = 0;
    this.randomEventState.speedUpTimeLeft = 0;

    this.targetLayer.removeChildren().forEach((child) => child.destroy());
    this.blockLayer.removeChildren().forEach((child) => child.destroy());
    this.projectileLayer.removeChildren().forEach((child) => child.destroy());
    this.powerUpLayer.removeChildren().forEach((child) => child.destroy());
    this.ballLayer.removeChildren().forEach((child) => child.destroy());
    this.effectsSystem.clear();
    this.setReverseControls(false);
    this.setWorldMirrored(false);
    this.updateEventBanner();
  }

  syncUI() {
    this.uiSystem.setLevel(this.currentLevelIndex, this.levelSystem.getLevelCount());
    this.uiSystem.setState({
      canRestart: this.ruleSystem.canRestartLevel() || this.gameState === SCENE_CONSTANTS.gameState.completed,
      gameState: this.gameState,
      hasNextLevel: this.pendingLevelIndex !== null,
      levelLabel: getLevelLabel(this.currentLevelIndex, this.levelSystem.getLevelCount()),
    });
  }

  handleActionInput(event) {
    if (event.type === 'keydown') {
      const actionKeys = ['KeyR', 'Space', 'Enter'];

      if (!actionKeys.includes(event.code)) {
        return;
      }
    }

    if (this.gameState === SCENE_CONSTANTS.gameState.start) {
      this.enterLevelIntro();
      return;
    }

    if (this.gameState === SCENE_CONSTANTS.gameState.levelIntro) {
      this.startGameplay();
      return;
    }

    if (this.gameState === SCENE_CONSTANTS.gameState.completed) {
      this.loadLevel(0);
      this.enterLevelIntro();
      return;
    }

    if (this.ruleSystem.canRestartLevel()) {
      this.restartCurrentLevel();
      this.enterLevelIntro();
    }
  }

  destroy(options) {
    window.removeEventListener('keydown', this.handleActionInput);
    window.removeEventListener('pointerdown', this.handleActionInput);
    this.inputSystem.destroy();
    this.effectsSystem.clear();

    super.destroy(options);
  }

  update(deltaSeconds) {
    this.effectsSystem.update(deltaSeconds);

    if (this.pendingLevelIndex !== null) {
      if (performance.now() >= this.levelAdvanceAt) {
        const nextLevelIndex = this.pendingLevelIndex;

        this.pendingLevelIndex = null;
        this.loadLevel(nextLevelIndex);
        this.enterLevelIntro();
      }

      return;
    }

    if (this.gameState !== SCENE_CONSTANTS.gameState.running) {
      return;
    }

    if (!this.ruleSystem.isRunning()) {
      return;
    }

    this.updateTimedPowerUps(deltaSeconds);
    this.updateRandomEvents(deltaSeconds);
    this.updateGunMode(deltaSeconds);
    this.updateBalls(deltaSeconds);
    this.updateProjectiles(deltaSeconds);
    this.updatePowerUps(deltaSeconds);
    this.draggableBlocks.forEach((block) => block.update(deltaSeconds));
    this.targetBlocks.forEach((block) => block.update(deltaSeconds));

    this.targetBlocks.forEach((block) => {
      if (block.consumeHitFeedback()) {
        this.effectsSystem.emitImpact(block.x, block.y, 0xffd18f);
      }
    });

    this.syncPrimaryBall();
    this.gameState = this.ruleSystem.update(this.balls, this.targetBlocks);

    if (this.gameState === 'won') {
      const nextLevelIndex = this.levelSystem.getNextLevelIndex(this.currentLevelIndex);

      if (nextLevelIndex !== null) {
        this.pendingLevelIndex = nextLevelIndex;
        this.levelAdvanceAt = performance.now() + this.levelAdvanceDelayMs;
        this.stopAllBalls();
        this.syncUI();
        return;
      }

      this.gameState = SCENE_CONSTANTS.gameState.completed;
    }

    if (this.gameState !== SCENE_CONSTANTS.gameState.running) {
      this.stopAllBalls();
    }

    this.syncUI();
  }

  drawBackground() {
    const { colors, field } = SCENE_CONSTANTS;
    const background = new Graphics()
      .rect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height)
      .fill({ color: colors.sceneBackground })
      .circle(GAME_CONFIG.width * 0.5, 118, 210)
      .fill({ color: 0x12345e, alpha: 0.18 })
      .circle(GAME_CONFIG.width * 0.5, GAME_CONFIG.height - 110, 170)
      .fill({ color: 0x3a0d37, alpha: 0.12 })
      .roundRect(field.x, field.y, field.width, field.height, 18)
      .fill({ color: colors.fieldBackground })
      .roundRect(field.x + 6, field.y + 6, field.width - 12, field.height - 12, 14)
      .stroke({ width: 1, color: 0x1f4f7a, alpha: 0.5 })
      .roundRect(field.x, field.y, field.width, field.height, 18)
      .stroke({ width: 2, color: colors.fieldOutline, alpha: 0.76 });

    for (let y = field.y + 22; y < field.y + field.height; y += 34) {
      background
        .moveTo(field.x + 10, y)
        .lineTo(field.x + field.width - 10, y)
        .stroke({ width: 1, color: 0x56bfff, alpha: 0.08 });
    }

    for (let x = field.x + 26; x < field.x + field.width; x += 38) {
      background
        .moveTo(x, field.y + 8)
        .lineTo(x, field.y + field.height - 8)
        .stroke({ width: 1, color: 0x42e7ff, alpha: 0.05 });
    }

    for (const star of getBackdropStars()) {
      background.circle(star.x, star.y, star.radius).fill({ color: star.color, alpha: star.alpha });
    }

    this.layers.background.addChild(background);
  }

  drawBoundaries() {
    const { field, walls, colors } = SCENE_CONSTANTS;

    const boundaries = new Graphics()
      .rect(0, 0, GAME_CONFIG.width, walls.thickness)
      .fill({ color: colors.wall, alpha: 0.18 })
      .rect(0, 0, GAME_CONFIG.width, walls.thickness)
      .fill({ color: colors.wall })
      .rect(0, 0, walls.thickness, field.y + field.height)
      .fill({ color: colors.wall, alpha: 0.18 })
      .rect(0, 0, walls.thickness, field.y + field.height)
      .fill({ color: colors.wall })
      .rect(GAME_CONFIG.width - walls.thickness, 0, walls.thickness, field.y + field.height)
      .fill({ color: colors.wall, alpha: 0.18 })
      .rect(GAME_CONFIG.width - walls.thickness, 0, walls.thickness, field.y + field.height)
      .fill({ color: colors.wall })
      .rect(0, walls.thickness, walls.thickness, field.y + field.height - walls.thickness)
      .fill({ color: colors.wallShade, alpha: 0.55 })
      .rect(
        GAME_CONFIG.width - walls.thickness,
        walls.thickness,
        walls.thickness,
        field.y + field.height - walls.thickness,
      )
      .fill({ color: colors.wallShade, alpha: 0.4 })
      .rect(walls.thickness, 0, GAME_CONFIG.width - walls.thickness * 2, walls.thickness)
      .fill({ color: colors.wallShade, alpha: 0.4 })
      .rect(walls.thickness, 3, GAME_CONFIG.width - walls.thickness * 2, 3)
      .fill({ color: 0xffffff, alpha: 0.3 });

    this.layers.boundaries.addChild(boundaries);
  }

  drawDangerZone() {
    const { dangerZone, colors } = SCENE_CONSTANTS;
    const stripeHeight = 10;
    const stripeGap = 12;
    const stripes = new Graphics()
      .roundRect(dangerZone.x, dangerZone.y, dangerZone.width, dangerZone.height, 18)
      .fill({ color: colors.dangerZone })
      .roundRect(dangerZone.x, dangerZone.y, dangerZone.width, dangerZone.height, 18)
      .stroke({ width: 2, color: colors.dangerZoneOutline, alpha: 0.9 })
      .rect(dangerZone.x + 8, dangerZone.y + 8, dangerZone.width - 16, dangerZone.height - 16)
      .stroke({ width: 1, color: 0xff57b3, alpha: 0.24 });

    for (let x = dangerZone.x - dangerZone.height; x < dangerZone.x + dangerZone.width; x += stripeGap * 2) {
      stripes
        .poly([
          x,
          dangerZone.y + dangerZone.height,
          x + stripeGap,
          dangerZone.y + dangerZone.height,
          x + dangerZone.height + stripeGap,
          dangerZone.y,
          x + dangerZone.height,
          dangerZone.y,
        ])
        .fill({ color: colors.dangerZoneStripe, alpha: 0.22 });
    }

    const separator = new Graphics()
      .roundRect(dangerZone.x, dangerZone.y, dangerZone.width, stripeHeight, 18)
      .fill({ color: colors.dangerZoneStripe, alpha: 0.8 })
      .rect(dangerZone.x + 12, dangerZone.y + 16, dangerZone.width - 24, 2)
      .fill({ color: 0xffc1db, alpha: 0.45 });

    this.layers.dangerZone.addChild(stripes, separator);
  }

  createBall(config) {
    const ball = new Ball(config);

    if (this.powerUpState.fireballTimeLeft > 0) {
      ball.setFireballEnabled(true);
    }

    this.balls.push(ball);
    this.ballLayer.addChild(ball);
    this.syncPrimaryBall();
    this.syncBallSpeedMultiplier();

    return ball;
  }

  createDraggableBlocks(blockConfigs) {
    for (const blockConfig of blockConfigs) {
      const block = new DraggableBlock(blockConfig);
      const dragBounds = this.getDraggableBlockBounds(block);

      this.draggableBlocks.push(block);
      this.blockLayer.addChild(block);
      block.dragBounds = dragBounds;
      block.setControlBounds(dragBounds);
      this.inputSystem.registerDraggableBlock(block, dragBounds);
    }
  }

  createTargetBlocks(blockConfigs) {
    for (const blockConfig of blockConfigs) {
      const block = new TargetBlock(blockConfig);

      this.targetBlocks.push(block);
      this.targetLayer.addChild(block);
    }
  }

  removeTargetBlock(block) {
    const targetIndex = this.targetBlocks.indexOf(block);

    if (targetIndex >= 0) {
      this.targetBlocks.splice(targetIndex, 1);
    }

    this.targetLayer.removeChild(block);
    block.destroy();
  }

  destroyTargetBlockChain(startBlock, color = 0xffd36f) {
    if (!startBlock) {
      return;
    }

    const pendingBlocks = [
      {
        allowPowerUp: true,
        block: startBlock,
      },
    ];
    const destroyedBlocks = new Set();

    while (pendingBlocks.length > 0) {
      const nextTarget = pendingBlocks.shift();
      const block = nextTarget?.block;

      if (!block || destroyedBlocks.has(block) || !this.targetBlocks.includes(block)) {
        continue;
      }

      destroyedBlocks.add(block);

      if (block.isExplosive()) {
        this.effectsSystem.emitExplosion(block.x, block.y);

        for (const neighbor of this.getBlocksInExplosionRadius(block)) {
          if (destroyedBlocks.has(neighbor)) {
            continue;
          }

          this.destroyBlockImmediately(neighbor);
          pendingBlocks.push({
            allowPowerUp: false,
            block: neighbor,
          });
        }
      }

      if (block.isLaser()) {
        for (const target of this.getBlocksInLaserPath(block)) {
          if (destroyedBlocks.has(target)) {
            continue;
          }

          this.destroyBlockImmediately(target);
          pendingBlocks.push({
            allowPowerUp: false,
            block: target,
          });
        }
      }

      this.effectsSystem.emitDestroy(block.x, block.y, block.isExplosive() ? 0xff9b6b : color);

      if (nextTarget.allowPowerUp) {
        this.spawnPowerUpForBlock(block);
      }

      this.removeTargetBlock(block);
    }
  }

  updateBalls(deltaSeconds) {
    for (let index = this.balls.length - 1; index >= 0; index -= 1) {
      const ball = this.balls[index];

      ball.animate(deltaSeconds);
      ball.update(deltaSeconds, this.getBallBounds(ball));

      if (ball.getBottom() >= SCENE_CONSTANTS.dangerZone.lossLineY) {
        this.removeBall(ball, index);
        continue;
      }

      const hitDraggable = this.collisionSystem.resolveBallVsDraggableBlocks(ball, this.draggableBlocks);

      if (hitDraggable) {
        this.effectsSystem.emitImpact(ball.x, ball.y, 0xcfe0ff);
        continue;
      }

      const targetCollision = ball.isFireballEnabled()
        ? this.resolveFireballTargetCollision(ball)
        : this.collisionSystem.resolveBallVsTargetBlocks(ball, this.targetBlocks);

      if (targetCollision?.destroyedBlock) {
        this.destroyTargetBlockChain(targetCollision.destroyedBlock, ball.isFireballEnabled() ? 0xff9b45 : 0xffd36f);
      }
    }
  }

  updateProjectiles(deltaSeconds) {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];

      projectile.update(deltaSeconds);

      if (projectile.y + projectile.size.height * 0.5 < SCENE_CONSTANTS.field.y) {
        this.removeProjectile(projectile, index);
        continue;
      }

      const hitBlock = this.findProjectileTargetCollision(projectile);

      if (!hitBlock) {
        continue;
      }

      this.effectsSystem.emitImpact(projectile.x, projectile.y, 0xffcf8b);
      this.removeProjectile(projectile, index);

      if (hitBlock.takeHit()) {
        this.destroyTargetBlockChain(hitBlock, 0xffc16f);
      }
    }
  }

  updatePowerUps(deltaSeconds) {
    const platform = this.draggableBlocks[0];

    for (let index = this.powerUps.length - 1; index >= 0; index -= 1) {
      const powerUp = this.powerUps[index];

      powerUp.update(deltaSeconds);

      if (platform && overlaps(powerUp.getCollisionBounds(), platform.getCollisionBounds())) {
        this.effectsSystem.emitPickup(powerUp.x, powerUp.y, getPowerUpEffectColor(powerUp.type));
        this.applyPowerUp(powerUp.type);
        this.removePowerUp(powerUp, index);
        continue;
      }

      if (powerUp.getBottom() >= GAME_CONFIG.height) {
        this.removePowerUp(powerUp, index);
      }
    }
  }

  updateGunMode(deltaSeconds) {
    if (this.gunMode.volleysRemaining <= 0) {
      this.setGunMode(false);
      return;
    }

    this.gunMode.fireCooldown -= deltaSeconds;

    if (this.gunMode.fireCooldown > 0) {
      return;
    }

    this.fireGunVolley();
    this.gunMode.volleysRemaining -= 1;
    this.gunMode.fireCooldown = GUN_FIRE_INTERVAL;

    if (this.gunMode.volleysRemaining <= 0) {
      this.setGunMode(false);
    }
  }

  fireGunVolley() {
    const platform = this.draggableBlocks[0];

    if (!platform) {
      return;
    }

    const projectileY = platform.y - platform.size.height * 0.5 - 12;
    const offsets = [-platform.getCurrentWidth() * 0.28, platform.getCurrentWidth() * 0.28];

    for (const offset of offsets) {
      const projectile = new Projectile({
        x: platform.x + offset,
        y: projectileY,
      });

      this.projectiles.push(projectile);
      this.projectileLayer.addChild(projectile);
      this.effectsSystem.emitShot(projectile.x, projectile.y);
    }
  }

  applyPowerUp(type) {
    if (type === 'multiball') {
      this.activateMultiball();
      return;
    }

    if (type === 'gun') {
      this.activateGunMode();
      return;
    }

    if (type === 'fireball') {
      this.activateFireball();
      return;
    }

    if (type === 'paddle_expand') {
      this.activatePaddleScale(PADDLE_EXPAND_SCALE);
      return;
    }

    if (type === 'paddle_shrink') {
      this.activatePaddleScale(PADDLE_SHRINK_SCALE);
      return;
    }

    if (type === 'block_spawn') {
      this.activateBlockSpawn();
      return;
    }

    if (type === 'ball_speed_up') {
      this.activateBallSpeedUp();
    }
  }

  activateMultiball() {
    const sourceBall = this.balls.find((ball) => ball.isActive);

    if (!sourceBall) {
      return;
    }

    const direction = sourceBall.getDirection();
    const splitDirections = [
      normalizeDirection(direction.x - 0.5, direction.y),
      normalizeDirection(direction.x + 0.5, direction.y),
    ];

    for (const [index, splitDirection] of splitDirections.entries()) {
      if (this.balls.length >= MAX_BALLS) {
        break;
      }

      this.createBall(sourceBall.createSplitConfig(splitDirection, index === 0 ? -8 : 8));
    }
  }

  activateGunMode() {
    this.gunMode.volleysRemaining = Math.min(this.gunMode.volleysRemaining + GUN_VOLLEYS, GUN_VOLLEYS * 2);
    this.gunMode.fireCooldown = 0;
    this.setGunMode(true);
  }

  activateFireball() {
    this.powerUpState.fireballTimeLeft = FIREBALL_DURATION;
    this.setFireballState(true);
  }

  activatePaddleScale(scale) {
    this.powerUpState.paddleScaleTimeLeft = PADDLE_MODIFIER_DURATION;
    this.powerUpState.paddleScaleValue = scale;
    this.applyPaddleScale(scale);
  }

  activateBallSpeedUp() {
    this.powerUpState.speedUpTimeLeft = BALL_SPEED_UP_DURATION;
    this.syncBallSpeedMultiplier();
  }

  enterStartScreen() {
    this.gameState = SCENE_CONSTANTS.gameState.start;
    this.syncUI();
  }

  enterLevelIntro() {
    this.mountBallOnPlatform();
    this.gameState = SCENE_CONSTANTS.gameState.levelIntro;
    this.syncUI();
  }

  startGameplay() {
    this.mountBallOnPlatform(true);
    this.gameState = SCENE_CONSTANTS.gameState.running;
    this.ruleSystem.reset();
    this.lastFrameTime = performance.now();
    this.syncUI();
  }

  activateBlockSpawn() {
    const spawnPositions = this.getAvailableBlockSpawnPositions(BLOCK_SPAWN_COUNT);

    for (const position of spawnPositions) {
      const blockConfig = this.levelSystem.createTargetBlockConfig({
        x: position.x,
        y: position.y,
      });
      const block = new TargetBlock(blockConfig);

      this.targetBlocks.push(block);
      this.targetLayer.addChild(block);
      this.effectsSystem.emitPickup(position.x, position.y, 0x6ee7a8);
    }
  }

  activateChaosMultiball() {
    const sourceBall = this.balls.find((ball) => ball.isActive);

    if (!sourceBall) {
      return;
    }

    const direction = sourceBall.getDirection();
    const offsets = [-0.95, -0.45, 0.45, 0.95];
    let createdCount = 0;

    for (const offset of offsets) {
      if (this.balls.length >= MAX_BALLS) {
        break;
      }

      const spreadDirection = normalizeDirection(direction.x + offset, direction.y - Math.abs(offset) * 0.08);

      this.createBall(sourceBall.createSplitConfig(spreadDirection, offset * 10));
      createdCount += 1;
    }

    if (createdCount > 0) {
      this.showRandomEventBanner('CHAOS MULTIBALL', 0x7de3ff, 1.9);
    }
  }

  activateRandomSpeedUp() {
    this.randomEventState.speedUpTimeLeft = RANDOM_EVENT_SPEED_DURATION;
    this.syncBallSpeedMultiplier();
    this.showRandomEventBanner('SPEED SURGE', 0xffe36b, RANDOM_EVENT_SPEED_DURATION);
  }

  activateReverseControlsEvent() {
    this.randomEventState.reverseControlsTimeLeft = RANDOM_EVENT_REVERSE_DURATION;
    this.setReverseControls(true);
    this.showRandomEventBanner('REVERSE CONTROLS', 0xff9d72, RANDOM_EVENT_REVERSE_DURATION);
  }

  activateMirrorWorldEvent() {
    this.randomEventState.mirrorTimeLeft = RANDOM_EVENT_MIRROR_DURATION;
    this.setWorldMirrored(true);
    this.showRandomEventBanner('MIRRORED WORLD', 0xb48cff, RANDOM_EVENT_MIRROR_DURATION);
  }

  setGunMode(isEnabled) {
    const platform = this.draggableBlocks[0];

    if (platform) {
      platform.setGunEnabled(isEnabled);
    }
  }

  setFireballState(isEnabled) {
    this.balls.forEach((ball) => ball.setFireballEnabled(isEnabled));
  }

  setBallSpeedMultiplier(multiplier) {
    this.balls.forEach((ball) => ball.setSpeedMultiplier(multiplier));
  }

  setReverseControls(isEnabled) {
    const platform = this.draggableBlocks[0];

    if (platform) {
      platform.setControlsReversed(isEnabled);
    }
  }

  setWorldMirrored(isMirrored) {
    this.layers.root.pivot.set(GAME_CONFIG.width * 0.5, 0);
    this.layers.root.position.set(GAME_CONFIG.width * 0.5, 0);
    this.layers.root.scale.x = isMirrored ? -1 : 1;
  }

  syncBallSpeedMultiplier() {
    const powerUpMultiplier = this.powerUpState.speedUpTimeLeft > 0 ? BALL_SPEED_UP_MULTIPLIER : 1;
    const eventMultiplier = this.randomEventState.speedUpTimeLeft > 0 ? RANDOM_EVENT_SPEED_MULTIPLIER : 1;

    this.setBallSpeedMultiplier(powerUpMultiplier * eventMultiplier);
  }

  mountBallOnPlatform(prepareLaunch = false) {
    const platform = this.draggableBlocks[0];
    const ball = this.ball ?? this.balls[0];

    if (!platform || !ball) {
      return;
    }

    const ballY = platform.y - platform.size.height * 0.5 - ball.radius - 4;

    ball.snapTo(platform.x, ballY);

    if (!prepareLaunch) {
      return;
    }

    const currentDirection = ball.getDirection();

    ball.redirect({
      x: currentDirection.x || 0.45,
      y: -Math.max(0.82, Math.abs(currentDirection.y)),
    });
  }

  applyPaddleScale(scale) {
    const platform = this.draggableBlocks[0];

    if (!platform) {
      return;
    }

    platform.setWidthScale(scale);
    this.syncPlatformBounds(platform);
  }

  updateRandomEvents(deltaSeconds) {
    this.updateRandomEventTimers(deltaSeconds);
    this.updateEventBanner(deltaSeconds);

    if (this.hasActiveTimedRandomEvent()) {
      return;
    }

    this.randomEventState.nextTriggerIn -= deltaSeconds;

    if (this.randomEventState.nextTriggerIn > 0) {
      return;
    }

    this.triggerRandomEvent();
    this.randomEventState.nextTriggerIn = getRandomRange(RANDOM_EVENT_INTERVAL_MIN, RANDOM_EVENT_INTERVAL_MAX);
  }

  updateRandomEventTimers(deltaSeconds) {
    if (this.randomEventState.reverseControlsTimeLeft > 0) {
      this.randomEventState.reverseControlsTimeLeft = Math.max(
        0,
        this.randomEventState.reverseControlsTimeLeft - deltaSeconds,
      );

      if (this.randomEventState.reverseControlsTimeLeft === 0) {
        this.setReverseControls(false);
      }
    }

    if (this.randomEventState.speedUpTimeLeft > 0) {
      this.randomEventState.speedUpTimeLeft = Math.max(0, this.randomEventState.speedUpTimeLeft - deltaSeconds);

      if (this.randomEventState.speedUpTimeLeft === 0) {
        this.syncBallSpeedMultiplier();
      }
    }

    if (this.randomEventState.mirrorTimeLeft > 0) {
      this.randomEventState.mirrorTimeLeft = Math.max(0, this.randomEventState.mirrorTimeLeft - deltaSeconds);

      if (this.randomEventState.mirrorTimeLeft === 0) {
        this.setWorldMirrored(false);
      }
    }
  }

  hasActiveTimedRandomEvent() {
    return (
      this.randomEventState.reverseControlsTimeLeft > 0 ||
      this.randomEventState.speedUpTimeLeft > 0 ||
      this.randomEventState.mirrorTimeLeft > 0
    );
  }

  triggerRandomEvent() {
    const eventTypes = ['reverse_controls', 'speed_surge', 'mirrored_world'];

    if (this.balls.length < MAX_BALLS) {
      eventTypes.push('chaos_multiball');
    }

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    if (eventType === 'reverse_controls') {
      this.activateReverseControlsEvent();
      return;
    }

    if (eventType === 'speed_surge') {
      this.activateRandomSpeedUp();
      return;
    }

    if (eventType === 'mirrored_world') {
      this.activateMirrorWorldEvent();
      return;
    }

    this.activateChaosMultiball();
  }

  showRandomEventBanner(text, color, duration = 2.1) {
    this.randomEventState.bannerText = text;
    this.randomEventState.bannerColor = color;
    this.randomEventState.bannerTimeLeft = duration;
    this.updateEventBanner();
  }

  updateEventBanner(deltaSeconds = 0) {
    if (deltaSeconds > 0 && this.randomEventState.bannerTimeLeft > 0) {
      this.randomEventState.bannerTimeLeft = Math.max(0, this.randomEventState.bannerTimeLeft - deltaSeconds);
    }

    const { background, label, root } = this.eventOverlay;
    const duration = Math.max(
      this.randomEventState.reverseControlsTimeLeft,
      this.randomEventState.speedUpTimeLeft,
      this.randomEventState.mirrorTimeLeft,
      2.1,
    );
    const isVisible = this.randomEventState.bannerTimeLeft > 0 && this.randomEventState.bannerText;
    const progress = isVisible ? this.randomEventState.bannerTimeLeft / duration : 0;

    root.visible = isVisible;

    if (!isVisible) {
      return;
    }

    label.text = this.randomEventState.bannerText;
    label.style.fill = this.randomEventState.bannerColor;
    background
      .clear()
      .roundRect(-138, -22, 276, 44, 18)
      .fill({ color: 0x09101d, alpha: 0.82 })
      .roundRect(-138, -22, 276, 44, 18)
      .stroke({ width: 2, color: this.randomEventState.bannerColor, alpha: 0.95 });

    root.alpha = Math.min(1, 0.45 + progress * 0.8);
    root.scale.set(1 + (1 - progress) * 0.06);
  }

  spawnPowerUpForBlock(block) {
    if (Math.random() > POWER_UP_DROP_CHANCE) {
      return;
    }

    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    const powerUp = new PowerUpCapsule({
      type,
      x: block.x,
      y: block.y,
    });

    this.powerUps.push(powerUp);
    this.powerUpLayer.addChild(powerUp);
  }

  findProjectileTargetCollision(projectile) {
    const projectileBounds = projectile.getCollisionBounds();

    for (const block of this.targetBlocks) {
      if (overlaps(projectileBounds, block.getCollisionBounds())) {
        return block;
      }
    }

    return null;
  }

  resolveFireballTargetCollision(ball) {
    for (const block of this.targetBlocks) {
      const collision = getBallBlockCollision(ball, block);

      if (!collision) {
        continue;
      }

      ball.setPosition(collision.position.x, collision.position.y);
      this.destroyBlockImmediately(block);

      return {
        destroyedBlock: block,
      };
    }

    return null;
  }

  destroyBlockImmediately(block) {
    while (!block.takeHit()) {
      // Fireball consumes the block in a single pass.
    }
  }

  getBlocksInExplosionRadius(sourceBlock) {
    const radius = sourceBlock.explosionRadius;

    return this.targetBlocks.filter((block) => {
      if (block === sourceBlock) {
        return false;
      }

      return Math.hypot(block.x - sourceBlock.x, block.y - sourceBlock.y) <= radius;
    });
  }

  getBlocksInLaserPath(sourceBlock) {
    const isVertical = sourceBlock.getLaserDirection?.() !== 'horizontal';
    const positionTolerance = isVertical ? sourceBlock.size.width * 0.45 : sourceBlock.size.height * 0.45;

    return this.targetBlocks.filter((block) => {
      if (block === sourceBlock) {
        return false;
      }

      if (isVertical) {
        return Math.abs(block.x - sourceBlock.x) <= positionTolerance;
      }

      return Math.abs(block.y - sourceBlock.y) <= positionTolerance;
    });
  }

  getAvailableBlockSpawnPositions(limit) {
    const candidates = this.buildBlockSpawnGrid();
    const shuffledCandidates = shuffleArray(candidates);

    return shuffledCandidates
      .filter((position) => this.canSpawnBlockAt(position))
      .slice(0, limit);
  }

  buildBlockSpawnGrid() {
    const { field, targetBlock } = SCENE_CONSTANTS;
    const startY = targetBlock.startY;
    const rowStep = targetBlock.height + targetBlock.gap;
    const maxY = Math.min(field.y + field.height * 0.52, GAME_CONFIG.height - 220);
    const rows = [];

    for (let y = startY; y <= maxY; y += rowStep) {
      rows.push(y);
    }

    return rows.flatMap((y, rowIndex) => {
      const baseX = field.x + targetBlock.width * 0.5;
      const offsetX = rowIndex % 2 === 0 ? 0 : (targetBlock.width + targetBlock.gap) * 0.5;
      const positions = [];

      for (
        let x = baseX + offsetX;
        x <= field.x + field.width - targetBlock.width * 0.5;
        x += targetBlock.width + targetBlock.gap
      ) {
        positions.push({ x, y });
      }

      return positions;
    });
  }

  canSpawnBlockAt(position) {
    const blockConfig = this.levelSystem.createTargetBlockConfig(position);
    const halfWidth = blockConfig.width * 0.5;
    const halfHeight = blockConfig.height * 0.5;
    const bounds = {
      left: position.x - halfWidth,
      right: position.x + halfWidth,
      top: position.y - halfHeight,
      bottom: position.y + halfHeight,
    };

    const overlapsExistingBlock = this.targetBlocks.some((block) => overlaps(bounds, block.getCollisionBounds()));

    if (overlapsExistingBlock) {
      return false;
    }

    const overlapsPlatform = this.draggableBlocks.some((block) => overlaps(bounds, block.getCollisionBounds()));

    if (overlapsPlatform) {
      return false;
    }

    const overlapsBall = this.balls.some((ball) => {
      const ballBounds = {
        left: ball.x - ball.radius - 10,
        right: ball.x + ball.radius + 10,
        top: ball.y - ball.radius - 10,
        bottom: ball.y + ball.radius + 10,
      };

      return overlaps(bounds, ballBounds);
    });

    return !overlapsBall;
  }

  removeBall(ball, index = this.balls.indexOf(ball)) {
    if (index >= 0) {
      this.balls.splice(index, 1);
    }

    this.ballLayer.removeChild(ball);
    ball.destroy();
    this.syncPrimaryBall();
  }

  removeProjectile(projectile, index = this.projectiles.indexOf(projectile)) {
    if (index >= 0) {
      this.projectiles.splice(index, 1);
    }

    this.projectileLayer.removeChild(projectile);
    projectile.destroy();
  }

  removePowerUp(powerUp, index = this.powerUps.indexOf(powerUp)) {
    if (index >= 0) {
      this.powerUps.splice(index, 1);
    }

    this.powerUpLayer.removeChild(powerUp);
    powerUp.destroy();
  }

  stopAllBalls() {
    this.balls.forEach((ball) => ball.stop());
  }

  syncPrimaryBall() {
    this.ball = this.balls[0] ?? null;
  }

  updateTimedPowerUps(deltaSeconds) {
    this.updateFireballTimer(deltaSeconds);
    this.updatePaddleScaleTimer(deltaSeconds);
    this.updateBallSpeedTimer(deltaSeconds);
  }

  updateFireballTimer(deltaSeconds) {
    if (this.powerUpState.fireballTimeLeft <= 0) {
      return;
    }

    this.powerUpState.fireballTimeLeft = Math.max(0, this.powerUpState.fireballTimeLeft - deltaSeconds);

    if (this.powerUpState.fireballTimeLeft === 0) {
      this.setFireballState(false);
    }
  }

  updatePaddleScaleTimer(deltaSeconds) {
    if (this.powerUpState.paddleScaleTimeLeft <= 0) {
      return;
    }

    this.powerUpState.paddleScaleTimeLeft = Math.max(0, this.powerUpState.paddleScaleTimeLeft - deltaSeconds);

    if (this.powerUpState.paddleScaleTimeLeft === 0) {
      this.powerUpState.paddleScaleValue = 1;
      this.applyPaddleScale(1);
    }
  }

  updateBallSpeedTimer(deltaSeconds) {
    if (this.powerUpState.speedUpTimeLeft <= 0) {
      return;
    }

    this.powerUpState.speedUpTimeLeft = Math.max(0, this.powerUpState.speedUpTimeLeft - deltaSeconds);

    if (this.powerUpState.speedUpTimeLeft === 0) {
      this.syncBallSpeedMultiplier();
    }
  }

  syncPlatformBounds(platform) {
    const dragBounds = platform.dragBounds;
    const nextBounds = this.getDraggableBlockBounds(platform);

    if (!dragBounds) {
      return;
    }

    dragBounds.left = nextBounds.left;
    dragBounds.right = nextBounds.right;
    dragBounds.top = nextBounds.top;
    dragBounds.bottom = nextBounds.bottom;
    platform.moveActualTo(clamp(platform.x, dragBounds.left, dragBounds.right), platform.y);
  }

  getBallBounds(ball) {
    const { field } = SCENE_CONSTANTS;
    const radius = ball.radius;

    return {
      left: field.x + radius,
      right: field.x + field.width - radius,
      top: field.y + radius,
    };
  }

  getDraggableBlockBounds(block) {
    const { field } = SCENE_CONSTANTS;
    const halfWidth = block.getCurrentWidth() * 0.5;
    const halfHeight = block.size.height * 0.5;

    return {
      left: field.x + halfWidth,
      right: field.x + field.width - halfWidth,
      top: field.y + halfHeight,
      bottom: field.y + field.height - halfHeight,
    };
  }
}

function overlaps(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function normalizeDirection(x, y) {
  const length = Math.hypot(x, y) || 1;

  return {
    x: x / length,
    y: y / length,
  };
}

function getPowerUpEffectColor(type) {
  if (type === 'gun') {
    return 0xff9d72;
  }

  if (type === 'fireball') {
    return 0xff8b3d;
  }

  if (type === 'paddle_expand') {
    return 0x7df0b1;
  }

  if (type === 'paddle_shrink') {
    return 0xb48cff;
  }

  if (type === 'ball_speed_up') {
    return 0xffe36b;
  }

  if (type === 'block_spawn') {
    return 0x6ee7a8;
  }

  return 0x7de3ff;
}

function getLevelLabel(levelIndex, totalLevels) {
  return `Level ${levelIndex + 1}/${totalLevels}`;
}

function createEventOverlay() {
  const root = new Container();
  const background = new Graphics();
  const label = new Text({
    text: '',
    style: {
      fill: 0xffffff,
      fontFamily: 'Trebuchet MS',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 2.2,
    },
  });

  root.label = 'random-event-overlay';
  root.position.set(GAME_CONFIG.width * 0.5, 52);
  root.visible = false;
  label.anchor.set(0.5);
  root.addChild(background, label);

  return {
    root,
    background,
    label,
  };
}

function getRandomRange(min, max) {
  return min + Math.random() * (max - min);
}

function shuffleArray(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index];

    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }

  return result;
}

function getBackdropStars() {
  return Array.from({ length: 34 }, (_, index) => {
    const phase = index + 1;

    return {
      alpha: 0.18 + (phase % 5) * 0.03,
      color: phase % 4 === 0 ? 0xff87d2 : 0x8ceaff,
      radius: phase % 3 === 0 ? 1.6 : 1.1,
      x: 18 + ((phase * 73) % (GAME_CONFIG.width - 36)),
      y: 22 + ((phase * 131) % (GAME_CONFIG.height - 140)),
    };
  });
}
