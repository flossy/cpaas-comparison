export const llog = (message: string, ...args: unknown[]): void => {
  console.log(
    `%c${message}`,
    'color:white;background:black;padding:.2em 1em;border-radius:3px;',
    args
  )
}

export const isIOS = (): boolean => {
  return window?.cordova?.platformId === 'ios'
}
