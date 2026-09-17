'use client'

import { useState } from 'react'
import { IconArrow, IconGuide, IconShop } from './Icons'

const TO = 'contact@umidas.info'

/**
 * 問い合わせ。**送信先はメール1本**（この媒体はサーバーを持たない静的サイト）。
 * 入力した内容はどこへも送信されず、ブラウザが作るメールの下書きに入るだけ。
 * だから外部のフォームサービスを挟まずに済み、プライバシーポリシーの前提も変わらない。
 *
 * **メールアプリが開かない人のために、宛先は文字でも出しておく。**
 */
const KINDS = [
  {
    key: 'listing',
    label: '掲載・訂正のご依頼',
    icon: IconShop,
    subject: '【掲載・訂正のご依頼】',
    fields: true,
    hint: '掲載店の方・掲載を希望される方へ。掲載は無料で、内容の訂正・削除も承ります。',
    placeholder: '例）持ち込みは1枚から受けています。納期の記載を「3営業日」に直してください。',
  },
  {
    key: 'feedback',
    label: 'ご意見・情報提供',
    icon: IconGuide,
    subject: '【ご意見・情報提供】',
    fields: false,
    hint: '店を探している方へ。この地域に店が無い・情報が古いなどお知らせください。個別の見積もりには対応できません。',
    placeholder: '例）◯◯市に刺繍屋があります。／掲載の電話番号が変わっているようです。',
  },
] as const

export function ContactForm() {
  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('listing')
  const [shop, setShop] = useState('')
  const [url, setUrl] = useState('')
  const [body, setBody] = useState('')
  const k = KINDS.find((x) => x.key === kind)!

  // **ボタンではなくリンクにする。** 右クリックでコピーでき、押す前に宛先が分かる
  const lines = [
    ...(k.fields ? [`店名：${shop || '（未記入）'}`, `サイト：${url || '（未記入）'}`, ''] : []),
    body,
    '',
    '---',
    'ネーム刺繍ナビ（https://name-shishu.com/）の問い合わせフォームから',
  ]
  const subject = k.subject + (k.fields && shop ? ` ${shop}` : '')
  const mailto = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`

  return (
    <div className="contact-box">
      <fieldset className="contact-kind">
        <legend className="sr-only">お問い合わせの種類</legend>
        {KINDS.map((x) => (
          <label key={x.key} className={`kind-btn${kind === x.key ? ' is-on' : ''}`}>
            <input
              type="radio"
              name="contact-kind"
              value={x.key}
              checked={kind === x.key}
              onChange={() => setKind(x.key)}
            />
            <x.icon size={18} />
            <b>{x.label}</b>
          </label>
        ))}
      </fieldset>

      <p className="contact-hint">{k.hint}</p>

      <div className="contact-fields">
        {k.fields ? (
          <>
            <label className="field">
              <span>店名</span>
              <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="有限会社◯◯刺繍" />
            </label>
            <label className="field">
              <span>サイトのURL</span>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" />
            </label>
          </>
        ) : null}
        <label className="field field-wide">
          <span>ご用件</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder={k.placeholder} />
        </label>
      </div>

      <div className="contact-foot">
        <a className="btn" href={mailto}>
          メールを作成する<IconArrow size={18} />
        </a>
        {/* **ここで送信は起きない。** 誤解されると「送ったのに返事が来ない」になる */}
        <p className="muted">
          押すとメールアプリが開きます（<b>この画面からは送信されません</b>）。
          開かないときは <a href={`mailto:${TO}`}>{TO}</a> へ。
        </p>
      </div>
    </div>
  )
}
