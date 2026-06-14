import { ORDER_DECK } from '../../data/orderDeck';
import { createUpgradeState } from '../../engine/upgrades';

const ORDERS_BY_ID = Object.fromEntries(ORDER_DECK.map((order) => [order.id, order]));

function order(id) {
  const found = ORDERS_BY_ID[id];
  if (!found) {
    throw new Error(`Unknown fixture order id: ${id}`);
  }
  return found;
}

function player({
  id,
  name,
  color,
  meeples,
  tabs,
  cups = [[], [], []],
  hand = [],
  rushTokens = 0,
}) {
  return {
    id,
    name,
    color,
    cups,
    hand,
    completed: [],
    penalties: [],
    rushTokens,
    upgrades: createUpgradeState(),
    meeples,
    tabs,
    turnCompletedOrderIds: [],
  };
}

export function createVideoStateAt2308() {
  return {
    version: 'video-1080-fixture',
    rngSeed: 'video-1080',
    rngCursor: 0,
    playerCount: 2,
    phase: 'move',
    turn: 1,
    activePlayerId: 'p2',
    startingPlayerId: 'p2',
    endTriggered: false,
    finalTurnPlayerId: null,
    deck: [],
    setupPlacementQueue: [],
    players: [
      player({
        id: 'p1',
        name: 'Pink',
        color: 'rose',
        meeples: [
          { id: 'p1-m1', cellId: 13 },
          { id: 'p1-m2', cellId: 42 },
        ],
        tabs: [
          [order('order_048')],
          [order('order_006'), order('order_070')],
          [order('order_004'), order('order_024'), order('order_011')],
          [order('order_080')],
        ],
      }),
      player({
        id: 'p2',
        name: 'Blue',
        color: 'blue',
        meeples: [
          { id: 'p2-m1', cellId: 11 },
          { id: 'p2-m2', cellId: 34 },
        ],
        tabs: [
          [order('order_010'), order('order_033')],
          [order('order_052'), order('order_035'), order('order_061')],
          [order('order_072'), order('order_032')],
          [],
        ],
      }),
    ],
    log: [],
    lastMessage: 'Video checkpoint 00:23:08.',
  };
}

export function createVideoStateAt2440() {
  return {
    version: 'video-1080-fixture',
    rngSeed: 'video-1080',
    rngCursor: 0,
    playerCount: 2,
    phase: 'move',
    turn: 1,
    activePlayerId: 'p1',
    startingPlayerId: 'p2',
    endTriggered: false,
    finalTurnPlayerId: null,
    deck: [],
    setupPlacementQueue: [],
    players: [
      player({
        id: 'p1',
        name: 'Pink',
        color: 'rose',
        meeples: [
          { id: 'p1-m1', cellId: 13 },
          { id: 'p1-m2', cellId: 42 },
        ],
        tabs: [
          [order('order_048')],
          [order('order_006'), order('order_070')],
          [order('order_004'), order('order_024'), order('order_011')],
          [order('order_080')],
        ],
      }),
      player({
        id: 'p2',
        name: 'Blue',
        color: 'blue',
        meeples: [
          { id: 'p2-m1', cellId: 11 },
          { id: 'p2-m2', cellId: 22 },
        ],
        tabs: [
          [order('order_041')],
          [order('order_010'), order('order_033')],
          [order('order_052'), order('order_035'), order('order_061')],
          [order('order_072'), order('order_032')],
        ],
      }),
    ],
    log: [],
    lastMessage: 'Video checkpoint 00:24:40.',
  };
}

export function createVideoStateAt2450() {
  const base = createVideoStateAt2440();

  return {
    ...base,
    phase: 'pour',
    players: base.players.map((candidate) =>
      candidate.id === 'p1'
        ? {
            ...candidate,
            meeples: [
              { id: 'p1-m1', cellId: 31 },
              { id: 'p1-m2', cellId: 42 },
            ],
          }
        : candidate,
    ),
    lastMessage: 'Video checkpoint 00:24:50.',
  };
}

export function createVideoStateAt2600() {
  const base = createVideoStateAt2440();

  return {
    ...base,
    phase: 'move',
    activePlayerId: 'p2',
    players: base.players.map((candidate) => {
      if (candidate.id === 'p1') {
        return {
          ...candidate,
          meeples: [
            { id: 'p1-m1', cellId: 31 },
            { id: 'p1-m2', cellId: 42 },
          ],
        };
      }

      return candidate;
    }),
    lastMessage: 'Video checkpoint around 00:26:00.',
  };
}

export const VIDEO_1080_REPLAY = {
  sourceVideo: '/Users/vanshkumar/Downloads/videoplayback (1).mp4',
  slices: [
    {
      id: 'cp1-blue-derived-move',
      evidence: 'derived',
      startTime: '00:23:08',
      endTime: '00:24:00',
      notes:
        'The start/end board state is visible in 1080p. The hand partially covers the physical move, but the legal route and gained ingredients are derived from the clear endpoints.',
      createStartState: createVideoStateAt2308,
      startCheckpoint: {
        phase: 'move',
        activePlayerId: 'p2',
        players: {
          p1: {
            meeples: { 'p1-m1': 13, 'p1-m2': 42 },
            visibleOrderNamesByTab: [
              ['Iced Caramel Caffe Latte'],
              ['Caffe Latte', 'Chocolate Latte'],
              ['Espresso Doppio', 'Chocolate Shake', 'Iced Milk Tea'],
              ['Caramel Frappe'],
            ],
          },
          p2: {
            meeples: { 'p2-m1': 11, 'p2-m2': 34 },
            visibleOrderNamesByTab: [
              ['Iced Black Tea', 'Iced Einspanner'],
              ['Cold Brew', 'Cocoa', 'Iced Green Tea'],
              ['Iced Chocolate Latte', 'Caramel Caffe Latte'],
              [],
            ],
          },
        },
      },
      actions: [
        {
          type: 'MOVE',
          playerId: 'p2',
          meepleId: 'p2-m2',
          path: [33, 23, 22],
          rushSpent: 0,
        },
      ],
      endCheckpoint: {
        phase: 'pour',
        activePlayerId: 'p2',
        players: {
          p1: {
            meeples: { 'p1-m1': 13, 'p1-m2': 42 },
          },
          p2: {
            meeples: { 'p2-m1': 11, 'p2-m2': 22 },
            hand: ['milk', 'ice', 'milk'],
          },
        },
      },
    },
    {
      id: 'cp1-blue-post-flow-checkpoint',
      evidence: 'checkpoint-only',
      startTime: '00:24:40',
      notes:
        'Post-flow state after Blue has ended the turn. Order tabs and meeple positions are visible; exact Blue cup handling before this checkpoint is not visible enough for strict replay continuity.',
      createStartState: createVideoStateAt2440,
      startCheckpoint: {
        phase: 'move',
        activePlayerId: 'p1',
        players: {
          p1: {
            meeples: { 'p1-m1': 13, 'p1-m2': 42 },
          },
          p2: {
            meeples: { 'p2-m1': 11, 'p2-m2': 22 },
            visibleOrderNamesByTab: [
              ['Mochaccino'],
              ['Iced Black Tea', 'Iced Einspanner'],
              ['Cold Brew', 'Cocoa', 'Iced Green Tea'],
              ['Iced Chocolate Latte', 'Caramel Caffe Latte'],
            ],
          },
        },
      },
    },
    {
      id: 'cp2-pink-endpoint-checkpoint',
      evidence: 'checkpoint-only',
      startTime: '00:24:50',
      notes:
        'Pink endpoint is visible with one barista on C31 tea. The route and any Rush spend are not visible enough to encode as a strict action.',
      createStartState: createVideoStateAt2450,
      startCheckpoint: {
        phase: 'pour',
        activePlayerId: 'p1',
        players: {
          p1: {
            meeples: { 'p1-m1': 31, 'p1-m2': 42 },
          },
          p2: {
            meeples: { 'p2-m1': 11, 'p2-m2': 22 },
          },
        },
      },
    },
    {
      id: 'cp3-blue-derived-move',
      evidence: 'derived',
      startTime: '00:26:00',
      endTime: '00:26:50',
      notes:
        'Pink has completed/advanced out of the prior turn, but the cup/order handling is not fully encoded. The board start/end state supports a strict Blue movement replay from C22 to C32.',
      createStartState: createVideoStateAt2600,
      startCheckpoint: {
        phase: 'move',
        activePlayerId: 'p2',
        players: {
          p1: {
            meeples: { 'p1-m1': 31, 'p1-m2': 42 },
          },
          p2: {
            meeples: { 'p2-m1': 11, 'p2-m2': 22 },
          },
        },
      },
      actions: [
        {
          type: 'MOVE',
          playerId: 'p2',
          meepleId: 'p2-m2',
          path: [32],
          rushSpent: 0,
        },
      ],
      endCheckpoint: {
        phase: 'pour',
        activePlayerId: 'p2',
        players: {
          p1: {
            meeples: { 'p1-m1': 31, 'p1-m2': 42 },
          },
          p2: {
            meeples: { 'p2-m1': 11, 'p2-m2': 32 },
            hand: ['steam'],
          },
        },
      },
    },
  ],
};
