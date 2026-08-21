/** 画像 URL とみなす拡張子 (クエリ・フラグメントは無視する) */
const IMAGE_PATTERN = /\.(?:jpe?g|png|gif|webp|avif|bmp|svg)(?:[?#].*)?$/i

/**
 * タブのタイトル先頭に付く未読件数を取り除く。
 * YouTube の "(25) ", Gmail の "(1,234) ", X の "(3) " など。
 * 4 桁以上の裸の数字 ("(2026) 〜" のような年) は対象にしない。
 */
const NOTIFICATION_COUNT = /^\(\d{1,3}(?:,\d{3})*\+?\)\s+/

/** `[title](url)` / 画像なら `![title](url)` を組み立てる */
export function toMarkdownLink(title: string | undefined, url: string): string {
  const prefix = IMAGE_PATTERN.test(url) ? '!' : ''
  return `${prefix}[${escapeLinkText(cleanTitle(title) || url)}](${escapeUrl(url)})`
}

export function cleanTitle(title: string | undefined): string {
  return (title ?? '').replace(NOTIFICATION_COUNT, '').trim()
}

/** リンクテキスト中の記号が記法を壊さないようにエスケープする */
function escapeLinkText(text: string): string {
  return text.replace(/([\\[\]])/g, '\\$1')
}

/** 空白や括弧を含む URL は山括弧で囲む (CommonMark の destination 記法) */
function escapeUrl(url: string): string {
  return /[\s()<>]/.test(url) ? `<${url.replace(/([<>])/g, '\\$1')}>` : url
}
