import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorkshopState, restoreWorkshop, toggleClay } from '../src/state/workshopModel.ts'

test('new experience initializes reserved fields without fabricating a pattern', () => {
  const state = createWorkshopState()
  assert.ok(state.experienceId)
  assert.notEqual(state.experienceId, createWorkshopState().experienceId)
  assert.deepEqual(state.selectedClays, [])
  assert.deepEqual(state.gesturePath, [])
  assert.equal(state.twistCount, 0)
  assert.equal(state.foldCount, 0)
  assert.equal(state.generatedPattern, null)
  assert.equal(state.vesselType, null)
})

test('selection preserves order and rejects a third clay', () => {
  let state = createWorkshopState()
  const id = state.experienceId
  state = toggleClay(toggleClay(state, 'ivory'), 'umber')
  assert.deepEqual(state.selectedClays.map(c => c.id), ['ivory', 'umber'])
  assert.equal(toggleClay(state, 'ink'), state)
  assert.equal(state.experienceId, id)
})

test('either selected clay can be removed and replaced without duplication', () => {
  let state = toggleClay(toggleClay(createWorkshopState(), 'ivory'), 'umber')
  state = toggleClay(state, 'ivory')
  assert.deepEqual(state.selectedClays.map(c => c.id), ['umber'])
  state = toggleClay(state, 'terracotta')
  assert.deepEqual(state.selectedClays.map(c => c.id), ['umber', 'terracotta'])
  state = toggleClay(toggleClay(state, 'terracotta'), 'umber')
  assert.equal(state.selectedClays.length, 0)
})

test('refresh restores the same experience and exact colour snapshots', () => {
  const state = toggleClay(toggleClay(createWorkshopState(), 'ink'), 'terracotta')
  state.selectedClays[0].color = '#34312f'
  assert.deepEqual(restoreWorkshop(JSON.stringify(state)), state)
})

test('malformed, obsolete or invalid saved selections recover to an empty usable state', () => {
  const state = toggleClay(createWorkshopState(), 'ivory')
  const invalid = [null, '{', 'null', '{}', JSON.stringify({ ...state, schemaVersion: 99 }),
    JSON.stringify({ ...state, selectedClays: [null] }),
    JSON.stringify({ ...state, selectedClays: [state.selectedClays[0], state.selectedClays[0]] }),
    JSON.stringify({ ...state, selectedClays: [{ ...state.selectedClays[0], id: 'unknown' }] }),
    JSON.stringify({ ...state, selectedClays: [{ ...state.selectedClays[0], color: 'invalid' }] }),
    JSON.stringify({ ...state, selectedClays: Array(3).fill(state.selectedClays[0]) })]
  for (const raw of invalid) {
    const recovered = restoreWorkshop(raw)
    assert.equal(recovered.selectedClays.length, 0)
    assert.equal(toggleClay(recovered, 'ivory').selectedClays.length, 1)
  }
})
