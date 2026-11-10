// Componentes visuais básicos reutilizados nas telas.
import {
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { corDoTextoSobre } from '../domain/pares'

export function Botao({
  variante = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' | 'texto' | 'perigo' }) {
  const estilos = {
    primario: 'bg-marca text-marca-texto hover:brightness-110',
    secundario: 'bg-superficie-2 text-texto border border-borda hover:bg-borda/40',
    texto: 'text-link hover:underline px-1',
    perigo: 'bg-superficie text-perigo border border-perigo/40 hover:bg-perigo/10',
  }[variante]
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${estilos} ${className}`}
      {...props}
    />
  )
}

const estiloEntrada =
  'min-h-11 w-full rounded-xl border border-borda bg-superficie px-3 text-base text-texto outline-none focus:border-marca focus:ring-2 focus:ring-marca/30'

export function Campo({
  rotulo,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; id: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-texto-suave">{rotulo}</span>
      <input id={id} className={estiloEntrada} {...props} />
    </label>
  )
}

export function CampoTexto({
  rotulo,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo: string; id: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-texto-suave">{rotulo}</span>
      <textarea id={id} rows={3} className={`${estiloEntrada} py-2`} {...props} />
    </label>
  )
}

export function Selecao({
  rotulo,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo?: string; id: string }) {
  const campo = (
    <select id={id} className={estiloEntrada} {...props}>
      {children}
    </select>
  )
  if (!rotulo) return campo
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-texto-suave">{rotulo}</span>
      {campo}
    </label>
  )
}

/** Botões lado a lado para escolher uma opção (ex.: Peão / Prenda). */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
  desabilitado,
  compacto,
}: {
  opcoes: { valor: T; texto: string }[]
  valor: T
  aoMudar: (v: T) => void
  rotulo?: string
  desabilitado?: boolean
  compacto?: boolean
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      {rotulo && (
        <span id={id} className="text-sm font-medium text-texto-suave">
          {rotulo}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={rotulo ? id : undefined}
        className="flex rounded-xl border border-borda bg-superficie-2 p-1"
      >
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={valor === o.valor}
            disabled={desabilitado}
            onClick={() => aoMudar(o.valor)}
            className={`flex-1 rounded-lg px-2 font-medium transition disabled:opacity-50 ${compacto ? 'min-h-9 text-xs' : 'min-h-10 text-sm'} ${
              valor === o.valor ? 'bg-superficie text-texto shadow-sm' : 'text-texto-suave hover:text-texto'
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Aviso({ tipo, children }: { tipo: 'erro' | 'sucesso' | 'info'; children: ReactNode }) {
  const cor = {
    erro: 'border-perigo/40 text-perigo',
    sucesso: 'border-sucesso/40 text-sucesso',
    info: 'border-borda text-texto-suave',
  }[tipo]
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={`rounded-xl border bg-superficie px-3 py-2 text-sm ${cor}`}>
      {children}
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-texto-suave" aria-live="polite">
      <span className="mr-3 inline-block size-5 animate-spin rounded-full border-2 border-borda border-t-marca" />
      {texto}
    </div>
  )
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-borda px-4 py-10 text-center">
      <p className="font-medium">{titulo}</p>
      {children && <div className="mt-1 text-sm text-texto-suave">{children}</div>}
    </div>
  )
}

export function Etiqueta({ children, cor }: { children: ReactNode; cor?: 'marca' | 'destaque' | 'perigo' | 'sucesso' }) {
  const estilo = {
    marca: 'bg-marca/15 text-link',
    destaque: 'bg-destaque/20 text-texto',
    perigo: 'bg-perigo/15 text-perigo',
    sucesso: 'bg-sucesso/15 text-sucesso',
    neutra: 'bg-superficie-2 text-texto-suave',
  }[cor ?? 'neutra']
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estilo}`}>{children}</span>
}

export function CabecalhoPagina({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-texto-suave">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex gap-2">{acoes}</div>}
    </header>
  )
}

/** Quadradinho com o número do par, na cor do par. */
export function NumeroPar({ numero, cor, tamanho = 'md' }: { numero: number | null; cor: string; tamanho?: 'md' | 'lg' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-bold ${
        tamanho === 'lg' ? 'size-12 rounded-xl text-lg' : 'size-9 rounded-lg text-sm'
      }`}
      style={{ background: cor, color: corDoTextoSobre(cor) }}
    >
      {numero ?? '–'}
    </span>
  )
}

/** Bolinha com as iniciais do integrante, na cor do par. */
export function Avatar({ nome, cor, tamanho = 'md' }: { nome: string; cor?: string; tamanho?: 'sm' | 'md' }) {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 bg-superficie-2 font-semibold text-texto ${
        tamanho === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm'
      }`}
      style={{ borderColor: cor ?? 'var(--borda)' }}
    >
      {iniciais}
    </span>
  )
}

/**
 * Janela de formulário: aparece de baixo para cima no celular e centralizada no
 * computador. Fecha com Esc ou tocando fora.
 */
export function Folha({
  aberta,
  aoFechar,
  titulo,
  children,
  rodape,
}: {
  aberta: boolean
  aoFechar: () => void
  titulo: string
  children: ReactNode
  rodape?: ReactNode
}) {
  const id = useId()

  useEffect(() => {
    if (!aberta) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    document.addEventListener('keydown', aoTeclar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // O resto da página fica "inerte" (sem foco nem leitura) enquanto a janela está aberta.
    const raiz = document.getElementById('root')
    raiz?.setAttribute('inert', '')
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflowAnterior
      raiz?.removeAttribute('inert')
    }
  }, [aberta, aoFechar])

  if (!aberta) return null

  // Renderizada fora do #root para não ficar inerte junto com a página.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={aoFechar} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-borda bg-fundo shadow-xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-borda px-5 py-4">
          <h2 id={id} className="text-lg font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="inline-flex size-11 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-2"
          >
            <Icone nome="fechar" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {rodape && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-borda px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

const CAMINHOS_ICONES = {
  inicio: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  dancas: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  integrantes:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  pares: 'M4 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0M14 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0M2 21v-2a5 5 0 0 1 8-4M22 21v-2a5 5 0 0 0-8-4M10 15h4',
  acessos: 'M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5zM9 12l2 2 4-4',
  mais: 'M12 5v14M5 12h14',
  fechar: 'M6 6l12 12M18 6 6 18',
  voltar: 'M15 18l-6-6 6-6',
  busca: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  alerta: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  ok: 'M20 6 9 17l-5-5',
} as const

export type NomeIcone = keyof typeof CAMINHOS_ICONES

export function Icone({ nome, className = 'size-5' }: { nome: NomeIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={CAMINHOS_ICONES[nome]} />
    </svg>
  )
}

export function Marca({ compacta }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="size-10 object-contain dark:rounded-full dark:bg-white/90 dark:p-0.5" />
      <div className={`leading-tight ${compacta ? 'hidden sm:block' : ''}`}>
        <p className="font-semibold">Tablado Anita</p>
        <p className="text-xs text-texto-suave">Grupo de Artes Nativas Anita Garibaldi</p>
      </div>
    </div>
  )
}
