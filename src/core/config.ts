import { IGameConfig, ICHESS_ENUM } from "../types"

/**
 * 枚举棋子种类
 */
export const CHESS_TYPES: Array<ICHESS_ENUM> = [
  { k: "1", v: "/imgs/1.png" },
  { k: "2", v: "/imgs/2.png" },
  { k: "3", v: "/imgs/3.png" },
  { k: "4", v: "/imgs/4.png" },
  { k: "5", v: "/imgs/5.png" },
  { k: "6", v: "/imgs/6.png" },
  { k: "7", v: "/imgs/7.png" },
  { k: "8", v: "/imgs/8.png" },
  { k: "9", v: "/imgs/9.png" },
];

/**
 * 游戏配置
 */
export const GameConfig: IGameConfig = {
  type: 1,
  layers: 1,
  quantityPerLayer: 4,
  quantityRandom: 0,
  removeSize: 3,
  fillSize: 7,
  row: 27,
  column: 27,
  rowWidth: 12,
  columnWidth: 12,
  perChessColumn: 3,
  perChessRow: 3,
}
