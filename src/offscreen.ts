/**
 * クリップボード書き込み専用の offscreen document。
 *
 * service worker には DOM もクリップボードもなく、タブへ注入する方式も
 * アイコンのクリックでページのフォーカスが外れるため使えない
 * (navigator.clipboard は "Document is not focused" で失敗し、
 *  document.execCommand もユーザー操作が伝播せず false を返す)。
 * offscreen document はフォーカスの影響を受けないため確実に書き込める。
 */

import type { CopyRequest, CopyResponse } from './messages'

chrome.runtime.onMessage.addListener(
  (message: CopyRequest, _sender, sendResponse: (response: CopyResponse) => void) => {
    if (message?.target !== 'offscreen' || message.type !== 'copy') return false

    try {
      sendResponse({ ok: copyToClipboard(message.text) })
    } catch (error) {
      sendResponse({ ok: false, error: String(error) })
    }
    return false
  },
)

function copyToClipboard(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.append(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } finally {
    textarea.remove()
  }
}
