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

describe('Markdown リンクの組み立て', () => {
  it('通常のリンク', () => {
    expect(toMarkdownLink('(3) 通知あり - Example', 'https://example.com/')).toBe(
      '[通知あり - Example](https://example.com/)',
    )
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
