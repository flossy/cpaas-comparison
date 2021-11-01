<template>
  <v-app class="cpaas-comparison">
    <v-card
      :loading="isBusy"
      v-bind="$attrs"
      :class="['quick-wrap', { ios: iOS }]"
      style="background: transparent"
    >
      <v-card-title>
        <span>QUICKBLOX</span>
        <v-spacer />
        <v-chip x-small label class="mx-1">{{ status || 'no status' }}</v-chip>
        <v-chip x-small dark label :color="!connect ? '#BDBDBD' : '#3F51B5'"
          >CONNECTED</v-chip
        >
      </v-card-title>
      <v-divider />
      <div v-if="videoSession" class="stream">
        <video id="localStream"></video>
        <video id="remoteStream"></video>
        <img
          v-if="['call', 'onCall'].includes(status)"
          class="call-icon"
          src="@/assets/phone-solid.svg"
        />
        <v-row class="ctl">
          <SwitchTracks
            :videoDeviceId="videoDeviceId"
            :audioDeviceId="audioDeviceId"
            :videoinput="videoinput"
            :audioinput="audioinput"
            :videoSession="Boolean(videoSession)"
            @videoDeviceChange="(v) => (videoDeviceId = v)"
            @audioDeviceChange="(v) => (audioDeviceId = v)"
            @switchTracks="switchTracks"
          />
          <v-btn fab small class="mx-1" color="#2196F3" @click="toggleAudio">
            <icon v-if="muted.audio" :icon="icons.mdiMicrophoneOff" />
            <icon v-else :icon="icons.mdiMicrophone" />
          </v-btn>
          <v-btn fab small class="mx-1" color="#2196F3" @click="toggleVideo">
            <icon v-if="muted.video" :icon="icons.mdiVideoOff" />
            <icon v-else :icon="icons.mdiVideo" />
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="['call', 'connected'].includes(status)"
            fab
            small
            class="mx-1"
            color="#D32F2F"
            @click="onStop"
          >
            <icon :icon="icons.mdiPhoneOff" />
          </v-btn>
          <template v-if="status === 'onCall'">
            <v-btn
              fab
              small
              color="#D32F2F"
              class="mx-1"
              @click="onReject(null, { msg: 'rejected me.' })"
            >
              <icon :icon="icons.mdiClose" />
            </v-btn>
            <v-btn fab small class="mx-1" color="#4CAF50" @click="onAccept()">
              <icon :icon="icons.mdiPhone" />
            </v-btn>
          </template>
        </v-row>
      </div>
      <v-card-text>
        <div class="mb-4">
          <input v-model="mode" type="radio" value="offer" /> offer
          <input v-model="mode" type="radio" value="answer" /> answer
          <v-chip small label>{{ userId }}</v-chip>
        </div>
        <div class="mb-2">
          <v-btn x-small @click="createSession">createSession</v-btn>
          <v-btn x-small @click="connectChat">connectChat</v-btn>
          <v-btn x-small @click="createDialog" :disabled="!session || !connect">
            createDialog
          </v-btn>
          <v-btn x-small @click="createVideoSession" :disabled="!connect">
            createVideoSession
          </v-btn>
        </div>
        <div v-if="dialog">
          <v-text-field v-model="message" placeholder="Input Message...">
            <template v-slot:append-outer>
              <v-btn x-small @click="sendMessage" color="#4CAF50">SEND</v-btn>
            </template>
          </v-text-field>
        </div>
        <v-btn
          x-small
          :disabled="status !== 'connected'"
          @click="
            onUpdate({
              userInfo: {
                videoFilter: 'sepica',
              },
            })
          "
        >
          onUpdate
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-btn
          block
          x-large
          dark
          color="#3F51B5"
          @click="onCall"
          :disabled="!connect || status !== ''"
          >onCall</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-app>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue'
import QB from 'quickblox/quickblox'
import SwitchTracks from '@/components/SwitchTracks.vue'
import Icon from '@/components/commons/icon.vue'
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

Vue.prototype.$vuetify = { rtl: false, theme: { isDark: true } }

const CREDENTIALS = {
  appId: Number(process.env.VUE_APP_QB_APP_ID),
  authKey: process.env.VUE_APP_QB_AUTH_KEY,
  authSecret: process.env.VUE_APP_QB_SECRET,
  accountKey: process.env.VUE_APP_QB_ACCOUNT_KEY,
}

const CONFIG = {
  // endpoints: {
  //   api: 'apicustomdomain.quickblox.com', // set custom API endpoint
  //   chat: 'chatcustomdomain.quickblox.com', // set custom Chat endpoint
  // },
  chatProtocol: {
    active: 2, // set 1 to use BOSH, set 2 to use WebSockets (default)
  },
  /**
   * set { mode: 1 } or true to output to console,
   * set { mode: 2, file: 'log.txt' } to output to file,
   * set "false" to not output
   */
  debug: { mode: false },
}

const users = {
  offer: {
    login: process.env.VUE_APP_QB_USER_1_LOGIN,
    password: process.env.VUE_APP_QB_USER_1_PASSWORD,
    userId: Number(process.env.VUE_APP_QB_USER_1_ID),
  },
  answer: {
    login: process.env.VUE_APP_QB_USER_2_LOGIN,
    password: process.env.VUE_APP_QB_USER_2_PASSWORD,
    userId: Number(process.env.VUE_APP_QB_USER_2_ID),
  },
}
const mediaParams = {
  audio: { deviceId: localStorage.getItem('qbaudio') || true },
  video: { deviceId: localStorage.getItem('qbvideo') || true },
  options: {
    muted: true,
    mirror: true,
  },
  elemId: 'localStream',
}
const llog = (message: string, ...args: unknown[]) => {
  console.log(
    `%c${message}`,
    'color:white;background:brown;padding:.2em 1em;border-radius:3px;',
    args
  )
}

interface QBData {
  mode: string
  isBusy: boolean
  session: any
  connect: any
  dialog: any
  message: string
  messages: any
  videoSession: any
  status: string
  extention: any
  icons: any
  muted: {
    video: boolean
    audio: boolean
  }
  videoinput: any
  audioinput: any
  videoDeviceId: string
  audioDeviceId: string
}

export default Vue.extend({
  name: 'QuickBlocx',
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
  data(): QBData {
    return {
      mode: localStorage.getItem('qb') || '',
      isBusy: false,
      session: null,
      connect: null,
      dialog: null,
      message: '',
      messages: [],
      videoSession: null,
      status: '',
      extention: null,
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
      videoinput: [],
      audioinput: [],
      videoDeviceId: localStorage.getItem('qbvideo') || '',
      audioDeviceId: localStorage.getItem('qbaudio') || '',
    }
  },
  watch: {
    mode: function (newVal, oldVal) {
      localStorage.setItem('qb', newVal || '')
      if (!oldVal && newVal) this.init()
    },
    videoDeviceId: function (n) {
      localStorage.setItem('qbvideo', n || '')
    },
    audioDeviceId: function (n) {
      localStorage.setItem('qbaudio', n || '')
    },
  },
  computed: {
    iOS() {
      return window?.cordova?.platformId === 'ios'
    },
    userId(): number {
      return users[this.mode === 'offer' ? 'offer' : 'answer'].userId
    },
  },
  mounted() {
    this.init()
    console.log(this.$vuetify)
    console.log(CREDENTIALS)
  },
  methods: {
    async init() {
      QB.init(
        CREDENTIALS.appId,
        CREDENTIALS.authKey,
        CREDENTIALS.authSecret,
        CREDENTIALS.accountKey,
        CONFIG
      )
      this.addListeners()
      if (this.mode) {
        await this.connectChat()
        await this.getMediaDevices()
      }
    },
    async createSession() {
      this.isBusy = true
      this.session = await new Promise((resolve, reject) => {
        const user = users[this.mode === 'offer' ? 'offer' : 'answer']
        const params = {
          login: user.login,
          password: user.password,
        }
        QB.createSession(params, (error: any, result: any) => {
          if (error) reject(error)
          else resolve(result)
        })
      })
      this.isBusy = false
    },
    async connectChat() {
      this.isBusy = true
      this.connect = await new Promise((resolve, reject) => {
        const user = users[this.mode === 'offer' ? 'offer' : 'answer']
        const userCredentials = {
          userId: user.userId,
          password: user.password,
        }
        QB.chat.connect(userCredentials, (error: any, contactList: any) => {
          if (error) reject(error)
          else resolve(contactList)
        })
      })
      this.isBusy = false
    },
    async createDialog() {
      this.isBusy = true
      const params = {
        type: 3,
        occupants_ids:
          this.mode === 'offer' ? [users.answer.userId] : [users.offer.userId],
      }
      this.dialog = await new Promise((resolve, reject) => {
        QB.chat.dialog.create(params, function (error: any, dialog: any) {
          if (error) reject(error)
          else resolve(dialog)
        })
      })
      this.isBusy = false
    },
    onMessage(userId: number, message: any) {
      console.log(userId, message)
    },
    sendMessage() {
      let message = {
        type: 'chat',
        body: this.message,
        extension: {
          save_to_history: 1,
          dialog_id: this.dialog._id,
        },
        markable: 1,
      }
      const opponentId =
        this.mode === 'offer' ? users.answer.userId : users.offer.userId
      Object.assign(message, { id: QB.chat.send(opponentId, message) })
    },
    onDisconnectedListener() {
      console.log('onDisconnected :::::')
    },
    onDisconnected() {
      QB.chat.disconnect()
    },
    onReconnectListener() {
      console.log('onReconnect :::::')
    },
    async createVideoSession() {
      const calleesIds = [
        this.mode === 'offer' ? users.answer.userId : users.offer.userId,
      ]
      const sessionType = QB.webrtc.CallType.VIDEO
      const additionalOptions = {}
      this.videoSession = await QB.webrtc.createNewSession(
        calleesIds,
        sessionType,
        null,
        additionalOptions
      )
      await new Promise((resolve, reject) => {
        console.log('mediaParams :::::', mediaParams)
        this.videoSession.getUserMedia(
          mediaParams,
          function (error: any, stream: any) {
            if (error) reject(error)
            else resolve(stream)
          }
        )
      })
    },
    async onCall() {
      await this.createVideoSession()
      this.status = 'call'
      const extension = {}
      this.videoSession.call(extension, (error: any) => {
        llog('onCall', error)
      })
    },
    onCallListener(session: any, extension: any) {
      this.status = 'onCall'
      this.videoSession = session
      this.extention = extension
      this.videoSession.getUserMedia(
        mediaParams,
        function (error: any, stream: any) {
          console.log('onCallListener:getUserMedia :::::', { error, stream })
        }
      )
    },
    onAccept(extension = {}) {
      this.videoSession.accept(extension)
    },
    onAcceptCallListener(session: any, userId: number, extension: any) {
      this.status = 'accept'
      console.log('onAcceptCallListener :::::', { session, userId, extension })
    },
    onRemoteStreamListener(session: any, userID: number, remoteStream: any) {
      this.status = 'connected'
      console.log('onRemoteStreamListener', { session, userID, remoteStream })
      this.videoSession = session
      this.videoSession.attachMediaStream('remoteStream', remoteStream)
    },
    onReject(extension = {}) {
      this.status = 'reject'
      this.videoSession.reject(extension)
      this.closing()
    },
    onRejectCallListener(session: any, userId: number, extension: any) {
      this.status = 'rejected'
      console.log('onRejectCallListener :::::', { session, userId, extension })
      this.closing()
    },
    onStop(extension = {}) {
      this.status = 'stop'
      this.videoSession.stop(extension)
      this.closing()
    },
    onStopCallListener(session: any, userId: number, extension: any) {
      this.status = 'close'
      console.log('onStopCallListener :::::', { session, userId, extension })
      this.closing()
    },
    onUpdate(extension = {}) {
      this.videoSession.update(extension)
    },
    onUpdateCallListener(session: any, userId: number, extension: any) {
      console.log('onUpdateCallListener :::::', { session, userId, extension })
    },
    closing() {
      this.status = ''
      this.videoSession = null
    },
    toggleVideo() {
      this.muted.video = !this.muted.video
      if (this.muted.video) this.videoSession.mute('video')
      else this.videoSession.unmute('video')
    },
    toggleAudio() {
      this.muted.audio = !this.muted.audio
      if (this.muted.audio) this.videoSession.mute('audio')
      else this.videoSession.unmute('audio')
    },
    async getMediaDevices() {
      this.videoinput = await QB.webrtc.getMediaDevices('videoinput')
      this.audioinput = await QB.webrtc.getMediaDevices('audioinput')
    },
    switchTracks() {
      const deviceIds = {
        audio: this.audioDeviceId,
        video: this.videoDeviceId,
      }
      const callback = (error: any, stream: any) => {
        console.log('switchMediaTracks :::::', { error, stream })
      }
      this.videoSession.switchMediaTracks(deviceIds, callback)
    },
    addListeners() {
      QB.chat.onMessageListener = this.onMessage
      QB.chat.onDisconnectedListener = this.onDisconnectedListener
      QB.chat.onReconnectListener = this.onReconnectListener
      QB.webrtc.onCallListener = this.onCallListener
      QB.webrtc.onAcceptCallListener = this.onAcceptCallListener
      QB.webrtc.onRemoteStreamListener = this.onRemoteStreamListener
      QB.webrtc.onRejectCallListener = this.onRejectCallListener
      QB.webrtc.onStopCallListener = this.onStopCallListener
      QB.webrtc.onUpdateCallListener = this.onUpdateCallListener
      QB.webrtc.onCallStatsReport = (
        session: any,
        userId: number,
        stats: any,
        error: any
      ) => {
        console.log('onCallStatsReport :::::', {
          session,
          userId,
          stats,
          error,
        })
      }
      QB.webrtc.onSessionConnectionStateChangedListener = (
        session: any,
        userId: number,
        connectionState: any
      ) => {
        llog('onSessionConnectionStateChangedListener :::::', {
          session,
          userId,
          connectionState,
        })
      }
      QB.webrtc.onUserNotAnswerListener = (session: any, userId: number) => {
        llog('onUserNotAnswerListener :::::', { session, userId })
      }
    },
  },
})
</script>

<style lang="scss" scoped>
::v-deep {
  .v-application--wrap {
    min-height: auto;
  }
}
.cpaas-comparison {
  padding: 10px;
  text-align: left;
}
.stream {
  width: 100%;
  height: 360px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
#localStream {
  position: absolute;
  width: 120px;
  height: 90px;
  z-index: 1;
  border: 1px solid #ccc;
  top: 0;
  left: 0;
}
#remoteStream {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  border: 1px solid #ccc;
}
.ctl {
  position: absolute;
  bottom: 10px;
  z-index: 4;
  width: 95%;
  margin: 0;
}
.setting {
  width: 320px;
  select,
  button {
    width: 100%;
  }
}
.call-icon {
  display: block;
  width: 60px;
  animation: 1.2s linear -1s infinite running oncall;
  z-index: 10;
}
.quick-wrap.ios {
  #localStream {
    z-index: -1;
  }
  #remoteStream {
    z-index: -2;
  }
  .v-card {
    background: transparent !important;
  }
}
@keyframes oncall {
  0% {
    transform: rotate(0deg);
  }
  8% {
    transform: rotate(5deg) translateY(-10px);
  }
  16% {
    transform: rotate(-5deg) translateY(-10px);
  }
  24% {
    transform: rotate(8deg);
  }
  32% {
    transform: rotate(-8deg);
  }
  40% {
    transform: rotate(5deg);
  }
  44% {
    transform: rotate(-3deg);
  }
  48% {
    transform: rotate(-5deg);
  }
  52% {
    transform: rotate(3deg);
  }
  56% {
    transform: rotate(0deg);
  }
}
</style>
