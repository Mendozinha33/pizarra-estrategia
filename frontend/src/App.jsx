import { useCallback, useState } from 'react'

import { Header } from './components/layout/Header.jsx'
import { useToast } from './components/ui/Toast.jsx'
import { BoardView } from './features/board/BoardView.jsx'
import { PlaysView } from './features/plays/PlaysView.jsx'
import { SessionView } from './features/session/SessionView.jsx'
import { useDebouncedValue } from './hooks/useDebouncedValue.js'
import { usePlays } from './hooks/usePlays.js'
import { useTrainingSession } from './hooks/useTrainingSession.js'
import { useWorkspace } from './hooks/useWorkspace.js'

export default function App() {
  const toast = useToast()
  const [view, setView] = useState('pizarra')
  const [filters, setFilters] = useState({ category: '', search: '' })

  // El buscador no debe lanzar una petición por tecla.
  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const plays = usePlays({ category: filters.category, search: debouncedSearch })
  const session = useTrainingSession()
  const workspace = useWorkspace(plays)

  const offline = plays.error?.status === 0 || session.error?.status === 0

  const openPlay = useCallback(
    (play) => {
      workspace.openPlay(play)
      setView('pizarra')
    },
    [workspace],
  )

  const deletePlay = useCallback(
    async (play) => {
      if (!window.confirm(`¿Eliminar la jugada "${play.name}"?`)) return
      try {
        await plays.remove(play.id)
        if (workspace.editingPlay?.id === play.id) workspace.setEditingPlay(null)
        session.reload() // los bloques que la usaban se quedan sin diagrama
        toast.success('Jugada eliminada')
      } catch (error) {
        toast.error(error.message)
      }
    },
    [plays, session, workspace, toast],
  )

  const addBlock = useCallback(
    async (play) => {
      try {
        await session.addBlock(
          play ? { title: play.name, play_id: play.id } : { title: 'Nuevo bloque' },
        )
        setView('sesion')
      } catch (error) {
        toast.error(error.message)
      }
    },
    [session, toast],
  )

  const removeBlock = useCallback(
    async (blockId) => {
      try {
        await session.removeBlock(blockId)
      } catch (error) {
        toast.error(error.message)
      }
    },
    [session, toast],
  )

  return (
    <>
      <Header view={view} onViewChange={setView} offline={offline} />
      <main>
        {view === 'pizarra' && <BoardView workspace={workspace} plays={plays} />}

        {view === 'jugadas' && (
          <PlaysView
            plays={plays}
            filters={filters}
            onFiltersChange={setFilters}
            onOpen={openPlay}
            onAddToSession={addBlock}
            onDelete={deletePlay}
            onGoToBoard={() => setView('pizarra')}
          />
        )}

        {view === 'sesion' && (
          <SessionView
            session={{ ...session, removeBlock }}
            plays={plays.plays}
            onAddBlock={addBlock}
            onOpenPlay={openPlay}
          />
        )}
      </main>
    </>
  )
}
