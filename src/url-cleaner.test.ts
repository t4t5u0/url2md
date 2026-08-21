import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from './settings'
import { cleanUrl } from './url-cleaner'

const both = DEFAULT_SETTINGS
const amazonOnly: Settings = { amazonShorten: true, stripTracking: false }
const trackingOnly: Settings = { amazonShorten: false, stripTracking: true }
const off: Settings = { amazonShorten: false, stripTracking: false }

describe('Amazon の最小化', () => {
  it('/dp/ASIN まで削る', () => {
    expect(
      cleanUrl(
        'https://www.amazon.co.jp/dp/B08N5WRWNW/ref=sr_1_3?crid=2ABC&qid=170000&sr=8-3',
        amazonOnly,
      ),
    ).toBe('https://www.amazon.co.jp/dp/B08N5WRWNW')
  })

  it('商品名入りの長い URL でも ASIN を拾う', () => {
    expect(
      cleanUrl(
        'https://www.amazon.co.jp/Echo-Dot-%E7%AC%AC5%E4%B8%96%E4%BB%A3/dp/B09B8VGCR8/ref=cm_sw_r_apan_dp_XYZ?th=1',
        amazonOnly,
      ),
    ).toBe('https://www.amazon.co.jp/dp/B09B8VGCR8')
  })

  it('/gp/product も対応する', () => {
    expect(cleanUrl('https://www.amazon.com/gp/product/B0BSHF7WHW?psc=1', amazonOnly)).toBe(
      'https://www.amazon.com/dp/B0BSHF7WHW',
    )
  })

  it('ホスト (国) は保持する', () => {
    expect(cleanUrl('https://www.amazon.de/dp/B0BSHF7WHW?tag=x', amazonOnly)).toBe(
      'https://www.amazon.de/dp/B0BSHF7WHW',
    )
  })

  it('商品ページ以外は最小化しない', () => {
    const url = 'https://www.amazon.co.jp/gp/help/customer/display.html'
    expect(cleanUrl(url, amazonOnly)).toBe(url)
  })

  it('設定が OFF なら何もしない', () => {
    const url = 'https://www.amazon.co.jp/dp/B08N5WRWNW/ref=sr_1_3?crid=2ABC'
    expect(cleanUrl(url, off)).toBe(url)
  })

  it('最小化が OFF でもトラッキング除去は効く', () => {
    expect(
      cleanUrl('https://www.amazon.co.jp/dp/B08N5WRWNW/ref=sr_1_3?crid=2ABC&psc=1', trackingOnly),
    ).toBe('https://www.amazon.co.jp/dp/B08N5WRWNW')
  })
})

describe('トラッキングパラメータの除去', () => {
  it('utm_* を落とす', () => {
    expect(cleanUrl('https://example.com/a?utm_source=x&utm_medium=y&id=42', trackingOnly)).toBe(
      'https://example.com/a?id=42',
    )
  })

  it('広告クリック ID を落とす', () => {
    expect(cleanUrl('https://example.com/?fbclid=abc&gclid=def', trackingOnly)).toBe(
      'https://example.com/',
    )
  })

  it('ref を落とす', () => {
    expect(cleanUrl('https://example.com/p?ref=producthunt', trackingOnly)).toBe(
      'https://example.com/p',
    )
  })

  it('GitHub / GitLab の ref は残す', () => {
    const url = 'https://gitlab.com/o/r/-/blob/x.ts?ref=main'
    expect(cleanUrl(url, trackingOnly)).toBe(url)
  })

  it('X の s / t を落とす', () => {
    expect(cleanUrl('https://x.com/user/status/123?s=20&t=AbCd', trackingOnly)).toBe(
      'https://x.com/user/status/123',
    )
  })

  it('YouTube の自動生成ミックス (list=RD...) を落とす', () => {
    expect(
      cleanUrl(
        'https://www.youtube.com/watch?v=uZ1NmQWL6gg&list=RDuZ1NmQWL6gg&start_radio=1',
        trackingOnly,
      ),
    ).toBe('https://www.youtube.com/watch?v=uZ1NmQWL6gg')
  })

  it('ユーザーのプレイリスト (list=PL...) は残す', () => {
    const url = 'https://www.youtube.com/watch?v=uZ1NmQWL6gg&list=PLabcdef&index=3'
    expect(cleanUrl(url, trackingOnly)).toBe(url)
  })

  it('ミックスを落とすときは index も一緒に落とす', () => {
    expect(
      cleanUrl(
        'https://www.youtube.com/watch?v=uZ1NmQWL6gg&list=RDuZ1NmQWL6gg&index=2',
        trackingOnly,
      ),
    ).toBe('https://www.youtube.com/watch?v=uZ1NmQWL6gg')
  })

  it('YouTube の si は落とすが再生位置 t は残す', () => {
    expect(cleanUrl('https://youtu.be/dQw4w9WgXcQ?si=abc&t=42', trackingOnly)).toBe(
      'https://youtu.be/dQw4w9WgXcQ?t=42',
    )
  })

  it('他サイトの s は残す (ホスト限定ルール)', () => {
    const url = 'https://example.com/search?s=keyword'
    expect(cleanUrl(url, trackingOnly)).toBe(url)
  })

  it('フラグメントは保持する', () => {
    expect(cleanUrl('https://example.com/doc?utm_source=x#section-3', trackingOnly)).toBe(
      'https://example.com/doc#section-3',
    )
  })
})

describe('変更しない場合', () => {
  it('元の文字列をそのまま返す (再エンコードしない)', () => {
    const url = 'https://ja.wikipedia.org/wiki/日本語'
    expect(cleanUrl(url, both)).toBe(url)
  })

  it('http/https 以外は触らない', () => {
    const url = 'chrome://extensions/?utm_source=x'
    expect(cleanUrl(url, both)).toBe(url)
  })

  it('URL として解釈できない文字列はそのまま返す', () => {
    expect(cleanUrl('not a url', both)).toBe('not a url')
  })
})
