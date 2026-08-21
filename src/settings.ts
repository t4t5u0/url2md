export type Settings = {
  /** Amazon の商品 URL を https://<host>/dp/<ASIN> まで削る */
  amazonShorten: boolean
  /** utm_* / ref= などのトラッキング・リファラーパラメータを除去する */
  stripTracking: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  amazonShorten: true,
  stripTracking: true,
}

/** 未設定のキーは DEFAULT_SETTINGS の値で埋められる */
export async function loadSettings(): Promise<Settings> {
  return (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Settings
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch)
}
