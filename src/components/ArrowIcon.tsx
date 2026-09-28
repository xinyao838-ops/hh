export function ArrowIcon({ back = false }: { back?: boolean }) {
  return <svg width="23" height="16" viewBox="0 0 23 16" fill="none" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d="M1 8h20M15 2l6 6-6 6" stroke="currentColor" strokeWidth="1.3" /></svg>
}
