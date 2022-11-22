import {
  IChess,
  IChessCtor,
  IChessBoard,
  IChessBoardCtor,
  CHESS_STATUS,
  IChessRelation,
} from "../types";
import { ChessRelation } from "./relation";

/**
 * 棋子
 */
export class Chess implements IChess {
  layer = 0;
  x = 0;
  y = 0;
  idx;
  type;
  value;
  status;
  board = false;
  relation: IChessRelation;
  constructor(opts: IChessCtor) {
    this.idx = opts.idx;
    this.type = opts.type;
    this.value = opts.value;
    this.relation = new ChessRelation(this.idx);
    this.status = CHESS_STATUS.UN_CLICKABLE;
  }
}

/**
 * 棋盘
 */
export class ChessBoard<T = IChess> implements IChessBoard<T> {
  row: number;
  column: number;
  unitTotal: number = 0;
  boardChessTotal: number = 0;
  private _randomChessTotal: number = 0;
  leftList: T[] | null = null;
  rightList: T[] | null = null;
  boardList: T[] | null = null;
  position: { chesses: T[] }[][] | null = null;

  constructor(opts: IChessBoardCtor<T>) {
    this.row = opts.row;
    this.column = opts.column;
    this.unitTotal = this.row * this.column;
    this._init();
  }

  get allChessTotal() {
    return this.randomChessTotal + this.boardChessTotal;
  }

  get randomChessTotal() {
    return this._randomChessTotal;
  }

  /**
   * 初始化
   * @returns ChessBoard
   */
  private _init() {
    this.position = new Array(this.row);
    for (let i = 0; i < this.row; i++) {
      this.position[i] = new Array(this.column);
      for (let j = 0; j < this.column; j++) {
        this.position[i][j] = { chesses: [] };
      }
    }
    return this;
  }

  /**
   * 重置棋盘
   * @param opts 可选的row、column
   */
  reset(opts: Partial<Pick<IChessBoard<T>, "row" | "column">> = {}) {
    this.position = null;
    this.row = opts.row || this.row;
    this.column = opts.column || this.column;
    this._init();
  }

  /**
   * 将棋子添加到棋盘
   * @param row 几行
   * @param column 几列
   * @param value 棋子
   */
  fill(row: number, column: number, value: T) {
    if (this.position) {
      this.position[row][column].chesses.push(value);
      this.boardChessTotal++;
    }
  }

  /**
   * 将棋子添加到左下独立区域
   * @param value 棋子
   */
  fillLeft(value: T) {
    (this.leftList || (this.leftList = [])).push(value);
    this._randomChessTotal++;
  }

  /**
   * 将棋子添加到右下独立区域
   * @param value 棋子
   */
  fillRight(value: T) {
    (this.rightList || (this.rightList = [])).push(value);
    this._randomChessTotal++;
  }
}
