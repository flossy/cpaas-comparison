<template>
  <v-menu v-model="open" :close-on-content-click="false" v-bind="$attrs">
    <template v-slot:activator="{ on }">
      <v-btn fab small v-on="on" class="mx-1" dark color="grey">
        <icon :icon="icons.mdiCog" />
      </v-btn>
    </template>
    <v-list width="240">
      <v-list-item>
        <v-select
          dense
          outlined
          hide-details
          label="video device"
          v-model="localVideoDeviceId"
          :items="videoinput"
          item-text="label"
          item-value="deviceId"
        >
        </v-select>
      </v-list-item>
      <v-list-item>
        <v-select
          dense
          outlined
          hide-details
          label="audio device"
          v-model="localAudioDeviceId"
          :items="audioinput"
          item-text="label"
          item-value="deviceId"
        >
        </v-select>
      </v-list-item>
      <v-list-item>
        <v-btn
          block
          color="indigo"
          @click="switchTracks"
          :disabled="!videoSession"
        >
          SWITCH
        </v-btn>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue, { PropType } from 'vue'
import { mdiCog } from '@mdi/js'
import Icon from '@/components/commons/icon.vue'

export default Vue.extend({
  components: { Icon },
  props: {
    videoDeviceId: {
      type: String,
      default: '',
    },
    audioDeviceId: {
      type: String,
      default: '',
    },
    videoinput: {
      type: Array as PropType<any[] | any>,
      default: () => [],
    },
    audioinput: {
      type: Array as PropType<any[] | any>,
      default: () => [],
    },
    videoSession: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    open: false,
    localVideoDeviceId: '',
    localAudioDeviceId: '',
    icons: {
      mdiCog,
    },
  }),
  watch: {
    localVideoDeviceId(newVal) {
      this.$emit('videoDeviceChange', newVal)
    },
    localAudioDeviceId(newVal) {
      this.$emit('audioDeviceChange', newVal)
    },
  },
  mounted() {
    this.localVideoDeviceId = this.videoDeviceId
    this.localAudioDeviceId = this.audioDeviceId
  },
  methods: {
    switchTracks() {
      this.$emit('switchTracks')
    },
  },
})
</script>
