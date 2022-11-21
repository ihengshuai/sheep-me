/**
 * 槽相关
 */

import { nextTick } from "vue";
import { CHESS_STATUS, IChess, ISlot } from "../types";
import { GameConfig } from "./config";

export class Slot implements ISlot{
  private _selector: string;
  private _container: HTMLElement | null = null;
  private _size = 0;
  private _deadChessTotal = 0;
  private _removeIdx = -1;
  private _activeSize = 0;
  private _insertIdx = 0;
  private _slotAllPos: Record<number, { x?: number; y?: number }> = {};
  private _slotList: Array<({key: number;hasVal: boolean;} & Partial<IChess>) | null> = [];

  constructor(selector: string, size: number) {
    this._selector = selector;
    this._size = size;
    this._init();
  }

  get removeIdx() {
    return this._removeIdx;
  }

  get size() {
    return this._size;
  }

  get deadChessTotal() {
    return this._deadChessTotal;
  }

  private _init() {
    if (!this.size) return;
    for (let i = 0; i < this.size; i++) {
      this._slotList.push({
        key: i,
        hasVal: false
      })
    }
  }

  get list() {
    return [...this._slotList];
  }

  get activeSize() {
    return this._activeSize;
  }

  private _setInsertIdx(chess: IChess) {
    let sameTypeIdx = this._slotList.map((c) => c?.type).lastIndexOf(chess.type);
    const insertIdx = sameTypeIdx === -1 ? this._activeSize : sameTypeIdx + 1;
    this._insertIdx = insertIdx;
  }

  async insert(chess: IChess, e: Event, cb?: Function) {
    if (this.activeSize === this.size) return;
    this._setInsertIdx(chess!);
    this._slotList = [
      ...this._slotList.slice(0, this._insertIdx),
      { key: this._slotList[this.size - 1]!.key, hasVal: false },
      ...this._slotList.slice(this._insertIdx)
    ].slice(0, this.size);
    chess?.relation.removeRelation();
    await this.runInsertAnimation(e);
    this._slotList[this._insertIdx] = {
      ...this._slotList[this._insertIdx]!,
      hasVal: true,
      ...chess
    };
    this._activeSize ++;
    chess.status = CHESS_STATUS.ACTIVE;
    await this.doRemove();
    cb?.();
  }

  async doRemove() {
    const record: Record<string | number, {total: number;idx: number[];}> = {};
    let list = this.list;
    for (let i = 0; i < this.activeSize; i ++) {
      const current = list[i]!;
      if (!record[current.type!]) {
        record[current.type!] = {
          total: 1,
          idx: [i]
        }
      } else {
        record[current.type!].total++;
        record[current.type!].idx.push(i);
      }
    }
    Object.keys(record).forEach(t => {
      if (record[t].total === GameConfig.removeSize) {
        this._activeSize -= 3;
        this._deadChessTotal += 3;
        this._removeIdx = record[t].idx[0];
        for (let i = 0; i< record[t].idx.length; i++) {
          list.push({
            key: list[record[t].idx[i]]!.key,
            hasVal: false,
          });
          list[record[t].idx[i]] = null;
        }
      }
    });
    await nextTick();
    this._slotList = list.filter(i => !!i);
    this._removeIdx = -1;
  }

  private runInsertAnimation(e: Event): Promise<void> {
    let eventElem = e.target as HTMLElement;
    let chessElem: HTMLElement;
    while (true) {
      if (eventElem.getAttribute("data-is") === "chess") {
        chessElem = eventElem;
        break;
      }
      eventElem = eventElem.parentElement!;
    }
    return new Promise((resolve) => {
      let x: number, y: number;
      if (this._slotAllPos[this._insertIdx]) {
        x = this._slotAllPos[this._insertIdx].x!;
        y = this._slotAllPos[this._insertIdx].y!;
      } else {
        this._slotAllPos[this._insertIdx] = {};
        this._container = document.querySelector(this._selector) || document.body;
        const destSlot = this._container.querySelectorAll("[data-is='slot-item']")?.[
          this._insertIdx
        ];
        if (!destSlot) return;
        const { left, top } = destSlot.getBoundingClientRect();
        x = this._slotAllPos[this._insertIdx].x = left;
        y = this._slotAllPos[this._insertIdx].y = top;
      }
      const { left: chessX, top: chessY } = chessElem.getBoundingClientRect();
      chessElem?.setAttribute(
        "style",
        `left:${chessX}px;top:${chessY}px;position:fixed;width:${GameConfig.columnWidth * GameConfig.perChessColumn}px;height:${GameConfig.rowWidth * GameConfig.perChessRow}px`
      );
      requestAnimationFrame(() => {
        const styl: Record<string, string | number> = {
          "z-index": 1000,
          width: `${GameConfig.columnWidth * GameConfig.perChessColumn}px`,
          height: `${GameConfig.rowWidth * GameConfig.perChessRow}px`,
          left: `${x}px`,
          top: `${y}px`,
          position: "fixed",
          transition: "all 200ms ease-in-out",
          animation: "to-queue 200ms",
          "will-change": "auto",
        };
        // const originPos = chessElem?.getBoundingClientRect();
        chessElem?.setAttribute(
          "style",
          Object.keys(styl).reduce<string>(
            (p, k) => (p += `${k}:${styl[k]};`),
            ""
          )
        );
        setTimeout(() => {
          // chessElem?.setAttribute("style", `display:none`);
          resolve();
        }, 200);
      });
    });
  }
}
