export type CopyRequest = {
  target: 'offscreen'
  type: 'copy'
  text: string
}

export type CopyResponse = {
  ok: boolean
  error?: string
}
