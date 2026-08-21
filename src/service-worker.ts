/**
 * ツールバーアイコンをクリックすると、アクティブなタブを
 * Markdown のリンク記法でクリップボードへコピーする。
 */

import type { CopyRequest, CopyResponse } from './messages'
import { loadSettings } from './settings'
import { cleanUrl } from './url-cleaner'

/** 画像 URL とみなす拡張子 (クエリ・フラグメントは無視する) */
const IMAGE_PATTERN = /\.(?:jpe?g|png|gif|webp|avif|bmp|svg)(?:[?#].*)?$/i

const BADGE_DURATION_MS = 1_200
const SEND_RETRY_LIMIT = 10
const SEND_RETRY_INTERVAL_MS = 50

chrome.action.onClicked.addListener((tab) => {
  void copyTabAsMarkdown(tab)
})

async function copyTabAsMarkdown(tab: chrome.tabs.Tab): Promise<void> {
  const { url, title } = tab
  if (!url) return

  try {
    const settings = await loadSettings()
    await writeToClipboard(toMarkdownLink(title, cleanUrl(url, settings)))
    await flashBadge('✓', '#22c55e')
  } catch (error) {
    console.error('url2md: failed to copy', error)
    await flashBadge('!', '#ef4444')
  }
}

/** `[title](url)` / 画像なら `![title](url)` を組み立てる */
function toMarkdownLink(title: string | undefined, url: string): string {
  const prefix = IMAGE_PATTERN.test(url) ? '!' : ''
  return `${prefix}[${escapeLinkText(title?.trim() || url)}](${escapeUrl(url)})`
}

/** リンクテキスト中の記号が記法を壊さないようにエスケープする */
function escapeLinkText(text: string): string {
  return text.replace(/([\\[\]])/g, '\\$1')
}

/** 空白や括弧を含む URL は山括弧で囲む (CommonMark の destination 記法) */
function escapeUrl(url: string): string {
  return /[\s()<>]/.test(url) ? `<${url.replace(/([<>])/g, '\\$1')}>` : url
}

const OFFSCREEN_PATH = 'offscreen.html'

/**
 * クリップボードへの書き込みは offscreen document を経由する。
 * 生成 → 送信 → 破棄が重ならないよう、連打されても直列に実行する。
 */
let queue: Promise<unknown> = Promise.resolve()

function writeToClipboard(text: string): Promise<void> {
  const run = queue.then(
    () => copyViaOffscreen(text),
    () => copyViaOffscreen(text),
  )
  queue = run.catch(() => undefined)
  return run
}

async function copyViaOffscreen(text: string): Promise<void> {
  await createOffscreenDocument()
  try {
    const response = await sendCopyRequest({ target: 'offscreen', type: 'copy', text })
    if (!response.ok) {
      throw new Error(response.error ?? 'offscreen document did not copy the text')
    }
  } finally {
    await chrome.offscreen.closeDocument().catch(() => undefined)
  }
}

/**
 * createDocument() の解決後もモジュールスクリプトの評価が終わっておらず、
 * onMessage リスナーが未登録なことがあるため数回リトライする。
 */
async function sendCopyRequest(request: CopyRequest): Promise<CopyResponse> {
  let lastError: unknown = new Error('offscreen document did not respond')

  for (let attempt = 0; attempt < SEND_RETRY_LIMIT; attempt++) {
    try {
      const response: CopyResponse | undefined = await chrome.runtime.sendMessage(request)
      if (response) return response
    } catch (error) {
      lastError = error
    }
    await delay(SEND_RETRY_INTERVAL_MS)
  }

  throw lastError
}

async function createOffscreenDocument(): Promise<void> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  })
  if (contexts.length > 0) return

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: 'Markdown 形式のリンクをクリップボードへ書き込むため',
  })
}

async function flashBadge(text: string, color: string): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color })
  await chrome.action.setBadgeText({ text })
  await delay(BADGE_DURATION_MS)
  await chrome.action.setBadgeText({ text: '' })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
