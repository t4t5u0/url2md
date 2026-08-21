/**
 * ツールバーアイコンをクリックすると、アクティブなタブを
 * Markdown のリンク記法でクリップボードへコピーする。
 */

import { loadSettings } from './settings'
import { cleanUrl } from './url-cleaner'

/** 画像 URL とみなす拡張子 (クエリ・フラグメントは無視する) */
const IMAGE_PATTERN = /\.(?:jpe?g|png|gif|webp|avif|bmp|svg)(?:[?#].*)?$/i

const BADGE_DURATION_MS = 1_200

chrome.action.onClicked.addListener((tab) => {
  void copyTabAsMarkdown(tab)
})

async function copyTabAsMarkdown(tab: chrome.tabs.Tab): Promise<void> {
  const { id, url, title } = tab
  if (id === undefined || !url) return

  try {
    const settings = await loadSettings()
    await writeToClipboard(id, toMarkdownLink(title, cleanUrl(url, settings)))
    await flashBadge('✓', '#22c55e')
  } catch (error) {
    // chrome:// や Chrome Web Store などスクリプトを注入できないページ
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

async function writeToClipboard(tabId: number, text: string): Promise<void> {
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    func: copyInPage,
    args: [text],
  })

  if (injection?.result !== true) {
    throw new Error('clipboard write was rejected by the page')
  }
}

/**
 * ページのコンテキストで実行される。service worker には DOM も
 * クリップボードもないため、activeTab 権限でタブ側に注入して書き込む。
 * この関数はシリアライズされて送られるので、外側の変数は参照できない。
 */
async function copyInPage(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // ページが未フォーカス等で Async Clipboard API が使えない場合のフォールバック
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.append(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    return copied
  }
}

async function flashBadge(text: string, color: string): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color })
  await chrome.action.setBadgeText({ text })
  await new Promise((resolve) => setTimeout(resolve, BADGE_DURATION_MS))
  await chrome.action.setBadgeText({ text: '' })
}
