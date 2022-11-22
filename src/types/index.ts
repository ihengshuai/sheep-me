/**
 * 棋子状态
 */
export enum CHESS_STATUS {
  /**
   * 不可点击(被压的)
   */
  UN_CLICKABLE = -1,

  /**
   * 可以点击
   */
  CLICKABLE = 1,

  /**
   * 激活的(正在消除的，放在消除槽中的)
   */
  ACTIVE = 2,

  /**
   * 死亡的(已被成功消除掉的)
   */
  DEAD = 2,
}

/**
 *  棋子属性
 */
export interface IChess {
  /**
   * 层次/第几层
   */
  layer: number;

  /**
   * 棋子在数组中的索引
   */
  idx: number;

  /**
   * 行坐标
   */
  x: number;

  /**
   * 纵坐标
   */
  y: number;

  /**
   * 棋子的状态
   */
  status: CHESS_STATUS;

  /**
   * 类型(属于哪一类的棋子，相同类型的棋子会消除掉)
   */
  type: number | string;

  /**
   * 棋子的值
   */
  value: string;

  /**
   * 棋子之间关系记录
   */
  relation: IChessRelation;

  /**
   * 是否在棋盘中
   */
  inBoard?: boolean;
}

/**
 * 棋子构造器
 */
export type IChessCtor = Omit<
  IChess,
  "relation" | "status" | "x" | "y" | "layer"
>;

/**
 * 棋盘属性
 */
export interface IChessBoard<T> {
  /**
   * 棋盘二维坐标系
   */
  position: Array<Array<{ chesses: T[] }>> | null;

  /**
   * 棋盘列表
   */
  boardList: Array<T> | null;

  /**
   * 左边列表(棋盘下面两个随机区)
   */
  leftList: Array<T> | null;

  /**
   * 右边列表(棋盘下面两个随机区)
   */
  rightList: Array<T> | null;

  /**
   * 行数
   */
  row: number;

  /**
   * 列数
   */
  column: number;

  /**
   * 棋盘中棋子数量
   */
  boardChessTotal: number;

  /**
   * 格子数量
   */
  unitTotal: number;

  /**
   * 所有棋子数量
   */
  readonly allChessTotal: number;
}

/**
 * 棋盘构造器
 */
export type IChessBoardCtor<T> = Pick<
  IChessBoard<T>,
  "row" | "column"
>;

/**
 * 棋子关系
 */
export interface IChessRelation {
  /**
   * 被其它棋子压住的长度
   */
  readonly higherSize: number;

  /**
   * 自己压住棋子的长度
   */
  readonly lowerSize: number;
  /**
   * 解除棋子关系
   */
  removeRelation: () => void;

  /**
   * 添加被其它压住的棋子
   * @param chess 棋子
   */
  pushHigher: (chess: IChess) => void;

  /**
   * 删除被其它压住的棋子
   * @param chess 棋子
   */
  removeHigher: (idx: number) => void;

  /**
   * 添加压住的棋子
   * @param chess 棋子
   */
  pushLower: (chess: IChess) => void;

  /**
   * 删除压住的棋子
   * @param chess 棋子
   */
  removeLower: (idx: number) => void;
}

/**
 * 槽配置
 */
export interface ISlot {
  /**
   * 槽大小
   */
  readonly size: number;
  /**
   * 消掉的数量
   */
  readonly deadChessTotal: number;
  /**
   * 移除的索引
   */
  readonly removeIdx: number;
  /**
   * 槽中存在的数量
   */
  readonly activeSize: number;
  /**
   * 槽数组
   */
  readonly list: Array<
    ({ key: number; hasVal: boolean } & Partial<IChess>) | null
  >;
  /**
   * 插入chess
   */
  insert: (chess: IChess, e: Event, cb?: Function) => void
}

/**
 * 游戏配置
 */
export interface IGameConfig {
  /**
   * 需要的棋子种类
   */
  type: number;

  /**
   * 需要几个才能消除
   */
  removeSize: number;

  /**
   * 填充大小(槽大小)
   */
  fillSize: number;

  /**
   * 层数
   */
  layers: number;

  /**
   * 每层数量
   */
  totalPerLayer: number;

  /**
   * 两个随机区域棋子数量
   */
  randomTotal: number;

  /**
   * 棋盘行数
   */
  row: number;

  /**
   * 棋盘列数
   */
  column: number;

  /**
   * 行宽
   */
  rowWidth: number;

  /**
   * 列宽
   */
  columnWidth: number;

  /**
   * 每个棋子占几列
   */
  perChessRow: number;

  /**
   * 每个棋子占几列
   */
  perChessColumn: number;
}

/**
 * 配置的棋子键值对
 */
export interface ICHESS_ENUM {
  k: string;
  v: any;
}

/**
 * 游戏状态
 */
export enum GAME_STATUS {
  /**
   * 开始
   */
  BEGIN = "begin",

  /**
   * 进行中
   */
  ONGOING = "ongoing",

  /**
   * 成功
   */
  SUCCESS = "success",

  /**
   * 失败
   */
  FAILURE = "failure",
}
