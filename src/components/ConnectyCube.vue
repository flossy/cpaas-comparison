<template>
  <v-app class="cpaas-comparison">
    <v-card
      :loading="isBusy"
      v-bind="$attrs"
      :class="['connecty-wrap', { ios: iOS }]"
      style="background: transparent"
    >
      <v-card-title>
        <span>ConnectyCube</span>
        <v-spacer />
        <v-chip
          small
          :color="!chatConnected ? '#BDBDBD' : '#3F51B5'"
          dark
          label
          :outlined="!chatConnected"
          >CHAT CONNECTED</v-chip
        >
        <v-chip small label outlined color="#BDBDBD">{{
          callState || 'none'
        }}</v-chip>
      </v-card-title>
      <v-divider />
      <div class="stream" v-if="videoSession">
        <video id="localStream"></video>
        <video id="remoteStream"></video>
        <div class="receive" v-if="callState === 'receive'">
          <div class="title mb-4">CALL RECIVE...</div>
          <div>
            <v-btn
              fab
              color="#D32F2F"
              class="mx-1"
              @click="onReject(null, { msg: 'rejected me.' })"
            >
              <icon :icon="icons.mdiClose" />
            </v-btn>
            <v-btn fab color="#4CAF50" class="mx-1" @click="onAccept">
              <icon :icon="icons.mdiCheck" />
            </v-btn>
          </div>
        </div>
        <div class="onCall" v-if="callState === 'onCall'">
          <div class="title mb-4">CALLING...</div>
          <p>
            <v-btn fab color="#D32F2F" @click="onStop">
              <icon :icon="icons.mdiClose" />
            </v-btn>
          </p>
        </div>
        <v-row class="ctl" v-if="callState === 'remoteConnected'">
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
          <v-btn fab small class="mx-1" color="#D32F2F" @click="onStop">
            <icon :icon="icons.mdiPhoneOff" />
          </v-btn>
        </v-row>
        <div class="debug" v-if="videoSession">
          {{ videoSession.ID }}
        </div>
      </div>
      <v-card-text>
        <div class="mb-4">
          <input type="radio" v-model="mode" value="offer" /> Offer
          <input type="radio" v-model="mode" value="answer" /> Answer
        </div>
        <div class="mb-2">
          <v-btn small @click="init">INIT</v-btn>
          <v-btn small @click="createSession" :disabled="Boolean(session)">
            CREATE SESSION
          </v-btn>
          <v-btn small @click="login" :disabled="!session || loggedin">
            LOGIN
          </v-btn>
          <v-btn small @click="logout" :disabled="!session || !loggedin">
            LOGOUT
          </v-btn>
          <v-btn small @click="destroySession" :disabled="!session">
            DESTROY
          </v-btn>
          <v-btn small @click="checkChatConnect">CHECK CONNECT CHAT</v-btn>
        </div>
        <v-subheader>Chat</v-subheader>
        <div class="mb-2">
          <v-btn small @click="connectChat" :disabled="chatConnected">
            CONNECT
          </v-btn>
          <v-btn small @click="disconnectChat" :disabled="!chatConnected">
            DISCONNECT
          </v-btn>
          <v-btn small @click="getListDialog" :disabled="!loggedin">
            GET LIST DIALOG
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-if="!callState"
          x-large
          block
          dark
          color="#3F51B5"
          @click="createVideoSession"
          :disabled="!chatConnected"
        >
          CREATE VIDEO SESSION & CALL
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-app>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Vue from 'vue'
import ConnectyCube from 'connectycube'
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
  VSubheader,
} from 'vuetify/lib'

Vue.prototype.$vuetify = { rtl: false, theme: { isDark: true } }

const CREDENTIALS = {
  appId: Number(process.env.VUE_APP_CC_APP_ID),
  authKey: process.env.VUE_APP_CC_AUTH_KEY,
  authSecret: process.env.VUE_APP_CC_SECRET,
}

const CONFIG = {
  debug: { mode: 0 }, // enable DEBUG mode (mode 0 is logs off, mode 1 -> console.log())
  videochat: {
    alwaysRelayCalls: false, // TURN server を利用するか否か
  },
  on: {
    sessionExpired: (_handleResponse: any, retry: any) => {
      // call handleResponse() if you do not want to process a session expiration,
      // so an error will be returned to origin request
      // handleResponse();
      window.alert('セッションの有効期限切れ')
      ConnectyCube.createSession()
        .then(retry)
        .catch((error: any) => {
          console.log(error)
        })
    },
  },
}
const users = {
  offer: {
    login: process.env.VUE_APP_CC_USER_1_LOGIN,
    password: process.env.VUE_APP_CC_USER_1_PASSWORD,
    userId: Number(process.env.VUE_APP_CC_USER_1_ID),
  },
  answer: {
    login: process.env.VUE_APP_CC_USER_2_LOGIN,
    password: process.env.VUE_APP_CC_USER_2_PASSWORD,
    userId: Number(process.env.VUE_APP_CC_USER_2_ID),
  },
}
const mediaParams = {
  audio: { deviceId: localStorage.getItem('ccaudio') || true },
  video: { deviceId: localStorage.getItem('ccvideo') || true },
  options: {
    muted: true,
    mirror: true,
  },
  elementId: 'localStream',
}
const llog = (message: string, ...args: unknown[]) => {
  console.log(
    `%c${message}`,
    'color:white;background:black;padding:.2em 1em;border-radius:3px;',
    args
  )
}

interface CCData {
  isBusy: boolean
  mode: string
  session: any
  loggedin: boolean
  chatConnected: boolean
  videoSession: any
  callState: string
  extension: any
  muted: {
    audio: boolean
    video: boolean
  }
  icons: any
  videoinput: any
  audioinput: any
  videoDeviceId: string
  audioDeviceId: string
}

export default Vue.extend({
  name: 'ConnectyCube',
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
    VSubheader,
  },
  data(): CCData {
    return {
      isBusy: false,
      mode: localStorage.getItem('cc') || '',
      session: null,
      loggedin: false,
      chatConnected: false,
      videoSession: null,
      callState: '',
      muted: {
        audio: false,
        video: false,
      },
      extension: null,
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
      videoinput: [],
      audioinput: [],
      videoDeviceId: localStorage.getItem('ccvideo') || '',
      audioDeviceId: localStorage.getItem('ccaudio') || '',
    }
  },
  watch: {
    mode: function (newVal, oldVal) {
      localStorage.setItem('cc', newVal || '')
      if (!oldVal && newVal) this.init()
    },
    videoDeviceId: function (n) {
      localStorage.setItem('ccvideo', n || '')
    },
    audioDeviceId: function (n) {
      localStorage.setItem('ccaudio', n || '')
    },
  },
  computed: {
    iOS(): boolean {
      return window?.cordova?.platformId === 'ios'
    },
  },
  mounted() {
    this.init()
  },
  async beforeDestroy() {
    await this.onClear()
    await this.disconnectChat()
    this.removeListeners()
  },
  methods: {
    async init() {
      ConnectyCube.init(CREDENTIALS, CONFIG)
      this.addListeners()
      if (this.mode) {
        await this.connectChat()
        await this.getMediaDevices()
      }
      llog('init done.')
    },
    async createSession() {
      // NOTE: ApplicationSession の作成
      this.isBusy = true
      try {
        this.session = await ConnectyCube.createSession()
      } catch (error) {
        llog('createSession', error)
      }
      this.isBusy = false
    },
    async login() {
      // NOTE: userSession への移行
      this.isBusy = true
      const user = users[this.mode === 'offer' ? 'offer' : 'answer']
      try {
        await ConnectyCube.login({
          login: user.login,
          password: user.password,
        })
        this.loggedin = true
      } catch (error) {
        llog('login', error)
      }
      this.isBusy = false
    },
    async logout() {
      // NOTE: UserSession の DOWN GRADE (ApplicationSession へ移行)
      this.isBusy = true
      try {
        await ConnectyCube.logout()
        this.loggedin = false
      } catch (error) {
        llog('logout', error)
      }
      this.isBusy = false
    },
    async destroySession() {
      this.isBusy = true
      this.session = await ConnectyCube.destroySession().catch((error: any) =>
        llog('destroySession', error)
      )
      this.isBusy = false
    },
    async connectChat() {
      this.isBusy = true
      const user = users[this.mode === 'offer' ? 'offer' : 'answer']
      await ConnectyCube.chat.connect({
        userId: user.userId,
        password: user.password,
      })
      this.checkChatConnect()
      this.isBusy = false
    },
    async disconnectChat() {
      await ConnectyCube.chat.disconnect()
      this.checkChatConnect()
    },
    checkChatConnect() {
      this.chatConnected = ConnectyCube.chat.isConnected
    },
    async getListDialog() {
      const filters = {}
      const list = await ConnectyCube.chat.dialog.list(filters)
      llog('getListDialog', list)
    },
    async createVideoSession() {
      const calleesIds = [
        this.mode === 'offer' ? users.answer.userId : users.offer.userId,
      ]
      const sessionType = ConnectyCube.videochat.CallType.VIDEO
      const additionalOptions = {}
      try {
        this.videoSession = await ConnectyCube.videochat.createNewSession(
          calleesIds,
          sessionType,
          additionalOptions
        )
      } catch (error) {
        llog('createNewSession', error)
      }
      try {
        await this.videoSession.getUserMedia(mediaParams)
        // state.videoSession.attachMediaStream('localStream', stream)
      } catch (error) {
        llog('getUserMedia', error)
      }
      this.onCall()
    },
    async onCall() {
      const extension = {}
      try {
        await this.videoSession.call(extension)
      } catch (error) {
        llog('onCall', error)
      }
      this.callState = 'onCall'
    },
    async onStop() {
      const extension = {}
      try {
        await this.videoSession.stop(extension)
      } catch (error) {
        llog('onStop', error)
      }
      this.callState = 'onStop'
      this.onClear()
    },
    async onAccept() {
      const extension = {}
      try {
        await this.videoSession.accept(extension)
      } catch (error) {
        llog('onAccept', error)
      }
      this.callState = 'onAccept'
    },
    async onReject(session: any, extension = {}) {
      if (session) session.reject(extension)
      else {
        try {
          await this.videoSession.reject(extension)
        } catch (error) {
          llog('onReject', error)
        }
      }
      this.callState = 'onReject'
      this.onClear()
    },
    async onClear() {
      // await new Promise((resolve) => setTimeout(resolve, 400))
      llog('onClear :::::')
      if (this.videoSession) {
        try {
          await ConnectyCube.videochat.clearSession(this.videoSession.ID)
        } catch (error) {
          llog('onClear', error)
        }
      }
      this.videoSession = null
      this.callState = ''
    },
    async getMediaDevices() {
      llog('getMediaDevices')
      this.videoinput = await ConnectyCube.videochat.getMediaDevices(
        'videoinput'
      )
      this.audioinput = await ConnectyCube.videochat.getMediaDevices(
        'audioinput'
      )
      llog('getMediaDevices', this.videoinput, this.audioinput)
    },
    switchTracks() {
      const deviceIds = {
        audio: this.audioDeviceId,
        video: this.videoDeviceId,
      }
      const callback = (error: any, stream: any) => {
        llog('switchMediaTracks', { error, stream })
      }
      this.videoSession.switchMediaTracks(deviceIds, callback)
    },
    // ------------------------------- listeners
    onDisconnectedListener() {
      llog('[CHAT] onDisconnected.')
      this.checkChatConnect()
    },
    onReconnectListener() {
      llog('[CHAT] onReconnect.')
      this.checkChatConnect()
    },
    async onCallListener(session: any, extension: null) {
      if (session.initiatorID === session.currentUserID) {
        llog('onCallListener: same ID', session.initiatorID)
        this.callState = 'initiatorID'
        return false
      }
      if (this.videoSession) {
        this.onReject(session, { busy: true })
        return false
      }
      this.videoSession = session
      this.extension = extension
      try {
        await this.videoSession.getUserMedia(mediaParams)
      } catch (error) {
        llog('switchMediaTracks', { error })
      }
      this.callState = 'receive'
    },
    onAcceptCallListener(
      session: { initiatorID: any; currentUserID: any },
      userId: any,
      extension: null
    ) {
      llog('onAcceptCallListener')
      if (session.initiatorID === session.currentUserID) {
        llog('initiatorID / currentUserID same ID', session.initiatorID)
        // onClear()
        // return false
      }
      if (userId === session.currentUserID) {
        // NOTE: 自分以外の誰かが Accept した場合 === になる
        llog('onAcceptCallListener: same ID', userId)
        this.onClear()
        return false
      }
      this.callState = 'accept'
      this.extension = extension
    },
    onRejectCallListener(
      session: { currentUserID: any },
      userId: any,
      extension: null
    ) {
      llog('onRejectCallListener')
      this.extension = extension
      if (userId === session.currentUserID) {
        // NOTE: 自分以外の誰かが  Reject した場合 === になる
        llog('onRejectCallListener: same ID', userId)
        // return false
      }
      this.callState = 'reject'
      this.onClear()
    },
    onStopCallListener(session: any, userId: any, extension: any) {
      llog('onStopCallListener :::::', { session, userId, extension })
      this.callState = 'stop'
      this.onClear()
    },
    async onRemoteStreamListener(session: null, userId: any, stream: any) {
      llog('onRemoteStreamListener :::::', { session, userId, stream })
      this.callState = 'remoteConnected'
      this.videoSession = session
      try {
        await this.videoSession.attachMediaStream('remoteStream', stream)
      } catch (error) {
        llog('onClear', error)
      }
    },
    onSessionConnectionStateChangedListener(
      _session: any,
      _userId: any,
      connectionState: any
    ) {
      switch (connectionState) {
        case 0: // UNDEFINED
          llog('UNDEFINED')
          break
        case 1: // CONNECTING
          llog('CONNECTING')
          break
        case 2: // CONNECTED
          llog('CONNECTED')
          break
        case 3: // FAILED
        case 4: // DISCONNECTED
          llog('FAILED')
          llog('DISCONNECTED')
          this.onClear()
          this.checkChatConnect()
          if (!this.chatConnected) this.init()
          break
        case 5: // CLOSED
          llog('CLOSED')
          break
        case 6: // COMPLETED
          llog('COMPLETED')
          break
      }
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
    addListeners() {
      ConnectyCube.chat.onDisconnectedListener = this.onDisconnectedListener
      ConnectyCube.chat.onReconnectListener = this.onReconnectListener
      ConnectyCube.videochat.onCallListener = this.onCallListener
      ConnectyCube.videochat.onAcceptCallListener = this.onAcceptCallListener
      ConnectyCube.videochat.onRejectCallListener = this.onRejectCallListener
      ConnectyCube.videochat.onStopCallListener = this.onStopCallListener
      ConnectyCube.videochat.onRemoteStreamListener =
        this.onRemoteStreamListener
      ConnectyCube.videochat.onSessionConnectionStateChangedListener =
        this.onSessionConnectionStateChangedListener
    },
    removeListeners() {
      ConnectyCube.chat.onDisconnectedListener =
        ConnectyCube.chat.onReconnectListener =
        ConnectyCube.videochat.onCallListener =
        ConnectyCube.videochat.onAcceptCallListener =
        ConnectyCube.videochat.onRejectCallListener =
        ConnectyCube.videochat.onStopCallListener =
        ConnectyCube.videochat.onRemoteStreamListener =
        ConnectyCube.videochat.onSessionConnectionStateChangedListener =
          null
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
  top: 0;
  left: 0;
  box-shadow: 0 0 0 1px #ccc;
  background: #000;
}
#remoteStream {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  box-shadow: 0 0 0 1px #ccc;
  background: #000;
}
.receive,
.onCall {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 2;
  width: 100%;
  height: 100%;
  color: #fff;
  background: #000;
}
.ctl {
  position: absolute;
  bottom: 10px;
  z-index: 4;
  width: 95%;
  margin: 0;
}
.debug {
  position: absolute;
  top: 0;
  background: rgba(#000, 0.5);
  color: #ccc;
  font-size: 9px;
  padding: 0.5em 1em;
}
.connecty-wrap.ios {
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
</style>
