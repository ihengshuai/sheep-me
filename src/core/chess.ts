import {
  IChess,
  IChessCtor,
  IChessBoard,
  IChessBoardCtor,
  CHESS_STATUS,
} from "../types"

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
  lowers: IChess[];
  highers: IChess[];
  constructor(opts: IChessCtor) {
    this.idx = opts.idx;
    this.type = opts.type;
    this.value = opts.value;
    this.lowers = [];
    this.highers = [];
    this.status = CHESS_STATUS.UN_CLICKABLE;
  }
}


/**
 * 棋盘
 */
export class ChessBoard<T = Chess> implements IChessBoard<T> {
  row: number;
  column: number;
  unitQuantity: number = 0;
  chessQuantity: number = 0;
  leftList: T[] | null = null;
  rightList: T[] | null = null;
  list: { chesses: T[]; }[][] | null = null;
  
  constructor(opts: IChessBoardCtor<T>) {
    this.row = opts.row;
    this.column = opts.column;
    this.unitQuantity = this.row * this.column;
    this._init();
  }

  /**
   * 初始化
   * @returns ChessBoard
   */
  private _init() {
    this.list = new Array(this.row);
    for (let i = 0; i< this.row; i++) {
      this.list[i] = new Array(this.column);
      for ( let j = 0; j< this.column; j++) {
        this.list[i][j] = { chesses: [] };
      }
    }
    return this;
  }

  /**
   * 重置棋盘
   * @param opts 可选的row、column
   */
  reset(opts: Partial<Pick<IChessBoard<T>, "row" | "column">> = {}) {
    this.list = null;
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
    if (this.list) {
      this.list[row][column].chesses.push(value);
      this.chessQuantity ++;
    }
  }

  /**
   * 将棋子添加到左下独立区域
   * @param value 棋子
   */
  fillLeft(value: T) {
    (this.leftList || (this.leftList = [])).push(value);
    this.chessQuantity ++;
  }

  /**
   * 将棋子添加到右下独立区域
   * @param value 棋子
   */
  fillRight(value: T) {
    (this.rightList || (this.rightList = [])).push(value);
    this.chessQuantity ++;
  }
}
