import fs from 'node:fs'
import path from 'node:path'
import { IconThread } from './Icons'

/**
 * **写真の差し替え口。**
 * `public/photos/<name>` にファイルを置けば写真になり、無い間は淡い面で持たせる。
 * 静的書き出しなので判定はビルド時の1回きり ― 写真を足したら再ビルドが要る。
 *
 * **各社サイトからの転載も、Places の写真も使えない**（著作権と規約）。
 * ここに置いてよいのは、自分で用意した画像か、掲載先から提供された画像だけ。
 */
export function hasPhoto(src: string | null | undefined): src is string {
  if (!src) return false
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

/** 候補を順に見て、最初に実在するものを返す。無ければ null */
export function pickPhoto(...cands: (string | null | undefined)[]) {
  return cands.find((c) => hasPhoto(c)) ?? null
}

export function Photo({
  src,
  alt,
  className,
  label,
  fallback,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  /** 枠の中に薄く出す文字。写真が来たら消える */
  label?: string
  /** src が無いときに代わりに使う画像 */
  fallback?: string
}) {
  const real = pickPhoto(src, fallback)
  return (
    <div className={['photo', className].filter(Boolean).join(' ')} data-empty={real ? undefined : ''}>
      {real ? (
        <img src={real} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <span className="photo-holder" aria-hidden>
          <IconThread size={26} />
          {label ? <b>{label}</b> : null}
        </span>
      )}
    </div>
  )
}
