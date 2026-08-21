import type { Settings } from './settings'

const AMAZON_HOST = /(?:^|\.)amazon\.[a-z]{2,}(?:\.[a-z]{2})?$/i

/** /dp/B0XXXXXXXX や /gp/product/B0XXXXXXXX から ASIN を取り出す */
const AMAZON_ASIN =
  /\/(?:dp|gp\/product|gp\/aw\/d|gp\/offer-listing|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})(?![A-Z0-9])/

/** Amazon のパス中に紛れ込む /ref=... セグメント */
const AMAZON_REF_SEGMENT = /^ref=/i

/**
 * どのサイトでも落とすパラメータ (小文字で比較する)。
 * ClearURLs のルール DB (https://github.com/ClearURLs/Rules) を突き合わせて整理した。
 */
const TRACKING_PARAMS: ReadonlySet<string> = new Set([
  // 広告クリック ID
  'gclid',
  'gclsrc',
  'dclid',
  'fbclid',
  'msclkid',
  'yclid',
  'twclid',
  'ttclid',
  'igshid',
  'igsh',
  'epik',
  'srsltid',
  'rb_clickid',
  's_kwcid',
  'li_fat_id',
  'yadcl',
  // アクセス解析
  '_ga',
  '_gl',
  'gs_l',
  '_openstat',
  'os_ehash',
  'spm',
  'scm',
  'trk',
  'trkcampaign',
  'icid',
  'cmpid',
  's_cid',
  'tracking_source',
  'ceneo_spo',
  'echobox',
  'wtrid',
  'wtmc',
  'wt_mc',
  'wtzmc',
  'wt_zmc',
  '__twitter_impression',
  // メール配信 / マーケティングオートメーション
  'mc_cid',
  'mc_eid',
  'mc_tc',
  'mkt_tok',
  '__s',
  '_hsenc',
  '_hsmi',
  '__hsfp',
  '__hssc',
  '__hstc',
  'hsctatracking',
  'ml_subscriber',
  'ml_subscriber_hash',
  'oly_anon_id',
  'oly_enc_id',
  'vero_conv',
  'vero_id',
  'wickedid',
  // SNS 共有時に付くもの
  'fb_source',
  'fb_ref',
  'fb_action_types',
  'fb_action_ids',
  'action_object_map',
  'action_type_map',
  'action_ref_map',
  'ref_src',
  'ref_url',
  'referrer',
  'share_source',
  'share_medium',
])

/** 前方一致で落とすパラメータ */
const TRACKING_PREFIXES: readonly string[] = [
  'utm_',
  'pk_',
  'mtm_',
  'piwik_',
  'matomo_',
  'ga_',
  'otm_',
  'hmb_',
  'itm_',
]

/**
 * 特定のホストでだけ落とすパラメータ。
 * 末尾が `_` のものは前方一致として扱う。
 */
const HOST_TRACKING_PARAMS: ReadonlyArray<readonly [RegExp, readonly string[]]> = [
  [/(?:^|\.)(?:twitter|x)\.com$/i, ['s', 't', 'ref_src', 'ref_url']],
  [/(?:^|\.)youtube\.com$/i, ['si', 'feature', 'pp', 'ab_channel', 'kw']],
  [/(?:^|\.)youtu\.be$/i, ['si', 'feature']],
  [
    /(?:^|\.)tiktok\.com$/i,
    [
      'is_from_webapp',
      '_d',
      'user_id',
      'share_app_name',
      'source',
      'sender_device',
      'web_id',
      '_r',
      '_t',
      'u_code',
      'share_app_id',
      'share_link_id',
      'share_item_id',
      'share_iid',
      'share_author_id',
      'social_share_type',
      'tt_from',
      'enter_from',
      'refer',
      'timestamp',
      'preview_pb',
      'checksum',
      'sec_user_id',
      'iid',
      'mid',
    ],
  ],
  [
    AMAZON_HOST,
    [
      'tag',
      'ref',
      'ref_',
      'th',
      'psc',
      'crid',
      'sprefix',
      'qid',
      'sr',
      'keywords',
      'linkcode',
      'linkid',
      'creative',
      'creativeasin',
      'camp',
      'ascsubtag',
      'smid',
      'content-id',
      'dib',
      'dib_tag',
      'pd_rd_',
      'pf_rd_',
      '_encoding',
    ],
  ],
]

const YOUTUBE_HOST = /(?:^|\.)(?:youtube\.com|youtu\.be)$/i

/**
 * YouTube の自動生成ミックス / ラジオ。動画そのものとは無関係なので落とす。
 * ユーザーが作ったプレイリスト (PL...) やアルバム (OLAK5uy_...) は残す。
 */
const YOUTUBE_RADIO_LIST = /^RD/

/**
 * `ref` をブランチ名などの構造的な意味で使うホスト。
 * ここでは `ref` を残す (例: GitLab の ?ref_type=heads と同種の使われ方)。
 */
const REF_IS_STRUCTURAL = /(?:^|\.)(?:github\.com|gitlab\.com|bitbucket\.org|codeberg\.org)$/i

/**
 * 設定に従って URL を整える。
 * 何も変更しなかった場合は元の文字列をそのまま返す
 * (URL#toString による意図しない再エンコードを避けるため)。
 */
export function cleanUrl(rawUrl: string, settings: Settings): string {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return rawUrl

  if (settings.amazonShorten && AMAZON_HOST.test(url.hostname)) {
    const shortened = shortenAmazonUrl(url)
    if (shortened) return shortened
  }

  let changed = false
  if (settings.stripTracking) {
    changed = stripTrackingParams(url) || changed
    if (AMAZON_HOST.test(url.hostname)) {
      changed = stripAmazonRefSegments(url) || changed
    }
  }

  return changed ? url.toString() : rawUrl
}

/** Amazon の商品ページを https://<host>/dp/<ASIN> まで削る */
function shortenAmazonUrl(url: URL): string | null {
  const asin = AMAZON_ASIN.exec(url.pathname)?.[1]
  return asin ? `${url.origin}/dp/${asin}` : null
}

function stripTrackingParams(url: URL): boolean {
  const params = url.searchParams
  const doomed = [...params.keys()].filter((key) =>
    isTrackingParam(key, url.hostname, params.get(key) ?? ''),
  )

  // プレイリストを落とすなら、その中の位置を指す index も意味を失う
  if (doomed.includes('list') && params.has('index')) doomed.push('index')

  for (const key of doomed) params.delete(key)
  return doomed.length > 0
}

/** パスに埋め込まれた /ref=xxx を取り除く */
function stripAmazonRefSegments(url: URL): boolean {
  const segments = url.pathname.split('/')
  const kept = segments.filter((segment) => !AMAZON_REF_SEGMENT.test(segment))
  if (kept.length === segments.length) return false
  url.pathname = kept.join('/')
  return true
}

function isTrackingParam(key: string, hostname: string, value: string): boolean {
  const name = key.toLowerCase()

  if (YOUTUBE_HOST.test(hostname)) {
    if (name === 'list') return YOUTUBE_RADIO_LIST.test(value)
    if (name === 'start_radio' || name === 'rv') return true
  }

  if (TRACKING_PREFIXES.some((prefix) => name.startsWith(prefix))) return true
  if (name === 'ref') return !REF_IS_STRUCTURAL.test(hostname)
  if (TRACKING_PARAMS.has(name)) return true

  return HOST_TRACKING_PARAMS.some(
    ([host, keys]) =>
      host.test(hostname) && keys.some((k) => (k.endsWith('_') ? name.startsWith(k) : name === k)),
  )
}
