import Phaser, { Scene } from "phaser";
import Stats from "stats.js";
import MyEmitter from "./MyEmitter";
import { Howl } from "howler";
import { SocketManager } from "../socket";
import { SceneHandler } from "./SceneHandler";

type globalDataType = {
  resources: { [key: string]: Phaser.Textures.Texture };
  emitter: MyEmitter | undefined;
  isMobile: boolean;
  fpsStats: Stats;
  soundResources: { [key: string]: Howl & { userVolume?: number }};
  SceneHandler: SceneHandler | undefined;
  Socket: SocketManager | undefined;
  PhaserInstance: Phaser.Game | undefined;
  masterVolume: number; // Add this line
};

export const Globals: globalDataType = {
  resources: {},
  emitter: undefined,
  get isMobile() {
    if (!this.PhaserInstance) {
      return false; // Default to false if PhaserInstance is not set
    }
    const device = this.PhaserInstance.device;
    return device.os.android || device.os.iOS;
  },
  SceneHandler: undefined,
  fpsStats: new Stats(),
  Socket: undefined,
  soundResources: {},
  PhaserInstance: undefined,
  masterVolume: 1,
};

// Define the structure of a symbol object
interface SymbolType {
  ID: number;
  Name: string;
  multiplier: number[]; // Assuming multiplier is an array of numbers
  defaultAmount: object;
  symbolsCount: object;
  description: string
}

// Bets: (15) [0.01, 0.02, 0.04, 0.05, 0.07, 0.1, 0.2, 0.4, 0.5, 0.7, 1, 1.5, 2, 2.5, 3]
// BonusData: []
// Lines: (12) [Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5), Array(5)]
// LinesCount: (12) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
// Reel: (5) [Array(68), Array(68), Array(68), Array(68), Array(68)]
// autoSpin: (4) [1, 5, 10, 20]
  
export const initData = {
  gameData: {
    Reel: [[]],
    BonusData: [],
    Bets: [],
    LinesCount: [],
    autoSpin: [],
    linesApiData: [[]],
    freeSpinData: [[]],

  },
  playerData: {
    Balance: 0,
    haveWon: 0,
    currentWining: 0,
    currentBet: 0,
  },
  UIData: {
    symbols: [
      {
        ID: 0,
        Name: "0",
        multiplier: [5, 4, 2],
        defaultAmount: {}, // Replace with actual data
        symbolsCount: {},  // Replace with actual data
      },
      {
        ID: 1,
        Name: "1",
        multiplier: [5, 4, 2],
        defaultAmount: {}, // Replace with actual data
        symbolsCount: {},  // Replace with actual data
      },
      // Add more symbols as needed
    ] as SymbolType[], // Cast the array to the correct type
    spclSymbolTxt: []
  }
};

export const currentGameData = {
  currentBetIndex: 0,
  won: 0,
  AutoPlay: 0,
  currentLines: 0,
  currentBalance: 0,
  isMoving: false,
  soundMode: true,
  musicMode: true,
};

export const ResultData = {
  gameData: {
    BonusResult: [],
    BonusStopIndex: -1,
    ResultReel: [[]],
    WinAmout: 0,
    freeSpins: {
      count: 0,
      isNewAdded: false,
    },
    isBonus: false,
    jackpot: 0,
    linesToEmit: [],
    symbolsToEmit: [],
  },
  playerData: {
    Balance: 0,
    haveWon: 0,
    currentWining: 0,
    currentBet: 0,
  },
};

export const gambleData = {
  gambleCards: {
    exCards: [], // To store an array of card objects
    highCard: {}, // To store the high card object
    lowCard: {},
  },
};

export const gambleResult = {
  gamleResultData: {
    Balance: 0,
    currentWining: 0,
    playerWon: false,
  },
};

export const TextStyle = {
  dropShadow: true,
  dropShadowAngle: 1.8,
  dropShadowColor: "#ffffff",
  dropShadowDistance: 1,
  fill: "#ffffff",
  fillGradientStops: [0.4],
  fontSize: 32,
  fontWeight: "bolder",
  lineJoin: "round",
  miterLimit: 0,
  stroke: "#4f3130",
  strokeThickness: 1.5,
};
