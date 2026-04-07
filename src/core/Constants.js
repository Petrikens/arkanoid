import { GAME_CONFIG } from './Config.js';

const WALL_THICKNESS = 12;
const DANGER_ZONE_HEIGHT = 80;

export const SCENE_CONSTANTS = {
  field: {
    x: WALL_THICKNESS,
    y: WALL_THICKNESS,
    width: GAME_CONFIG.width - WALL_THICKNESS * 2,
    height: GAME_CONFIG.height - WALL_THICKNESS - DANGER_ZONE_HEIGHT,
  },
  walls: {
    thickness: WALL_THICKNESS,
  },
  dangerZone: {
    x: WALL_THICKNESS,
    y: GAME_CONFIG.height - DANGER_ZONE_HEIGHT,
    width: GAME_CONFIG.width - WALL_THICKNESS * 2,
    height: DANGER_ZONE_HEIGHT,
    lossLineY: GAME_CONFIG.height - DANGER_ZONE_HEIGHT,
  },
  colors: {
    sceneBackground: 0x040814,
    fieldBackground: 0x071326,
    wall: 0x42d8ff,
    wallShade: 0x102955,
    fieldOutline: 0x7bf3ff,
    dangerZone: 0x1f0718,
    dangerZoneStripe: 0xff4f9d,
    dangerZoneOutline: 0xff93c3,
  },
  ball: {
    radius: 10,
    speed: 280,
    startX: GAME_CONFIG.width * 0.5,
    startY: GAME_CONFIG.height * 0.38,
    direction: {
      x: 0.72,
      y: 1,
    },
    fill: 0xf6fcff,
    outline: 0x4ce0ff,
    shine: 0xffffff,
  },
  draggableBlock: {
    width: 92,
    widthDecreasePerLevel: 18,
    minWidth: 56,
    height: 20,
    cornerRadius: 10,
    startX: GAME_CONFIG.width * 0.5,
    startY: GAME_CONFIG.height - DANGER_ZONE_HEIGHT - 44,
    dragScale: 1.03,
    fill: 0x0b1d37,
    outline: 0x7af1ff,
    accent: 0x31dfff,
    shadow: 0x020713,
  },
  targetBlock: {
    width: 54,
    height: 24,
    cornerRadius: 8,
    hitPoints: 2,
    gap: 12,
    rows: 2,
    columns: 4,
    startX: GAME_CONFIG.width * 0.5 - 99,
    startY: 92,
    colors: {
      fill: 0x163861,
      damagedFill: 0x102949,
      outline: 0x79ebff,
      accent: 0x8bffc4,
      crack: 0x041624,
      shadow: 0x020813,
      glow: 0x2ae0ff,
    },
  },
  gameState: {
    completed: 'completed',
    levelIntro: 'level_intro',
    start: 'start',
    won: 'won',
    running: 'running',
    lost: 'lost',
  },
};
