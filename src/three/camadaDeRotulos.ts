import { createContext, type RefObject } from 'react'

/** Camada (div por cima do canvas) onde os rótulos HTML da cena 3D são colocados. */
export const CamadaDeRotulos = createContext<RefObject<HTMLDivElement | null> | null>(null)
