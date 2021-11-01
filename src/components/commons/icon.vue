<template>
  <svg :viewBox="`0 0 ${w} ${h}`" :width="w" :height="h">
    <path :d="icon" :fill="color"></path>
  </svg>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    icon: {
      type: String,
      default: '',
    },
    w: {
      type: Number,
      default: 24,
    },
    h: {
      type: Number,
      default: 24,
    },
    color: {
      type: String,
      default: 'white',
    },
  },
})
</script>
