import { nextTick, reactive, Ref } from "vue";
import { Chess, ChessBoard, CHESS_TYPES, GameConfig } from "../core";
import { ICHESS_ENUM, GAME_STATUS } from "../types";
import { shuffle } from "../utils";

/**
 * 实现游戏过程
 */
export function gameService(dom: Ref<HTMLElement>) {
  // 棋盘
  let chessborad: ChessBoard;
  // 游戏相关数据
  const gameState = reactive({
    status: GAME_STATUS.BEGIN,
    boardChesses: [] as Chess[],
  });

  const clickChess = (chess: Chess) => {
    console.log(chess);
  };

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
    console.log("真正需要的棋子数：", shouldTotal);
    const chessboardTotal = shouldTotal - GameConfig.quantityRandom;
    console.log("棋盘中的棋子数：", chessboardTotal);
    console.log("随机区域的棋子数：", GameConfig.quantityRandom);

    // 渲染棋盘棋子
    const renderChessType = CHESS_TYPES.slice(0, GameConfig.type);
    let fillChessTypeList: ICHESS_ENUM[] = [];
    for (let i = 0; i < shouldTotal; i++) {
      fillChessTypeList.push(renderChessType[i % GameConfig.type]);
    }
    fillChessTypeList = shuffle(fillChessTypeList);
    console.log(fillChessTypeList);
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
    console.log("所有棋子：", allChess);

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
      genPosChess(waitGenChess, i, pos.minX, pos.minY, pos.maxX, pos.maxY);
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
  const genPosChess = (
    chesses: Chess[],
    layer: number,
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
      chess.x + GameConfig.perChessColumn - 1,
      GameConfig.column - (GameConfig.perChessColumn - 1)
    );
    const maxY = Math.min(
      chess.y + GameConfig.perChessRow - 1,
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
          chess.lowers.push(maxLevelRelationBlock);
          maxLevelRelationBlock.highers.push(chess);
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
    console.log("launch...");
    initChessBoard();
    initChess();
  };

  return {
    gameState,
    launch,
    clickChess,
  };
}
