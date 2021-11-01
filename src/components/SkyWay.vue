<template>
  <v-app class="cpaas-comparison">
    <v-card
      v-bind="$attrs"
      :class="['connection-wrap', { ios }]"
      :loading="isBusy"
      color="#4CAF50"
      style="background: transparent"
    >
      <v-card-title>
        <span>SkyWay</span>
        <v-spacer />
        <v-chip class="mx-1" small label v-text="state || 'idle'" />
        <v-chip small label v-if="open" v-text="peer.id" />
      </v-card-title>
      <v-divider />
      <div
        class="stream"
        v-show="['toCall', 'onCall', 'onStream'].includes(state)"
      >
        <video id="localStream" />
        <video id="remoteStream" />
        <v-row no-gutters class="ctl">
          <SwitchTracks
            :videoDeviceId="videoDeviceId"
            :audioDeviceId="audioDeviceId"
            :videoinput="videoinput"
            :audioinput="audioinput"
            :videoSession="Boolean(localStream)"
            @videoDeviceChange="(v) => (videoDeviceId = v)"
            @audioDeviceChange="(v) => (audioDeviceId = v)"
            @switchTracks="switchTracks"
          />
          <v-btn fab small class="mx-1" color="#2196F3" @click="muteAudio">
            <icon v-if="muted.audio" :icon="icons.mdiMicrophoneOff" />
            <icon v-else :icon="icons.mdiMicrophone" />
          </v-btn>
          <v-btn fab small class="mx-1" color="#2196F3" @click="muteVideo">
            <icon v-if="muted.video" :icon="icons.mdiVideoOff" />
            <icon v-else :icon="icons.mdiVideo" />
          </v-btn>
          <v-spacer />
          <v-btn fab small class="mx-1" color="#D32F2F" @click="toClose">
            <icon :icon="icons.mdiPhoneOff" />
          </v-btn>
        </v-row>
        <v-banner
          class="on-call"
          single-line
          elevation="3"
          v-if="state === 'onCall'"
        >
          <template v-slot:icon>
            <icon :icon="icons.mdiPhone" color="green" />
          </template>
          <span>着信です</span>
          <template v-slot:actions>
            <v-btn v-text="'Reject'" text color="#D32F2F" @click="toClose" />
            <v-btn v-text="'Accept'" text color="#4CAF50" @click="onAccept" />
          </template>
        </v-banner>
      </div>
      <v-card-text>
        <!-- <p>
          <label>
            <input type="radio" v-model="mode" value="offer" /> Offer
          </label>
          <label>
            <input type="radio" v-model="mode" value="answer" /> Answer
          </label>
        </p> -->
        <p>
          <v-btn small @click="init" v-text="'init'" />
          <v-btn small @click="toClose" v-text="'close'" />
          <v-btn small @click="peerCheck" v-text="'peerCheck'" />
          <v-btn small @click="onDestroyPeer" v-text="'onDestroyPeer'" />
        </p>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-row no-gutters>
          <v-col cols="10">
            <v-text-field v-model="theirId" outlined dense hide-details />
          </v-col>
          <v-col cols="2">
            <v-btn
              color="primary"
              :dark="Boolean(theirId)"
              v-text="'CALL'"
              height="100%"
              :disabled="!theirId"
              @click="toCall"
            />
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-app>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue'
import Peer, { MediaConnection } from 'skyway-js'
import SwitchTracks from '@/components/SwitchTracks.vue'
import Icon from '@/components/commons/icon.vue'
import { llog, isIOS } from '../utls/common'
import colors from 'vuetify/lib/util/colors'
import {
  mdiClose,
  mdiCheck,
  mdiMicrophone,
  mdiMicrophoneOff,
  mdiVideo,
  mdiVideoOff,
  mdiPhone,
  mdiPhoneOff,
} from '@mdi/js'
import {
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VDivider,
  VBtn,
  VSpacer,
  VChip,
  VRow,
} from 'vuetify/lib'

Vue.prototype.$vuetify = {
  rtl: false,
  theme: {
    isDark: false,
    themes: {
      light: {
        primary: colors.red,
      },
    },
  },
}

const KEY = process.env.VUE_APP_SW_KEY || ''

interface SWData {
  isBusy: boolean
  peer: Peer | null
  open: boolean
  localStream: any
  remoteStream: any
  theirId: string
  mediaConnection: any
  ios: boolean
  mode: string
  state: string
  videoinput: any
  audioinput: any
  videoDeviceId: string
  audioDeviceId: string
  icons: any
  muted: {
    audio: boolean
    video: boolean
  }
}

export default Vue.extend({
  components: {
    SwitchTracks,
    Icon,
    VCard,
    VCardTitle,
    VCardText,
    VCardActions,
    VDivider,
    VBtn,
    VSpacer,
    VChip,
    VRow,
  },
  data(): SWData {
    return {
      isBusy: false,
      peer: null,
      open: false,
      localStream: null,
      remoteStream: null,
      theirId: '',
      mediaConnection: null,
      ios: isIOS(),
      mode: localStorage.getItem('sw') || '',
      state: '',
      videoinput: [],
      audioinput: [],
      videoDeviceId: localStorage.getItem('swvideo') || '',
      audioDeviceId: localStorage.getItem('swaudio') || '',
      icons: {
        mdiClose,
        mdiCheck,
        mdiMicrophone,
        mdiMicrophoneOff,
        mdiVideo,
        mdiVideoOff,
        mdiPhone,
        mdiPhoneOff,
      },
      muted: {
        video: false,
        audio: false,
      },
    }
  },
  watch: {
    mode: function (newVal) {
      localStorage.setItem('sw', newVal)
      this.init()
    },
    videoDeviceId: function (n) {
      localStorage.setItem('swvideo', n || '')
    },
    audioDeviceId: function (n) {
      localStorage.setItem('swaudio', n || '')
    },
  },
  mounted() {
    llog('mode', this.mode)
    this.$vuetify.theme.themes.light.primary = colors.red
    this.init()
  },
  methods: {
    resetPeer() {
      if (this.peer) {
        this.open = false
        this.peer.off('open', this.onOpen)
        this.peer.off('call', this.onCall)
        this.peer.off('close', this.toClose)
        this.peer.off('error', this.onError)
      }
      this.onDestroyPeer()
      this.peer = null
    },
    async init(): Promise<void> {
      this.isBusy = true
      this.resetPeer()
      this.peer = await new Peer({
        key: KEY,
        debug: 2,
      })
      llog('peer', this.peer)
      this.peer.on('open', this.onOpen)
      this.peer.on('call', this.onCall)
      this.peer.on('close', this.toClose)
      this.peer.on('error', this.onError)
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.videoinput = devices.filter((d) => d.kind === 'videoinput')
      this.audioinput = devices.filter((d) => d.kind === 'audioinput')
      this.isBusy = false
    },
    localSetup(): Promise<boolean> {
      return navigator.mediaDevices
        .getUserMedia({
          video: { deviceId: this.videoDeviceId },
          audio: { deviceId: this.audioDeviceId },
        })
        .then((stream) => {
          this.localStream = stream
          this.attachStream('localStream')
          return true
        })
        .catch((error) => {
          console.error('mediaDevice.getUserMedia() error:', error)
          return false
        })
    },
    onOpen() {
      llog('peer opened')
      this.open = true
    },
    onDestroyPeer() {
      this.peer?.destroy()
    },
    async onCall(mediaConnection: MediaConnection) {
      if (this.mediaConnection) return llog('通話中')
      this.state = 'onCall'
      if (!this.localStream) await this.localSetup()
      this.mediaConnection = mediaConnection
    },
    async onAccept() {
      llog('onAccept')
      this.state = 'onAccept'
      this.mediaConnection.answer(this.localStream)
      this.addMediaConnectionListeners()
    },
    async toCall() {
      if (!this.peer || !this.peer.open) return
      if (!this.localStream) await this.localSetup()
      if (!this.localStream) return
      this.state = 'toCall'
      this.mediaConnection = this.peer.call(this.theirId, this.localStream)
      llog('mediaConnection', this.mediaConnection)
      this.addMediaConnectionListeners()
    },
    peerCheck() {
      llog('peer.open', this.peer?.open)
    },
    toClose() {
      this.state = 'toClose'
      llog('toClose')
      this.mediaConnection?.close(true)
      this.onClose()
    },
    onError(err: any) {
      llog('error:', err.type, err.message)
    },
    addMediaConnectionListeners() {
      this.mediaConnection.on('stream', this.onStream)
      this.mediaConnection.once('close', this.onClose)
    },
    attachStream(target: 'remoteStream' | 'localStream') {
      const elm = document.getElementById(target) as HTMLVideoElement
      elm.srcObject = this[target]
      elm.play()
    },
    dettachStream(target: 'remoteStream' | 'localStream') {
      const elm = document.getElementById(target) as HTMLVideoElement
      const tracks = elm.srcObject as any
      tracks?.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      elm.srcObject = null
    },
    onStream(stream: MediaStream) {
      this.state = 'onStream'
      this.remoteStream = stream
      this.attachStream('remoteStream')
    },
    onClose() {
      this.state = 'onClose'
      this.dettachStream('remoteStream')
      this.dettachStream('localStream')
      this.localStream = this.remoteStream = this.mediaConnection = null
      this.muted.audio = this.muted.video = false
      llog('通信が切断しました。')
    },
    muteVideo() {
      this.muted.video = !this.muted.video
      this.localStream
        .getVideoTracks()
        .forEach(
          (track: MediaStreamTrack) => (track.enabled = !this.muted.video)
        )
    },
    muteAudio() {
      this.muted.audio = !this.muted.audio
      this.localStream
        .getAudioTracks()
        .forEach(
          (track: MediaStreamTrack) => (track.enabled = !this.muted.audio)
        )
    },
    async switchTracks() {
      await this.localSetup()
      this.mediaConnection.replaceStream(this.localStream)
    },
  },
})
</script>

<style lang="scss" scoped>
@import '../assets/common.scss';
.on-call {
  position: absolute;
  z-index: 100;
  border-radius: 7px;
  background: #fff !important;
}
</style>
