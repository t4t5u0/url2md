import { DEFAULT_SETTINGS, loadSettings, type Settings, saveSettings } from './settings'
import { cleanUrl } from './url-cleaner'

const SAMPLE_URL =
  'https://www.amazon.co.jp/dp/B08N5WRWNW/ref=sr_1_3?crid=2ABCDEF&keywords=echo&qid=1700000000&sprefix=echo&sr=8-3&utm_source=newsletter'

const toggles = ['amazonShorten', 'stripTracking'] as const

const sample = must<HTMLInputElement>('sample')
const result = must<HTMLDivElement>('result')
const status = must<HTMLElement>('status')

let settings: Settings = DEFAULT_SETTINGS
let statusTimer: number | undefined

void init()

async function init(): Promise<void> {
  settings = await loadSettings()

  for (const key of toggles) {
    const input = must<HTMLInputElement>(key)
    input.checked = settings[key]
    input.addEventListener('change', () => {
      settings = { ...settings, [key]: input.checked }
      void saveSettings({ [key]: input.checked })
      flashStatus()
      renderPreview()
    })
  }

  sample.value = SAMPLE_URL
  sample.addEventListener('input', renderPreview)
  renderPreview()
}

function renderPreview(): void {
  const input = sample.value.trim()
  if (!input) {
    result.textContent = 'URL を入力すると変換結果を表示します'
    result.classList.add('same')
    return
  }

  const cleaned = cleanUrl(input, settings)
  result.textContent = cleaned
  result.classList.toggle('same', cleaned === input)
}

function flashStatus(): void {
  status.classList.add('show')
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => status.classList.remove('show'), 1_200)
}

function must<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) throw new Error(`missing element: #${id}`)
  return element as T
}
