import * as React from "react"

const MOBILE_BREAKPOINT = 768

// useSyncExternalStore em vez de useState+useEffect: setState síncrono no
// corpo do efeito (a leitura inicial, fora do callback do evento) dispara
// cascading renders. Este é o padrão que o React recomenda para sincronizar
// com um external store como matchMedia, sem esse problema.
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
