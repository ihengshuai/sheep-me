import { reactive, Ref } from "vue";
import Confirm from "../components/confirm";
import { Chess, ChessBoard, CHESS_TYPES, GameConfig, Slot } from "../core";
import { ICHESS_ENUM, GAME_STATUS, IChess, ISlot } from "../types";
import { shuffle, debug } from "../utils";

/**
 * 实现游戏过程
 */
export function gameService(dom: Ref<HTMLElement>) {
  // 游戏相关数据
  const gameState = reactive({
    /**
     * 游戏状态
     */
    status: GAME_STATUS.BEGIN,
    /**
     * 棋盘
     */
    chessborad: null as ChessBoard | null,
    /**
     * 槽
     */
    chessSlot: {} as ISlot,
  });

  let moving = false;

  /**
   * 点击棋子
   * @param chess 棋子
   * @param e 事件源
   */
  const clickChess = async (
    chess: IChess,
    e: Event,
    dir?: "RIGHT" | "LEFT"
  ) => {
    if (
      gameState.status === GAME_STATUS.FAILURE ||
      chess.relation.higherSize ||
      gameState.chessSlot.activeSize >= GameConfig.fillSize ||
      moving
    )
      return;
    moving = true;
    gameState.chessSlot.insert(chess, e, () => {
      // if (!chess.inBoard) {
      //   const randomIdx = dir === "LEFT" ? 0 : 1;
      //   gameState.randomAreaChesses[randomIdx] = [
      //     ...gameState.randomAreaChesses[randomIdx].slice(1),
      //   ];
      // }
      moving = false;
      if (gameState.chessSlot.activeSize === GameConfig.fillSize) {
        gameState.status = GAME_STATUS.FAILURE;
        Confirm.$dialog({
          title: "提示",
          content: "失败了",
          showMask: true,
          maskClose: false,
          cancleText: "返回",
          okText: "再来一局",
          onOk: async () => {
            await reLaunch();
          },
          onCancle() {
            gameState.status = GAME_STATUS.BEGIN;
          },
        });
      } else if (
        gameState.chessSlot.deadChessTotal ===
        gameState.chessborad?.allChessTotal
      ) {
        gameState.status = GAME_STATUS.SUCCESS;
        Confirm.$dialog({
          title: "提示",
          content: "成功了",
          showMask: true,
          maskClose: false,
          cancleText: "返回",
          okText: "再来一局",
          onOk: () => {
            reLaunch();
          },
          onCancle() {
            gameState.status = GAME_STATUS.BEGIN;
          },
        });
      }
    });
  };

  /**
   * 初始化棋盘
   */
  const initChessBoard = () => {
    if (!dom?.value)
      throw Error("need a root dom ref at function gameService.");
    gameState.chessborad = new ChessBoard({
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
    return new Promise((resolve) => {
      const perRemoveTotal = GameConfig.type * GameConfig.removeSize;
      const defineTotal =
        GameConfig.layers * GameConfig.totalPerLayer + GameConfig.randomTotal;
      // 棋子应该是类型的整数倍，才能消除完
      const shouldTotal =
        defineTotal + perRemoveTotal - (defineTotal % perRemoveTotal);
      debug("真正需要的棋子数：", shouldTotal);
      const chessboardTotal = shouldTotal - GameConfig.randomTotal;
      debug("棋盘中的棋子数：", chessboardTotal);
      debug("随机区域的棋子数：", GameConfig.randomTotal);

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

      let boardChessesIdx = GameConfig.randomTotal;
      const randomList = allChess.slice(0, boardChessesIdx);
      for (let i = 0; i < GameConfig.randomTotal; i++) {
        if (i % 2) {
          gameState.chessborad?.fillLeft(randomList[i]);
        } else {
          gameState.chessborad?.fillRight(randomList[i]);
        }
      }
      let leftNoPosChesss = fillChessTypeList.slice(boardChessesIdx).length;
      gameState.chessborad!.boardList = allChess.slice(boardChessesIdx);
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
            : Math.min(leftNoPosChesss, GameConfig.totalPerLayer);
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
      resolve(true);
    });
  };

  /**
   * 初始化槽
   */
  const initSlot = () => {
    gameState.chessSlot = new Slot(".chess-slot", GameConfig.fillSize);
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
    chesses: IChess[],
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
      gameState.chessborad?.fill(x, y, chess);
      chess.x = x;
      chess.y = y;
      chess.inBoard = true;
      posRecord.add(point);
      genLayerRelation(chess);
    }
  };

  /**
   * 给棋子建立层级关系
   * @param chess 某个棋子
   */
  const genLayerRelation = (chess: IChess) => {
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
        const relationBlocks = gameState.chessborad?.position?.[i][j]?.chesses;
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
    initChessBoard();
    initChess();
    initSlot();
  };

  const reLaunch = async () => {
    await initChess();
    await initSlot();
    gameState.status = GAME_STATUS.ONGOING;
  };

  return {
    gameState,
    launch,
    clickChess,
  };
}
