/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'connectycube'
declare module 'quickblox/quickblox'
interface Window {
  cordova: any
}
