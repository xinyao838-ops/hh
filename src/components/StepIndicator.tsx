import { workshopSteps } from '../config/brand'

export function StepIndicator({ active }: { active: 'entrance' | 'clay' }) {
  return (
    <ol className="step-indicator" aria-label="制瓷旅程">
      {workshopSteps.map((step) => (
        <li key={step.id} aria-current={step.id === active ? 'step' : undefined}>
          <span className="step-point" aria-hidden="true" />
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
