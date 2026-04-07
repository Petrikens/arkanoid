const FULL_ROW_X = [45, 111, 177, 243, 309, 375];
const OFFSET_ROW_X = [78, 144, 210, 276, 342];
const CORE_ROW_X = [111, 177, 243, 309];

const TYPE_CONFIG = {
  explosive: {
    hitPoints: 1,
    type: 'explosive',
  },
  laser: {
    hitPoints: 2,
    laserDirection: 'random',
    type: 'laser',
  },
  metal: {
    hitPoints: 10,
    type: 'metal',
  },
  standard: {},
  stone: {
    hitPoints: 4,
    type: 'stone',
  },
};

function createRow(y, positions) {
  return positions.map((x) => ({ x, y }));
}

function createRandomizedBlocks(rows, typePlan) {
  const blocks = rows.flatMap(({ y, positions }) => createRow(y, positions));
  const randomizedBlocks = shuffle(blocks).map((block) => ({ ...block }));
  let cursor = 0;

  for (const plan of typePlan) {
    const count = randomInt(plan.min, plan.max);

    for (let index = 0; index < count && cursor < randomizedBlocks.length; index += 1) {
      const block = randomizedBlocks[cursor];
      const config = TYPE_CONFIG[plan.type];

      Object.assign(block, config);

      if (config.laserDirection === 'random') {
        block.laserDirection = Math.random() > 0.5 ? 'vertical' : 'horizontal';
      }

      cursor += 1;
    }
  }

  return shuffle(randomizedBlocks);
}

function createLevel(config) {
  return {
    id: config.id,
    ball: config.ball,
    draggableBlocks: [{ x: 210, y: 624 }],
    targetBlocks: () => createRandomizedBlocks(config.rows, config.typePlan),
  };
}

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    const current = result[index];

    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }

  return result;
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export const LEVELS = [
  createLevel({
    id: 'level-1',
    ball: {
      x: 210,
      y: 304,
      direction: {
        x: 0.68,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: OFFSET_ROW_X },
      { y: 128, positions: FULL_ROW_X },
      { y: 164, positions: OFFSET_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 1, max: 2 },
      { type: 'explosive', min: 0, max: 1 },
    ],
  }),
  createLevel({
    id: 'level-2',
    ball: {
      x: 164,
      y: 300,
      direction: {
        x: 0.82,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: OFFSET_ROW_X },
      { y: 164, positions: FULL_ROW_X },
      { y: 200, positions: CORE_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 2, max: 4 },
      { type: 'explosive', min: 1, max: 1 },
    ],
  }),
  createLevel({
    id: 'level-3',
    ball: {
      x: 256,
      y: 304,
      direction: {
        x: -0.74,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: OFFSET_ROW_X },
      { y: 164, positions: FULL_ROW_X },
      { y: 200, positions: OFFSET_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 3, max: 5 },
      { type: 'laser', min: 1, max: 1 },
      { type: 'explosive', min: 1, max: 1 },
    ],
  }),
  createLevel({
    id: 'level-4',
    ball: {
      x: 210,
      y: 296,
      direction: {
        x: 0.58,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: OFFSET_ROW_X },
      { y: 164, positions: FULL_ROW_X },
      { y: 200, positions: OFFSET_ROW_X },
      { y: 236, positions: CORE_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 4, max: 6 },
      { type: 'laser', min: 1, max: 2 },
      { type: 'explosive', min: 1, max: 2 },
    ],
  }),
  createLevel({
    id: 'level-5',
    ball: {
      x: 146,
      y: 300,
      direction: {
        x: 0.88,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: FULL_ROW_X },
      { y: 164, positions: OFFSET_ROW_X },
      { y: 200, positions: FULL_ROW_X },
      { y: 236, positions: OFFSET_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 5, max: 7 },
      { type: 'laser', min: 1, max: 2 },
      { type: 'explosive', min: 1, max: 2 },
      { type: 'metal', min: 1, max: 1 },
    ],
  }),
  createLevel({
    id: 'level-6',
    ball: {
      x: 274,
      y: 300,
      direction: {
        x: -0.86,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: OFFSET_ROW_X },
      { y: 164, positions: FULL_ROW_X },
      { y: 200, positions: OFFSET_ROW_X },
      { y: 236, positions: FULL_ROW_X },
      { y: 272, positions: CORE_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 6, max: 8 },
      { type: 'laser', min: 2, max: 2 },
      { type: 'explosive', min: 1, max: 2 },
      { type: 'metal', min: 1, max: 2 },
    ],
  }),
  createLevel({
    id: 'level-7',
    ball: {
      x: 210,
      y: 292,
      direction: {
        x: 0.72,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: OFFSET_ROW_X },
      { y: 128, positions: FULL_ROW_X },
      { y: 164, positions: OFFSET_ROW_X },
      { y: 200, positions: FULL_ROW_X },
      { y: 236, positions: OFFSET_ROW_X },
      { y: 272, positions: FULL_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 7, max: 10 },
      { type: 'laser', min: 2, max: 3 },
      { type: 'explosive', min: 2, max: 2 },
      { type: 'metal', min: 2, max: 3 },
    ],
  }),
  createLevel({
    id: 'level-8',
    ball: {
      x: 170,
      y: 296,
      direction: {
        x: 0.84,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: OFFSET_ROW_X },
      { y: 164, positions: FULL_ROW_X },
      { y: 200, positions: CORE_ROW_X },
      { y: 236, positions: FULL_ROW_X },
      { y: 272, positions: OFFSET_ROW_X },
      { y: 308, positions: CORE_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 8, max: 11 },
      { type: 'laser', min: 2, max: 3 },
      { type: 'explosive', min: 2, max: 3 },
      { type: 'metal', min: 3, max: 4 },
    ],
  }),
  createLevel({
    id: 'level-9',
    ball: {
      x: 248,
      y: 292,
      direction: {
        x: -0.8,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: OFFSET_ROW_X },
      { y: 164, positions: FULL_ROW_X },
      { y: 200, positions: OFFSET_ROW_X },
      { y: 236, positions: FULL_ROW_X },
      { y: 272, positions: OFFSET_ROW_X },
      { y: 308, positions: CORE_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 9, max: 12 },
      { type: 'laser', min: 3, max: 4 },
      { type: 'explosive', min: 2, max: 3 },
      { type: 'metal', min: 4, max: 5 },
    ],
  }),
  createLevel({
    id: 'level-10',
    ball: {
      x: 210,
      y: 288,
      direction: {
        x: 0.76,
        y: 1,
      },
    },
    rows: [
      { y: 92, positions: FULL_ROW_X },
      { y: 128, positions: OFFSET_ROW_X },
      { y: 164, positions: FULL_ROW_X },
      { y: 200, positions: OFFSET_ROW_X },
      { y: 236, positions: FULL_ROW_X },
      { y: 272, positions: OFFSET_ROW_X },
      { y: 308, positions: FULL_ROW_X },
    ],
    typePlan: [
      { type: 'stone', min: 10, max: 13 },
      { type: 'laser', min: 3, max: 4 },
      { type: 'explosive', min: 2, max: 3 },
      { type: 'metal', min: 5, max: 6 },
    ],
  }),
];
