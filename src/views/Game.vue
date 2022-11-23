<template>
  <div>
    <div
      :class="`chess-viewer ${
        gameState.status === GAME_STATUS.BEGIN ? '' : ''
      }`"
    >
      <div ref="chessBoardRef" :class="`chess-board ${isDev ? 'debug' : ''}`">
        <div v-for="chess in gameState.chessborad?.boardList" :key="chess.idx">
          <div
            :class="getBoardChessClass(chess)"
            :style="getChessStyle(chess)"
            :data-id="chess.idx"
            :data-layer="chess.layer"
            data-is="chess"
            @click="(e: Event) => clickChess(chess, e)"
          >
            <img :src="chess.value" alt="" />
          </div>
        </div>
      </div>

      <div class="random-chess"></div>

      <!-- 槽位 -->
      <div class="chess-slot" :style="getSlotStyle()">
        <div
          v-for="(chess, i) in gameState.chessSlot.list"
          :key="chess?.idx"
          :style="getSlotItemStyle(i)"
          :class="`slot-item ${chess?.hasVal ? '' : 'emtry'}`"
          data-is="slot-item"
        >
          <img :src="chess?.value" />
        </div>
        <Transition name="bounce">
          <div
            v-if="gameState.chessSlot.removeIdx > -1"
            :style="`--offset:${
              gameState.chessSlot.removeIdx *
              GameConfig.columnWidth *
              GameConfig.perChessColumn
            }px;transform: translate(${
              gameState.chessSlot.removeIdx *
              GameConfig.columnWidth *
              GameConfig.perChessColumn
            }px;`"
            class="star"
          />
        </Transition>
      </div>

      <!-- <div class="grass-wrap">
      <img v-for="i in 30" :key="i" :style="getGrassPos(i)" class="grass animate__bounceIn" src="/imgs/grass.png" alt="">
    </div> -->
    </div>

    <div class="blank_area">
      <h1 class="title"></h1>
      <button class="begin_btn" @click="start" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { gameService } from "../business";
import { GameConfig } from "../core";
import { CHESS_STATUS, GAME_STATUS, IChess } from "../types";

const chessBoardRef = ref();
const { gameState, launch, clickChess } = gameService(chessBoardRef);

const isDev = import.meta.env.DEV;

const getBoardChessClass = (chess: IChess): Record<string, boolean> => {
  return {
    "chess-item": true,
    gray: chess.relation.higherSize > 0,
  };
};

const getChessStyle = (chess: IChess): string => {
  const styl: Record<string, string | number> = {
    "z-index": 100 + chess.layer,
    width: `${GameConfig.columnWidth * GameConfig.perChessColumn}px`,
    height: `${GameConfig.rowWidth * GameConfig.perChessRow}px`,
    left: `${chess.x * GameConfig.columnWidth}px`,
    top: `${chess.y * GameConfig.rowWidth}px`,
    "--opacity": `${chess.layer > GameConfig.layers / 2 ? 50 : 70}%`,
    display: `${chess.status !== CHESS_STATUS.DEAD ? "block" : "none"}`,
  };
  return Object.keys(styl).reduce<string>(
    (p, k) => (p += `${k}:${styl[k]};`),
    ""
  );
};

const getSlotStyle = () => {
  const styl: Record<string, any> = {
    width: `${
      GameConfig.fillSize * GameConfig.columnWidth * GameConfig.perChessColumn
    }px`,
    height: `${GameConfig.rowWidth * GameConfig.perChessRow}px`,
  };
  return Object.keys(styl).reduce<string>(
    (p, k) => (p += `${k}:${styl[k]};`),
    ""
  );
};

const getSlotItemStyle = (offset: number) => {
  const styl: Record<string, any> = {
    width: `${GameConfig.columnWidth * GameConfig.perChessColumn}px`,
    height: `${GameConfig.rowWidth * GameConfig.perChessRow}px`,
    "will-change": "auto",
    transform: `translateX(${
      GameConfig.columnWidth * GameConfig.perChessColumn * offset
    }px)`,
  };
  return Object.keys(styl).reduce<string>(
    (p, k) => (p += `${k}:${styl[k]};`),
    ""
  );
};

const getGrassPos = (i: number) => {
  return {
    left: Math.floor(Math.random() * (i + 2) * 100 + i * 10) + "px",
    top: Math.floor(Math.random() * (i + 2) * 200 + i * 10) + "px",
  };
};

onMounted(launch);

const start = () => {
  launch();
  setBgMusic();
};

const setBgMusic = () => {
  const audio = new Audio();
  audio.src = "/music/game_bg_music.mp3";
  audio.muted = true;
  audio.addEventListener("click", () => {
    audio.play();
    audio.muted = false;
  });
  document.body.appendChild(audio);
  audio.click();
};
</script>

<style lang="scss" scoped>
.chess-viewer {
  height: 100vh;
  overflow: hidden;
  background: url(/imgs/bg.png) repeat;
  &.hidden {
    visibility: hidden;
    background: transparent;
    position: absolute;
  }
}
.chess-board {
  margin: 100px auto 0;
  position: relative;
  user-select: none;
  z-index: 11;

  &.debug {
    background: salmon;
  }
}

// 每个棋子
.chess-item {
  position: absolute;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #000;
  box-sizing: border-box;
  will-change: auto;

  &::after {
    content: "";
    display: block;
    position: absolute;
    transition: all 200ms ease-in;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: transparent;
  }

  &.disabled {
    background: rgb(41, 41, 41);
    border: 1px solid #000;
    &::after {
      display: none;
    }
  }

  &.gray {
    cursor: no-drop;
    &::after {
      background: rgba(0 0 0 / var(--opacity));
    }
  }

  img {
    width: 100%;
    height: 100%;
  }
}

// 随机区
.random-chess {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.random-area {
  position: relative;
  margin-top: 8px;
  flex: 1;
}
.random-area.left * {
  position: relative;
  box-shadow: 3px 0 0px rgb(0 0 0 / 10%);
}
.random-area.right * {
  position: relative;
  box-shadow: -3px 0 0px rgb(0 0 0 / 10%);
}

// 槽位
.chess-slot {
  display: flex;
  padding: 22px 16px 26px;
  position: absolute;
  z-index: 10;
  bottom: 100px;
  left: 50%;
  transform: translate(-50%);
  background-image: url(/imgs/slot-bg.png);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  overflow: hidden;

  .slot-item {
    transition: transform 200ms ease-in;
    position: absolute;
    overflow: hidden;
    border-radius: 3px;
    border: 1px solid rgba(0 0 0 / 20%);
    box-sizing: border-box;
    &.emtry {
      border: none;
      img {
        opacity: 0;
      }
    }
    img {
      width: 100%;
      height: 100%;
      opacity: 1;
      transition: all 200ms;
    }
  }
}

.blank_area {
  height: 100vh;
  overflow: hidden;
  background: rgba(0 0 0 / 90%);
  position: relative;
  z-index: 1000;

  .title {
    color: #fff;
    text-align: center;
    margin: 100px auto 0;
    font-size: 6em;
  }

  .begin_btn {
    width: 222px;
    height: 114px;
    background: url(/imgs/play_btn.png);
    background-color: transparent;
    background-position: center center;
    position: absolute;
    bottom: 200px;
    left: 50%;
    transform: translate(-50%);
    cursor: pointer;
    transition: 200ms;
    &:hover {
      transform: translate(-50%) scale(1.1);
    }
  }
}

.grass-wrap {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 0;
  overflow: hidden;

  .grass {
    position: absolute;
    animation: swing-in-bottom-fwd 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)
      infinite;
    animation-delay: 0.3s;
  }
}
@keyframes swing-in-bottom-fwd {
  0% {
    -webkit-transform: rotateX(100deg);
    transform: rotateX(100deg);
    -webkit-transform-origin: bottom;
    transform-origin: bottom;
    opacity: 0;
  }
  100% {
    -webkit-transform: rotateX(0);
    transform: rotateX(0);
    -webkit-transform-origin: bottom;
    transform-origin: bottom;
    opacity: 1;
  }
}

.star {
  visibility: hidden;
  position: absolute;
  width: calc(42 * 3px);
  height: 42px;
  background: transparent;
  background-image: url(/imgs/star.png);
  background-size: auto 100%;
  background-repeat: repeat;
  z-index: 10;
}

.bounce-leave-active {
  visibility: visible;
  animation: bounce-in 0.2s;
}
@keyframes bounce-in {
  0% {
    transform: translate(var(--offset)) scale(1.1);
  }
  50% {
    transform: translate(var(--offset)) scale(1.3);
  }
  100% {
    transform: translate(var(--offset)) scale(0.4);
  }
}

@keyframes to-queue {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.4);
  }
  80% {
    transform: scale(1);
  }
}
</style>
