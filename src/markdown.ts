/** 画像 URL とみなす拡張子 (クエリ・フラグメントは無視する) */
const IMAGE_PATTERN = /\.(?:jpe?g|png|gif|webp|avif|bmp|svg)(?:[?#].*)?$/i

/**
 * タブのタイトル先頭に付く未読件数を取り除く。
 * YouTube の "(25) ", Gmail の "(1,234) ", X の "(3) " など。
 * 4 桁以上の裸の数字 ("(2026) 〜" のような年) は対象にしない。
 */
const NOTIFICATION_COUNT = /^\(\d{1,3}(?:,\d{3})*\+?\)\s+/

const X_HOST = /(?:^|\.)(?:x\.com|twitter\.com)$/i

/** 投稿ページのタイトルから「投稿者」と「本文」を取り出すパターン */
const X_POST_TITLE: readonly RegExp[] = [
  /^Xユーザーの([\s\S]+?)さん[:：]\s*「([\s\S]*)」\s*\/\s*X$/,
  /^([\s\S]+?) on X: "([\s\S]*)"\s*\/\s*X$/,
  /^([\s\S]+?)さんはTwitterを使っています[:：]\s*「([\s\S]*)」\s*\/\s*Twitter$/,
  /^([\s\S]+?) on Twitter: "([\s\S]*)"\s*\/\s*Twitter$/,
]

const X_SITE_SUFFIX = /\s*\/\s*(?:X|Twitter)$/

/** 本文中に展開される t.co の短縮 URL は Markdown のリンクテキストには不要 */
const TCO_LINK = /\s*https?:\/\/t\.co\/[0-9A-Za-z]+/g

/** `[title](url)` / 画像なら `![title](url)` を組み立てる */
export function toMarkdownLink(title: string | undefined, url: string): string {
  const prefix = IMAGE_PATTERN.test(url) ? '!' : ''
  return `${prefix}[${escapeLinkText(cleanTitle(title, url) || url)}](${escapeUrl(url)})`
}

export function cleanTitle(title: string | undefined, url?: string): string {
  const withoutCount = (title ?? '').replace(NOTIFICATION_COUNT, '')
  return (isXUrl(url) ? cleanXTitle(withoutCount) : withoutCount).trim()
}

function isXUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    return X_HOST.test(new URL(url).hostname)
  } catch {
    return false
  }
}

/**
 * 「XユーザーのA さん: 「本文」 / X」のような定型部分を外して
 * 「投稿者: 本文」にする。投稿ページ以外は末尾の「 / X」だけ落とす。
 */
function cleanXTitle(title: string): string {
  for (const pattern of X_POST_TITLE) {
    const match = pattern.exec(title)
    const author = match?.[1]?.trim()
    const body = match?.[2]?.replace(TCO_LINK, '').trim()
    if (author) return body ? `${author}: ${body}` : author
  }

  return title.replace(X_SITE_SUFFIX, '').replace(TCO_LINK, '')
}

/** リンクテキスト中の記号が記法を壊さないようにエスケープする */
function escapeLinkText(text: string): string {
  return text.replace(/([\\[\]])/g, '\\$1')
}

/** 空白や括弧を含む URL は山括弧で囲む (CommonMark の destination 記法) */
function escapeUrl(url: string): string {
  return /[\s()<>]/.test(url) ? `<${url.replace(/([<>])/g, '\\$1')}>` : url
}
