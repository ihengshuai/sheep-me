/**
 * 打乱数组
 * @param arr 原数组
 * @returns 打乱后的数组
 */
export function shuffle(arr: any[]) {
  let m = arr.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}


/**
 * log日志
 * @param msg 内容
 */
export function debug(...msg: any[]) {
  if(import.meta.env.DEV) {
    console.log(...msg)
  }
}

/**
 * 间停
 * @param time 间停时间
 * @returns promise
 */
export function sleep(time: number = 18) {
  return new Promise(resolve => setTimeout(resolve, time));
}
