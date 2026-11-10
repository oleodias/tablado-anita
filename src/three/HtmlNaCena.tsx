// Rótulos HTML dentro da cena 3D (nomes, placas, mesas).
//
// O <Html> do drei, por padrão, pendura os rótulos dentro do elemento do
// próprio <Canvas>, que é controlado pelo React. Ao sair da tela isso causava o
// erro "removeChild: The node to be removed is not a child of this node".
// Aqui os rótulos vão para uma camada nossa, por cima do canvas.
import { Html } from '@react-three/drei'
import { useContext, type ComponentProps } from 'react'
import { CamadaDeRotulos } from './camadaDeRotulos'

export function HtmlNaCena(props: ComponentProps<typeof Html>) {
  const camada = useContext(CamadaDeRotulos)
  return <Html portal={(camada ?? undefined) as ComponentProps<typeof Html>['portal']} {...props} />
}
