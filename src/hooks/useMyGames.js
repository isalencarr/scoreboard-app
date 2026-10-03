import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { fetchMyFinishedGames, fetchMyGames } from './useGameActions'

/**
 * Carrega os jogos do usuário logado. Sem sessão, devolve lista vazia sem
 * tocar no banco.
 *
 * @param {{ finishedOnly?: boolean }} [options]
 * @returns {{
 *   games: import('../types/game').Game[]
 *   loading: boolean
 *   error: Error | null
 *   signedIn: boolean
 *   initializing: boolean
 * }}
 */
export function useMyGames({ finishedOnly = false } = {}) {
  const { session, initializing } = useAuth()
  const userId = session?.user?.id ?? null

  // loadedFor amarra o resultado ao usuário, então trocar de conta invalida
  // a lista sem precisar de setState no corpo do efeito.
  const [result, setResult] = useState({
    games: [],
    error: null,
    loadedFor: null,
  })

  useEffect(() => {
    if (initializing || !userId) return

    let isCancelled = false
    const load = finishedOnly ? fetchMyFinishedGames : fetchMyGames

    load()
      .then((games) => {
        if (!isCancelled) setResult({ games, error: null, loadedFor: userId })
      })
      .catch((error) => {
        if (!isCancelled) setResult({ games: [], error, loadedFor: userId })
      })

    return () => {
      isCancelled = true
    }
  }, [userId, initializing, finishedOnly])

  const isCurrent = result.loadedFor === userId

  return {
    games: isCurrent ? result.games : [],
    loading: !initializing && !!userId && !isCurrent,
    error: isCurrent ? result.error : null,
    signedIn: !!userId,
    initializing,
  }
}
