import type { KilnDraft } from '../features/kiln/model'
import type { ShapeDraft } from '../features/shaping/model'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ClayId } from '../config/clays'
import { createWorkshopState, restoreWorkshop, toggleClay, saveOperations, saveFinalPattern, saveShapeDraft, saveKilnDraft, WORKSHOP_STORAGE_KEY, type WorkshopState, type GeneratedPattern } from './workshopModel'
import type { FinalPattern } from '../features/reveal/pattern'
import type { CraftOperation } from '../features/marbling/engine'
import {archivePattern,finalizeIdentity} from '../features/collection/model'
type WorkshopContextValue = { state: WorkshopState; storageAvailable: boolean; finalizeWork:()=>void; archiveAndRestart:()=>boolean; selectClay: (id: ClayId) => void; saveMarbling: (operations: CraftOperation[], pattern?: GeneratedPattern) => void; saveShape: (draft: ShapeDraft) => void; saveKiln: (draft: KilnDraft) => void; saveReveal: (pattern: FinalPattern) => void }
const WorkshopContext = createContext<WorkshopContextValue | null>(null)
function loadState() {
  try { return restoreWorkshop(window.localStorage.getItem(WORKSHOP_STORAGE_KEY)) }
  catch { return createWorkshopState() }
}
export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState)
  const current = useRef(state)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const persist = (next: WorkshopState) => {
    current.current = next
    setState(next)
    try { window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(next)); setStorageAvailable(true) }
    catch { setStorageAvailable(false) }
  }
  useEffect(() => {
    persist(current.current)
  }, [])
  const value = useMemo(() => ({ state, storageAvailable,
    finalizeWork:()=>{const next=finalizeIdentity(current.current);if(next!==current.current)persist(next)},
    archiveAndRestart:()=>{
      try {
        archivePattern(window.localStorage,finalizeIdentity(current.current))
        const next=createWorkshopState()
        window.localStorage.setItem(WORKSHOP_STORAGE_KEY,JSON.stringify(next))
        current.current=next;setState(next);setStorageAvailable(true);return true
      }catch{setStorageAvailable(false);return false}
    },
    selectClay: (id: ClayId) => persist(toggleClay(current.current, id)),
    saveMarbling: (operations: CraftOperation[], pattern?: GeneratedPattern) => persist(saveOperations(current.current, operations, pattern)),
    saveKiln: (draft: KilnDraft) => persist(saveKilnDraft(current.current, draft)),
    saveShape: (draft: ShapeDraft) => persist(saveShapeDraft(current.current, draft)),
    saveReveal: (pattern: FinalPattern) => persist(saveFinalPattern(current.current, pattern)),
  }), [state, storageAvailable])
  return <WorkshopContext.Provider value={value}>{children}</WorkshopContext.Provider>
}
/** Every subsequent making page must consume this same state. */
export function useWorkshop() {
  const value = useContext(WorkshopContext)
  if (!value) throw new Error('useWorkshop must be used within WorkshopProvider')
  return value
}
