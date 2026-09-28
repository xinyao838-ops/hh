import { workshopSteps } from '../config/brand'

/** A preview of the journey, not navigation to unimplemented steps. */
export function EntranceProgress() {
  return <ol className="entrance-progress" aria-label="制瓷旅程，当前第一步入坊">
    {workshopSteps.slice(0, 3).map((step, index) => <li key={step.id} aria-current={index === 0 ? 'step' : undefined}>
      <span className="progress-number">{String(index + 1).padStart(2, '0')}</span>
      <span>{step.label}</span>
    </li>)}
    <li className="progress-more" aria-label="后续制瓷步骤">…</li>
  </ol>
}
