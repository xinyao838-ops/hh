import { normalizeKiln, type KilnDraft } from '../features/kiln/model.ts'
import { normalizeShape, type ShapeDraft } from '../features/shaping/model.ts'
import { clayMaterials, type ClayId, type SelectedClay } from '../config/clays.ts'
import { measureOperations, type CraftOperation, type InputKind } from '../features/marbling/engine.ts'
import { marblingConfig } from '../config/marbling.ts'
import { createFinalPattern, type FinalPattern } from '../features/reveal/pattern.ts'
export interface GesturePoint { x: number; y: number; time: number; pressure: number; strokeId: number; pointerType: InputKind }
export interface GeneratedPattern { imageDataUrl: string; width: number; height: number; seed: number; algorithmVersion: number; operationCount: number }
export interface WorkshopState {
  schemaVersion: 2
  experienceId: string
  createdAt: string
  legacyExperienceId?: string
  selectedClays: SelectedClay[]
  interactionSeed: number
  operationLog: CraftOperation[]
  gesturePath: GesturePoint[]
  twistCount: number
  foldCount: number
  pressCount: number
  directionChanges: number
  reverseFoldCount: number
  crossingCount: number
  interactionProgress: number
  generatedPattern: GeneratedPattern | null
  finalPattern: FinalPattern | null
  kilnDraft: KilnDraft | null
  shapeDraft: ShapeDraft | null
  vesselType: string | null
}
export const WORKSHOP_STORAGE_KEY = 'jiaoyiwen.workshop.v1'
function seedFromId(id: string) {
  let seed = 2166136261
  for (const char of id) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619)
  return seed >>> 0
}
export function createWorkshopState(): WorkshopState {
  const experienceId = globalThis.crypto?.randomUUID?.() ?? `clay-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { schemaVersion: 2, experienceId, createdAt:new Date().toISOString(), interactionSeed: seedFromId(experienceId), operationLog: [],
    selectedClays: [], gesturePath: [], twistCount: 0, foldCount: 0, pressCount: 0, directionChanges: 0, reverseFoldCount: 0, crossingCount: 0, interactionProgress: 0, generatedPattern: null, finalPattern: null, shapeDraft: null, kilnDraft: null, vesselType: null }
}
// A colour snapshot is shared unchanged with future pages and retained on reload.
export function toggleClay(state: WorkshopState, id: ClayId): WorkshopState {
  const clean = { ...state, gesturePath: [], operationLog: [], twistCount: 0, foldCount: 0, pressCount: 0, directionChanges: 0, reverseFoldCount: 0, crossingCount: 0, interactionProgress: 0, generatedPattern: null, finalPattern: null, shapeDraft: null, kilnDraft: null, vesselType: null }
  if (state.selectedClays.some(clay => clay.id === id)) return { ...clean, selectedClays: state.selectedClays.filter(clay => clay.id !== id) }
  if (state.selectedClays.length >= 2) return state
  const clay = clayMaterials.find(item => item.id === id)
  if (!clay) return state
  const { name, color, description } = clay
  return { ...clean, selectedClays: [...state.selectedClays, { id, name, color, description }] }
}
export function saveOperations(state: WorkshopState, operations: CraftOperation[], pattern: GeneratedPattern | null = null): WorkshopState {
  const { twistCount, foldCount, pressCount, directionChanges, reverseFoldCount, crossingCount, interactionProgress } = measureOperations(operations)
  const gesturePath: GesturePoint[] = []
  let stroke = -1
  for (const op of operations) if (op.kind === 'drag') {
    if (stroke !== op.strokeId) gesturePath.push({ ...op.from, time: op.time, pressure: op.pressure, strokeId: op.strokeId, pointerType: op.pointerType })
    gesturePath.push({ ...op.to, time: op.time, pressure: op.pressure, strokeId: op.strokeId, pointerType: op.pointerType })
    stroke = op.strokeId
  }
  const next = { ...state, operationLog: operations, gesturePath, twistCount, foldCount, pressCount, directionChanges, reverseFoldCount, crossingCount, interactionProgress, generatedPattern: pattern }
  next.finalPattern = state.finalPattern && createFinalPattern(next)?.sourceKey === state.finalPattern.sourceKey ? state.finalPattern : null
  if (!next.finalPattern) { next.shapeDraft = null; next.kilnDraft = null; next.vesselType = null }
  return next
}
export function saveFinalPattern(state: WorkshopState, pattern: FinalPattern): WorkshopState {
  const expected = createFinalPattern(state)
  return expected?.sourceKey === pattern.sourceKey ? { ...state, finalPattern: expected } : state
}
export function saveShapeDraft(state: WorkshopState, draft: ShapeDraft): WorkshopState {
  const valid = state.finalPattern && normalizeShape(draft, state.finalPattern.sourceKey)
  if (!valid) return state
  const kiln = state.kilnDraft && normalizeKiln(state.kilnDraft, valid)
  return { ...state, shapeDraft: valid, vesselType: valid.vesselType, kilnDraft: kiln ? {...kiln, rotation:valid.rotation} : null }
}
export function saveKilnDraft(state: WorkshopState, draft: KilnDraft): WorkshopState {
  const valid = state.shapeDraft && normalizeKiln(draft, state.shapeDraft)
  return valid ? {...state, kilnDraft:valid} : state
}
function validOperation(value: unknown): value is CraftOperation {
  if (!value || typeof value !== 'object') return false
  const op = value as CraftOperation
  if (op.kind === 'fold' || op.kind === 'twist') return true
  const point = (p: { x: number; y: number }) => p && Number.isFinite(p.x) && p.x >= 0 && p.x <= 1 && Number.isFinite(p.y) && p.y >= 0 && p.y <= 1
  if (op.kind === 'press') return !!point(op.point) && Number.isFinite(op.strength) && op.strength > 0 && op.strength <= 1
  return op.kind === 'drag' && !!point(op.from) && !!point(op.to) && Number.isFinite(op.pressure) && op.pressure >= 0 && op.pressure <= 1
    && Number.isFinite(op.time) && op.time >= 0 && Number.isInteger(op.strokeId) && op.strokeId >= 0 && ['mouse', 'touch', 'pen'].includes(op.pointerType)
}
export function restoreWorkshop(raw: string | null): WorkshopState {
  const fresh = createWorkshopState()
  if (!raw) return fresh
  try {
    const saved = JSON.parse(raw)
    if (![1, 2].includes(saved?.schemaVersion) || typeof saved.experienceId !== 'string' || !saved.experienceId
      || !Array.isArray(saved.selectedClays) || saved.selectedClays.length > 2) return fresh
    const valid = saved.selectedClays.every((clay: SelectedClay | null) => clay
      && clayMaterials.some(item => item.id === clay.id)
      && typeof clay.name === 'string' && typeof clay.description === 'string'
      && typeof clay.color === 'string' && /^#[0-9a-f]{6}$/i.test(clay.color))
    if (!valid || new Set(saved.selectedClays.map((clay: SelectedClay) => clay.id)).size !== saved.selectedClays.length) return fresh
    const base = { ...fresh, experienceId: saved.experienceId, interactionSeed: seedFromId(saved.experienceId), selectedClays: saved.selectedClays }
    if(typeof saved.createdAt==='string'&&Number.isFinite(Date.parse(saved.createdAt)))base.createdAt=saved.createdAt
    if(typeof saved.legacyExperienceId==='string')base.legacyExperienceId=saved.legacyExperienceId
    if (saved.schemaVersion === 1) return base
    if (Number.isInteger(saved.interactionSeed) && saved.interactionSeed >= 0 && saved.interactionSeed <= 0xffffffff) base.interactionSeed = saved.interactionSeed
    if (!Array.isArray(saved.operationLog) || saved.operationLog.length > marblingConfig.maxOperations || !saved.operationLog.every(validOperation) || base.selectedClays.length !== 2) return base
    const counts = measureOperations(saved.operationLog)
    if (counts.twistCount > marblingConfig.maxTwists || counts.foldCount > marblingConfig.maxFolds) return base
    const p = saved.generatedPattern
    const pattern = p && typeof p.imageDataUrl === 'string' && p.imageDataUrl.startsWith('data:image/png;base64,') && p.imageDataUrl.length < 1500000
      && p.seed === base.interactionSeed && p.algorithmVersion === marblingConfig.version && p.operationCount === saved.operationLog.length
      && p.width === marblingConfig.exportSize && p.height === marblingConfig.exportSize && counts.ready ? p : null
    const restored = saveOperations(base, saved.operationLog, pattern)
    // Rebuild validated geometry from the durable source; never trust arbitrary
    // nested arrays in localStorage or show a result from a different clay batch.
    const final = saved.finalPattern && createFinalPattern(restored)
    if (final && saved.finalPattern.version === final.version && saved.finalPattern.sourceKey === final.sourceKey) restored.finalPattern = final
    if (restored.finalPattern) { restored.shapeDraft = normalizeShape(saved.shapeDraft, restored.finalPattern.sourceKey); restored.vesselType = restored.shapeDraft?.vesselType ?? null }
    if (restored.shapeDraft) restored.kilnDraft = normalizeKiln(saved.kilnDraft, restored.shapeDraft)
    return restored
  } catch { return fresh }
}
