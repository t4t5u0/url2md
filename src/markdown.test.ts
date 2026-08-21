import { describe, expect, it } from 'vitest'
import { cleanTitle, toMarkdownLink } from './markdown'

describe('タイトルの未読件数', () => {
  it('YouTube の "(25) " を落とす', () => {
    expect(cleanTitle('(25) 2026 House Mix | Late Afternoon Groove - YouTube')).toBe(
      '2026 House Mix | Late Afternoon Groove - YouTube',
    )
  })

  it('カンマ区切り "(1,234) " も落とす', () => {
    expect(cleanTitle('(1,234) 受信トレイ - Gmail')).toBe('受信トレイ - Gmail')
  })

  it('"(99+) " も落とす', () => {
    expect(cleanTitle('(99+) ホーム / X')).toBe('ホーム / X')
  })

  it('4 桁の数字は年などの可能性があるので残す', () => {
    expect(cleanTitle('(2026) 映画のタイトル')).toBe('(2026) 映画のタイトル')
  })

  it('括弧のあとに空白が無ければ残す', () => {
    expect(cleanTitle('(25)固定ページ')).toBe('(25)固定ページ')
  })

  it('undefined は空文字になる', () => {
    expect(cleanTitle(undefined)).toBe('')
  })
})

describe('X / Twitter のタイトル', () => {
  const post = 'https://x.com/AUTOMATONJapan/status/2090615655657853157'

  it('定型部分と t.co リンクを外して「投稿者: 本文」にする', () => {
    expect(
      cleanTitle(
        'XユーザーのAUTOMATON（オートマトン）さん: 「【ニュース】無法漁師生活 https://t.co/lZsxQEXuZE https://t.co/qaC3s08D6O」 / X',
        post,
      ),
    ).toBe('AUTOMATON（オートマトン）: 【ニュース】無法漁師生活')
  })

  it('英語 UI の "Name on X" 形式も扱う', () => {
    expect(cleanTitle('AUTOMATON on X: "hello world https://t.co/abc123" / X', post)).toBe(
      'AUTOMATON: hello world',
    )
  })

  it('旧 Twitter 形式も扱う', () => {
    expect(cleanTitle('AUTOMATONさんはTwitterを使っています: 「こんにちは」 / Twitter', post)).toBe(
      'AUTOMATON: こんにちは',
    )
  })

  it('本文に「」が含まれていても壊れない', () => {
    expect(cleanTitle('Xユーザーのfooさん: 「『A』と「B」の話」 / X', post)).toBe(
      'foo: 『A』と「B」の話',
    )
  })

  it('プロフィールページは末尾の / X だけ落とす', () => {
    expect(
      cleanTitle('AUTOMATON（オートマトン）(@AUTOMATONJapan) / X', 'https://x.com/AUTOMATONJapan'),
    ).toBe('AUTOMATON（オートマトン）(@AUTOMATONJapan)')
  })

  it('未読件数が付いていても処理できる', () => {
    expect(cleanTitle('(3) Xユーザーのfooさん: 「本文」 / X', post)).toBe('foo: 本文')
  })

  it('X 以外のサイトのタイトルは触らない', () => {
    const title = 'Xユーザーのfooさん: 「本文」 / X'
    expect(cleanTitle(title, 'https://example.com/')).toBe(title)
  })
})

describe('Markdown リンクの組み立て', () => {
  it('通常のリンク', () => {
    expect(toMarkdownLink('(3) 通知あり - Example', 'https://example.com/')).toBe(
      '[通知あり - Example](https://example.com/)',
    )
  })

  it('X の投稿', () => {
    expect(
      toMarkdownLink(
        'Xユーザーのfooさん: 「本文 https://t.co/abc123」 / X',
        'https://x.com/foo/status/123',
      ),
    ).toBe('[foo: 本文](https://x.com/foo/status/123)')
  })

  it('画像 URL は ! が付く', () => {
    expect(toMarkdownLink('猫', 'https://example.com/cat.png')).toBe(
      '![猫](https://example.com/cat.png)',
    )
  })

  it('タイトルの [] をエスケープする', () => {
    expect(toMarkdownLink('[WIP] 実装中', 'https://example.com/')).toBe(
      '[\\[WIP\\] 実装中](https://example.com/)',
    )
  })

  it('括弧を含む URL は山括弧で囲む', () => {
    expect(toMarkdownLink('記事', 'https://ja.wikipedia.org/wiki/Foo_(bar)')).toBe(
      '[記事](<https://ja.wikipedia.org/wiki/Foo_(bar)>)',
    )
  })

  it('タイトルが空なら URL を使う', () => {
    expect(toMarkdownLink('   ', 'https://example.com/')).toBe(
      '[https://example.com/](https://example.com/)',
    )
  })
})
