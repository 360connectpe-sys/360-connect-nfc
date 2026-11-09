import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, MapPin, Wifi } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PageHeader } from '../components/ui'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from '../components/BrandIcons'
import { track } from '../services/analytics'

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Respaldo para navegadores sin Clipboard API (o http sin https)
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export default function Connect() {
  const { restaurant, showToast } = useApp()
  const { links, wifi } = restaurant
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(true)

  const socials = [
    { id: 'instagram', label: 'Instagram', sub: '@casanativa', href: links.instagram, Icon: InstagramIcon, cls: 'bg-linear-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white' },
    { id: 'tiktok', label: 'TikTok', sub: '@casanativa', href: links.tiktok, Icon: TikTokIcon, cls: 'bg-black text-white' },
    { id: 'facebook', label: 'Facebook', sub: 'Casa Nativa', href: links.facebook, Icon: FacebookIcon, cls: 'bg-[#1877f2] text-white' },
    { id: 'whatsapp', label: 'WhatsApp', sub: 'Escríbenos', href: links.whatsapp, Icon: WhatsAppIcon, cls: 'bg-[#25d366] text-white' },
  ]

  const onCopy = async () => {
    const ok = await copyText(wifi.password)
    if (ok) {
      setCopied(true)
      showToast('Contraseña copiada ✓')
      track('wifi_copy')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-dvh bg-cream pb-6">
      <PageHeader title="Conéctate" subtitle="Wi-Fi, redes sociales y contacto" />

      {/* Wi-Fi */}
      <section className="mx-4 animate-fade-up rounded-3xl bg-white p-5 shadow-sm ring-1 ring-latte/50">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-olive/12 text-olive">
            <Wifi className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">Wi-Fi gratis</h2>
            <p className="text-xs text-cocoa/60">Red para clientes · {wifi.security}</p>
          </div>
        </div>

        <dl className="mt-5 space-y-3">
          <div className="rounded-2xl bg-sand/70 px-4 py-3">
            <dt className="text-[11px] font-bold tracking-wide text-cocoa/60 uppercase">Nombre de la red</dt>
            <dd className="mt-0.5 font-mono text-lg font-bold break-all">{wifi.ssid}</dd>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-sand/70 px-4 py-3">
            <div className="min-w-0 flex-1">
              <dt className="text-[11px] font-bold tracking-wide text-cocoa/60 uppercase">Contraseña</dt>
              <dd className="mt-0.5 font-mono text-lg font-bold break-all">{show ? wifi.password : '•'.repeat(wifi.password.length)}</dd>
            </div>
            <button onClick={() => setShow(!show)} aria-label={show ? 'Ocultar' : 'Mostrar'} className="grid size-10 place-items-center rounded-full text-cocoa/70 active:bg-latte/50">
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </dl>

        <button
          onClick={onCopy}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition active:scale-[0.98] ${
            copied ? 'bg-olive text-cream' : 'bg-espresso text-cream'
          }`}
        >
          {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
          {copied ? '¡Copiada!' : 'Copiar contraseña'}
        </button>
      </section>

      {/* Redes */}
      <h2 className="mx-4 mt-7 font-display text-xl font-bold">Síguenos y comparte</h2>
      <p className="mx-4 mt-1 text-sm text-cocoa/65">Etiquétanos en tu foto y participa en sorteos mensuales.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 px-4">
        {socials.map(({ id, label, sub, href, Icon, cls }, i) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={() => track(`social:${id}`)}
            style={{ animationDelay: `${i * 50}ms` }}
            className={`flex animate-fade-up flex-col gap-6 rounded-3xl p-4 shadow-md transition active:scale-95 ${cls}`}
          >
            <Icon className="size-8" />
            <div>
              <p className="font-bold">{label}</p>
              <p className="text-xs opacity-80">{sub}</p>
            </div>
          </a>
        ))}
      </div>

      <a
        href={links.maps}
        target="_blank"
        rel="noreferrer"
        onClick={() => track('social:maps')}
        className="mx-4 mt-3 flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-latte/50 transition active:scale-[0.98]"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-terra/10 text-terra">
          <MapPin className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Cómo llegar · Google Maps</p>
          <p className="truncate text-xs text-cocoa/65">{restaurant.address}</p>
        </div>
        <span className="text-sm font-bold text-terra">Abrir</span>
      </a>

      <p className="mx-4 mt-5 text-center text-[11px] text-cocoa/50">
        ¿Te gustó? Déjanos una reseña en Google Maps ⭐⭐⭐⭐⭐
      </p>
    </div>
  )
}
