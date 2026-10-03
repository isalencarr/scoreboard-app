import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Log de eventos de um jogo, do mais recente para o mais antigo, com novos
 * eventos chegando por realtime.
 *
 * @param {string | undefined} gameId
 * @returns {{
 *   events: import('../types/game').GameEvent[]
 *   loading: boolean
 *   error: Error | null
 * }}
 */
export function useGameEvents(gameId) {
  // loadedFor amarra o resultado ao jogo, evitando setState no corpo do efeito
  // ao trocar de jogo.
  const [state, setState] = useState({
    events: [],
    error: null,
    loadedFor: null,
  })

  useEffect(() => {
    if (!gameId) return

    let isCancelled = false

    supabase
      .from('game_events')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (isCancelled) return
        setState({
          events: data ?? [],
          error: error ?? null,
          loadedFor: gameId,
        })
      })

    const channel = supabase
      .channel(`game_events:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_events',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (isCancelled || !payload.new) return
          setState((prev) =>
            prev.loadedFor !== gameId ||
            prev.events.some((event) => event.id === payload.new.id)
              ? prev
              : { ...prev, events: [payload.new, ...prev.events] }
          )
        }
      )
      .subscribe()

    return () => {
      isCancelled = true
      supabase.removeChannel(channel)
    }
  }, [gameId])

  const isCurrent = state.loadedFor === gameId

  return {
    events: isCurrent ? state.events : [],
    loading: !!gameId && !isCurrent,
    error: isCurrent ? state.error : null,
  }
}
