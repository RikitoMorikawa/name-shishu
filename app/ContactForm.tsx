'use client'

import { useState } from 'react'
import { IconArrow, IconCheck, IconGuide, IconShop } from './Icons'

const TO = 'contact@umidas.info'
/**
 * **この媒体はサーバーを持たない**（静的書き出し）。画面から送信するには外部の
 * 受け口が要るので FormSubmit を使う。登録不要で、入力内容は同社を経由して TO へ届く。
 * **プライバシーポリシーの第5節に、経由することを書いてある。**
 *
 * 落ちたときは mailto: のリンクを出す ― 外部サービスが止まっても連絡手段を絶やさない。
 */
const ENDPOINT = `https://formsubmit.co/ajax/${TO}`

const KINDS = [
  {
    key: 'feedback',
    label: 'ご意見・情報提供',
    icon: IconGuide,
    subject: '【ご意見・情報提供】',
    fields: false,
    hint: '店を探している方へ。この地域に店が無い・情報が古いなどお知らせください。個別の見積もりには対応できません。',
    placeholder: '例）◯◯市に刺繍屋があります。／掲載の電話番号が変わっているようです。',
  },
  {
    key: 'listing',
    label: '掲載・訂正のご依頼',
    icon: IconShop,
    subject: '【掲載・訂正のご依頼】',
    fields: true,
    hint: '掲載店の方・掲載を希望される方へ。内容の訂正・削除も承ります。',
    placeholder: '例）持ち込みは1枚から受けています。納期の記載を「3営業日」に直してください。',
  },
] as const

export function ContactForm() {
  // **初期は「ご意見・情報提供」。** 来訪者の大半は店を探している人で、
  // 掲載店より数が多い。店名の欄も出ないぶん、最初の見た目が軽くなる
  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('feedback')
  const [shop, setShop] = useState('')
  const [url, setUrl] = useState('')
  const [reply, setReply] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const k = KINDS.find((x) => x.key === kind)!

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: k.subject + (k.fields && shop ? ` ${shop}` : ''),
          _template: 'table',
          _captcha: 'false',
          種別: k.label,
          ...(k.fields ? { 店名: shop, サイト: url } : {}),
          返信先: reply,
          ご用件: body,
        }),
      })
      const json = await res.json()
      setState(String(json?.success) === 'true' ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="contact-box contact-done">
        <IconCheck size={26} />
        <div>
          <b>送信しました。</b>
          <span>ありがとうございます。内容を確認のうえ、いただいた返信先へご連絡します。</span>
        </div>
      </div>
    )
  }

  return (
    <form className="contact-box" onSubmit={submit}>
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
        {/* **返信先は要る。** 無いと「直したい」と言われても確認の連絡ができない */}
        <label className="field field-wide">
          <span>返信先のメールアドレス</span>
          <input
            type="email"
            required
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
          />
        </label>
        <label className="field field-wide">
          <span>ご用件</span>
          <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder={k.placeholder} />
        </label>
      </div>

      <div className="contact-foot">
        <button type="submit" className="btn" disabled={state === 'sending'}>
          {state === 'sending' ? '送信しています…' : '送信する'}
          <IconArrow size={18} />
        </button>
        {state === 'error' ? (
          <p className="contact-error">
            送信できませんでした。お手数ですが <a href={`mailto:${TO}`}>{TO}</a> へ直接お送りください。
          </p>
        ) : null}
      </div>
    </form>
  )
}
