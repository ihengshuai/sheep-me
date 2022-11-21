import { IChess, IChessRelation } from "../types";

/**
 * 棋子关系
 */
export class ChessRelation implements IChessRelation {
  /**
   * 被其它压住的棋子
   */
  private _highers: Map<number, IChess> | null = new Map();
  /**
   * 压住其它的棋子
   */
  private _lowers: Map<number, IChess> | null = new Map();
  /**
   * 棋子id
   */
  private _idx: number;

  constructor(idx: number) {
    this._idx = idx;
  }

  get higherSize() {
    return this._highers?.size || 0;
  }

  get lowerSize() {
    return this._lowers?.size || 0;
  }

  /**
   * 释放资源
   */
  private free() {
    if (!this.lowerSize) this._lowers = null;
    if (!this.higherSize) this._highers = null;
  }

  removeRelation() {
    this._lowers?.forEach((lower) => {
      lower.relation.removeHigher(this._idx);
      this.removeLower(lower.idx);
    });

    // 尝试释放资源
    this.free();
  }

  pushHigher(chess: IChess) {
    this._highers?.set(chess.idx, chess);
  }

  removeHigher(idx: number) {
    this._highers?.delete(idx);
  }

  pushLower(chess: IChess) {
    this._lowers?.set(chess.idx, chess);
  }

  removeLower(idx: number) {
    this._lowers?.delete(idx);
  }
}
