/**
 * 槽相关
 */

import { IChess } from "../types";

export interface ISlot {
  /**
   * 真实长度
   */
  size: number;

  container: Array<{ type: string; idx: number }>;
}

export class Slot {
  size = 0;
  private _fillSize = 0;

  private _container: Record<string, IChess | null> = {};

  constructor(size: number) {
    this.size = size;
    this._init();
  }

  private _init() {
    if (!this.size) return;
    for (let i = 0; i < this.size; i++) {
      if (!this._container) this._container = {};
      this._container[`${i}`] = null;
    }
  }

  get value() {
    return Object.keys(this._container).reduce<Array<{ key: string } & IChess>>(
      (p, c) => {
        p.push({ key: c, ...(this._container[c] as IChess) });
        return p;
      },
      []
    );
  }

  get fillSize() {
    return Object.keys(this._container).filter((k) => !!this._container[k])
      .length;
  }

  add(chess: IChess | null, insertIdx: number = 0) {
    if (this.fillSize === this.size) return;
    if (!this._container[insertIdx]) {
      return (this._container[insertIdx] = chess);
    }
    const oldAfterInsertList = this.value.slice(insertIdx, this.fillSize);
    let max = oldAfterInsertList.length,
      i = 0;
    for (; max > 0; ) {
      this._container[this.fillSize - i] = { ...oldAfterInsertList[max--] };
      i++;
    }
    this._container[insertIdx] = chess;
  }
}
