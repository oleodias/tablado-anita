// Componentes visuais básicos reutilizados nas telas.
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function Botao({
  variante = 'primario',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'primario' | 'secundario' | 'texto' }) {
  const estilos = {
    primario: 'bg-marca text-marca-texto hover:brightness-110',
    secundario: 'bg-superficie-2 text-texto border border-borda hover:bg-borda/40',
    texto: 'text-link hover:underline px-1',
  }[variante]
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${estilos} ${className}`}
      {...props}
    />
  )
}

export function Campo({
  rotulo,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; id: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-texto-suave">{rotulo}</span>
      <input
        id={id}
        className="min-h-11 rounded-xl border border-borda bg-superficie px-3 text-base text-texto outline-none focus:border-marca focus:ring-2 focus:ring-marca/30"
        {...props}
      />
    </label>
  )
}

export function Aviso({ tipo, children }: { tipo: 'erro' | 'sucesso'; children: ReactNode }) {
  const cor = tipo === 'erro' ? 'border-perigo/40 text-perigo' : 'border-sucesso/40 text-sucesso'
  return (
    <p role={tipo === 'erro' ? 'alert' : 'status'} className={`rounded-xl border bg-superficie px-3 py-2 text-sm ${cor}`}>
      {children}
    </p>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-texto-suave" aria-live="polite">
      <span className="mr-3 inline-block size-5 animate-spin rounded-full border-2 border-borda border-t-marca" />
      {texto}
    </div>
  )
}

export function Marca() {
  return (
    <div className="flex items-center gap-3">
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-9" />
      <div className="leading-tight">
        <p className="font-semibold">Tablado Anita</p>
        <p className="text-xs text-texto-suave">Grupo de Artes Nativas Anita Garibaldi</p>
      </div>
    </div>
  )
}
