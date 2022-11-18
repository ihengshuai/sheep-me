import { nextTick, reactive, Ref } from "vue";
import Confirm from "../components/confirm";
import { Chess, ChessBoard, CHESS_TYPES, GameConfig } from "../core";
import { ICHESS_ENUM, GAME_STATUS, CHESS_STATUS, IChess } from "../types";
import { shuffle, debug, sleep } from "../utils";

/**
 * 实现游戏过程
 */
export function gameService(dom: Ref<HTMLElement>) {
  // 棋盘
  let chessborad: ChessBoard;
  // 游戏相关数据
  const gameState = reactive({
    /**
     * 游戏状态
     */
    status: GAME_STATUS.BEGIN,
    /**
     * 棋盘中的棋子
     */
    boardChesses: [] as Chess[],
    /**
     * 随机区棋子
     */
    randomAreaChesses: [] as Chess[][],
    /**
     * 棋子死亡数即：成功消掉的数量
     */
    deadChessTotal: 0,
    /**
     * 激活中的数量即：槽中的数量
     */
    activeChessTotal: 0,
    /**
     * 激活的棋子即：槽中的棋子
     */
    activeChesses: new Array(GameConfig.fillSize) as Array<Chess|null>,
    /**
     * 棋子插入位置
     */
    insertIdx: -1,
    /**
     * 需要消掉的位置
     */
    removeIdx: -1,
  });

  let moving = false;

  /**
   * 点击棋子
   * @param chess 棋子
   * @param e 事件源
   * @param isRandom 是否随机区
   */
  const clickChess = async (chess: Chess, e: Event, isRandom: boolean = false) => {
    if (
      gameState.status === GAME_STATUS.FAILURE ||
      chess.relation.higherSize ||
      gameState.activeChessTotal >= GameConfig.fillSize ||
      moving
    ) return;
    moving = true;
    const { activeChesses, activeChessTotal } = gameState;
    let sameTypeIdx = activeChesses.map(c => c?.type).lastIndexOf(chess.type);
    const insertIdx = sameTypeIdx === -1 ? activeChessTotal : sameTypeIdx + 1
    gameState.insertIdx = insertIdx;
    if (sameTypeIdx > -1) {
      // 触发动画
      gameState.activeChesses = [...activeChesses.slice(0, insertIdx), null, ...activeChesses.slice(insertIdx)]
    }
    await nextTick();
    debug("插入位置：", insertIdx);
    chess.relation.removeRelation();
    await runAnimationChessToQueue(e);
    gameState.activeChesses = [...activeChesses.slice(0, insertIdx), chess, ...gameState.activeChesses.slice(insertIdx+1)].slice(0, GameConfig.fillSize);
    gameState.activeChessTotal ++;
    const acitiveSort: Record<string, {total: number;idx: number;}> = {};
    gameState.activeChesses.forEach((c, i) => {
      if (!c) return;
      if (!acitiveSort[c.type]) {
        acitiveSort[c.type] = {
          total: 1,
          idx: i
        }
      } else {
        acitiveSort[c.type].total ++;
      }
      if (acitiveSort[c.type].total === GameConfig.removeSize) {
        gameState.removeIdx = acitiveSort[c.type].idx;
      }
    });
    chess.status = CHESS_STATUS.ACTIVE;
    await sleep();
    moving = false;
    if (gameState.removeIdx !== -1) {
      gameState.deadChessTotal += GameConfig.removeSize;
      gameState.activeChessTotal -= GameConfig.removeSize;
      const newChessQueue = [
        ...gameState.activeChesses.slice(0, gameState.removeIdx),
        ...gameState.activeChesses.slice(gameState.removeIdx + 3)
      ].concat(new Array(GameConfig.fillSize)).slice(0, GameConfig.fillSize);
      gameState.activeChesses = newChessQueue;
      gameState.removeIdx = -1;
    }
    if (gameState.activeChessTotal === GameConfig.fillSize) {
      gameState.status = GAME_STATUS.FAILURE;
      Confirm.$dialog({
        title: "提示",
        content: "失败了",
        showMask: true,
        maskClose: false,
      })
    } else if (gameState.deadChessTotal === chessborad.chessQuantity){
      gameState.status = GAME_STATUS.FAILURE;
      Confirm.$dialog({
        title: "提示",
        content: "成功了",
        showMask: true,
        maskClose: false,
      })
    }
  };

  /**
   * 棋子入槽动画
   */
  const slotAllPos: Record<number, {x?: number, y?: number}> = {};
  const runAnimationChessToQueue = (e: Event): Promise<void> => {
    let eventElem = e.target as HTMLElement;
    let chessElem: HTMLElement;
    while(true) {
      if (eventElem.getAttribute('data-is') === 'chess') {
        chessElem = eventElem;
        break;
      }
      eventElem = eventElem.parentElement!;
    }
    return new Promise((resolve) => {
      const { insertIdx } = gameState;
      let x: number, y: number;
      if (slotAllPos[insertIdx]) {
        x = slotAllPos[insertIdx].x!;
        y = slotAllPos[insertIdx].y!;
      } else {
        slotAllPos[insertIdx] = {};
        const destSlot = document.querySelectorAll("[data-is='slot-item']")?.[insertIdx];
        if (!destSlot) return;
        const { left, top } = destSlot.getBoundingClientRect();
        x = slotAllPos[insertIdx].x = left;
        y = slotAllPos[insertIdx].y = top;
      }
      const { left: chessX, top: chessY } = chessElem.getBoundingClientRect();
      chessElem?.setAttribute("style", `left:${chessX}px;top:${chessY}px;position:fixed;`);
      requestAnimationFrame(() => {
        const styl: Record<string, string | number> = {
          "z-index": 1000,
          "width": `${GameConfig.columnWidth * GameConfig.perChessColumn}px`,
          "height": `${GameConfig.rowWidth * GameConfig.perChessRow}px`,
          "left": `${x}px`,
          "top": `${y}px`,
          "position": "fixed",
          "transition": "all 300ms ease-in-out",
          "animation": "to-queue 300ms",
          "will-change": "auto"
        };
        // const originPos = chessElem?.getBoundingClientRect();
        chessElem?.setAttribute("style", Object.keys(styl).reduce<string>((p, k) => p+=`${k}:${styl[k]};`, ''));
        setTimeout(() => {
          // chessElem?.setAttribute("style", `left:160px;top: 600px;`);
          resolve();
        }, 300);
      })
      
    })
  }

  /**
   * 初始化棋盘
   */
  const initChessBoard = () => {
    if (!dom?.value)
      throw Error("need a root dom ref at function gameService.");
    chessborad = new ChessBoard({
      row: GameConfig.row,
      column: GameConfig.column,
    });
    const rootElemStyle: Record<string, string> = {
      width: `${GameConfig.column * GameConfig.columnWidth}px`,
      height: `${GameConfig.row * GameConfig.rowWidth}px`,
    };
    dom.value.setAttribute(
      "style",
      Object.keys(rootElemStyle).reduce<string>(
        (p, k) => (p += `${k}:${rootElemStyle[k]};` as string),
        ""
      )
    );
  };

  /**
   * 初始化棋子
   */
  const initChess = async () => {
    if (!chessborad) await nextTick();
    // 每个类型消完一次数量
    const perRemoveTotal = GameConfig.type * GameConfig.removeSize;
    const defineTotal =
      GameConfig.layers * GameConfig.quantityPerLayer +
      GameConfig.quantityRandom;
    // 棋子应该是类型的整数倍，才能消除完
    const shouldTotal =
      defineTotal + perRemoveTotal - (defineTotal % perRemoveTotal);
    debug("真正需要的棋子数：", shouldTotal);
    const chessboardTotal = shouldTotal - GameConfig.quantityRandom;
    debug("棋盘中的棋子数：", chessboardTotal);
    debug("随机区域的棋子数：", GameConfig.quantityRandom);

    // 渲染棋盘棋子
    const renderChessType = CHESS_TYPES.slice(0, GameConfig.type);
    let fillChessTypeList: ICHESS_ENUM[] = [];
    for (let i = 0; i < shouldTotal; i++) {
      fillChessTypeList.push(renderChessType[i % GameConfig.type]);
    }
    fillChessTypeList = shuffle(fillChessTypeList);
    const allChess: Chess[] = [];
    for (let i = 0; i < shouldTotal; i++) {
      const curType = fillChessTypeList[i];
      allChess.push(
        new Chess({
          idx: i,
          type: curType.k,
          value: curType.v,
        })
      );
    }

    let leftNoPosChesss = fillChessTypeList.slice(0, chessboardTotal).length;
    let boardChessesIdx = GameConfig.quantityRandom;
    gameState.boardChesses = allChess.slice(boardChessesIdx, chessboardTotal);
    const pos = {
      minX: 0,
      maxX: GameConfig.column - GameConfig.perChessColumn,
      minY: 0,
      maxY: GameConfig.row - GameConfig.perChessRow,
    };
    for (let i = 0; i < GameConfig.layers && leftNoPosChesss; i++) {
      let currentChesss =
        i === GameConfig.layers - 1
          ? leftNoPosChesss
          : Math.min(leftNoPosChesss, GameConfig.quantityPerLayer);
      leftNoPosChesss -= currentChesss;
      // 四个方向加减缩进
      const dir = i % 8;
      if (dir === 0) {
        pos.minX += 1;
      } else if (dir === 1) {
        pos.maxY += 1;
      } else if (dir === 2) {
        pos.minY += 1;
      } else if (dir === 3) {
        pos.maxX -= 1;
      } else if (dir === 4) {
        pos.minX -= 1;
      } else if (dir === 5) {
        pos.maxX += 1;
      } else if (dir === 6) {
        pos.minY -= 1;
      } else {
        pos.maxY -= 1;
      }
      const waitGenChess = allChess.slice(
        boardChessesIdx,
        boardChessesIdx + currentChesss
      );
      boardChessesIdx += currentChesss;
      createChessPos(waitGenChess, pos.minX, pos.minY, pos.maxX, pos.maxY);
      if (leftNoPosChesss <= 0) break;
    }
  };

  /**
   * 为棋子生成坐标
   * @param chesses 当前层的所有棋子
   * @param layer 第几层
   * @param minX x最小偏移
   * @param minY y最小偏移
   * @param maxX x最大偏移
   * @param maxY y最大偏移
   */
  const createChessPos = (
    chesses: Chess[],
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ) => {
    const posRecord = new Set<string>();
    for (let i = 0; i < chesses.length; i++) {
      let x, y, point;
      const chess = chesses[i];
      while (true) {
        // x,y在棋盘内
        x = Math.max(
          0,
          Math.min(
            Math.floor(Math.random() * maxX + minX),
            GameConfig.column - GameConfig.perChessColumn
          )
        );
        y = Math.max(
          0,
          Math.min(
            Math.floor(Math.random() * maxY + minY),
            GameConfig.row - GameConfig.perChessRow
          )
        );
        point = `${x},${y}`;
        if (!posRecord.has(point)) {
          break;
        }
      }
      chessborad.fill(x, y, chess);
      chess.x = x;
      chess.y = y;
      posRecord.add(point);
      genLayerRelation(chess);
    }
  };

  /**
   * 给棋子建立层级关系
   * @param chess 某个棋子
   */
  const genLayerRelation = (chess: Chess) => {
    const minX = Math.max(chess.x - (GameConfig.perChessColumn - 1), 0);
    const minY = Math.max(chess.y - (GameConfig.perChessRow - 1), 0);
    const maxX = Math.min(
      chess.x + GameConfig.perChessColumn,
      GameConfig.column - (GameConfig.perChessColumn - 1)
    );
    const maxY = Math.min(
      chess.y + GameConfig.perChessRow,
      GameConfig.row - (GameConfig.perChessRow - 1)
    );

    // 遍历该块附近的格子
    let maxLevel = 0;
    for (let i = minX; i < maxX; i++) {
      for (let j = minY; j < maxY; j++) {
        const relationBlocks = chessborad.list?.[i][j]?.chesses;
        if (relationBlocks!?.length > 0) {
          const maxLevelRelationBlock =
            relationBlocks![relationBlocks!.length - 1];
          if (maxLevelRelationBlock?.idx === chess.idx) continue;
          maxLevel = Math.max(maxLevel, maxLevelRelationBlock.layer);
          chess.relation.pushLower(maxLevelRelationBlock);
          maxLevelRelationBlock.relation.pushHigher(chess);
        }
      }
    }
    chess.layer = maxLevel + 1;
  };

  /**
   * 启动游戏
   */
  const launch = () => {
    if (gameState.status === GAME_STATUS.ONGOING) return;
    gameState.status = GAME_STATUS.ONGOING;
    debug("launch...");
    initChessBoard();
    initChess();
  };

  return {
    gameState,
    launch,
    clickChess,
  };
}
