<template>
  <div ref="chessBoardRef" class="chess-board">
    <div
      v-for="chess in gameState.boardChesses"
      :key="chess.idx"
      :class="`chess-item ${chess.highers.length > 0 ? 'gray' : ''}`"
      :style="getChessStyle(chess)"
      :data-id="chess.idx"
      @click="clickChess(chess)"
    >
      <img :src="chess.value" alt="" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { gameService } from "../business";
import { Chess, GameConfig } from "../core";

const chessBoardRef = ref();
const { gameState, launch, clickChess } = gameService(chessBoardRef);

const getChessStyle = (chess: Chess): string => {
  const styl: Record<string, string | number> = {
    zIndex: 100 + chess.layer,
    width: `${GameConfig.columnWidth * GameConfig.perChessColumn}px`,
    height: `${GameConfig.rowWidth * GameConfig.perChessRow}px`,
    left: `${chess.x * GameConfig.columnWidth}px`,
    top: `${chess.y * GameConfig.rowWidth}px`,
  };
  return Object.keys(styl).reduce<string>(
    (p, k) => (p += `${k}:${styl[k]};`),
    ""
  );
};

onMounted(launch);
</script>

<style lang="scss" scoped>
.chess-board {
  margin: 100px auto;
  background: salmon;
  position: relative;
}
.chess-item {
  position: absolute;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #000;
  box-sizing: border-box;

  &::after {
    content: "";
    display: none;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: rgba(0 0 0 / 40%);
  }

  &.gray {
    cursor: no-drop;
    &::after {
      display: block;
    }
  }

  img {
    width: 100%;
    height: 100%;
  }
}
</style>
