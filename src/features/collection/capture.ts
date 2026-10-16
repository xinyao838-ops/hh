/** Snapshot the live renderer before yielding: navigation/rotation may follow. */
export async function captureForCard<T>(capture: () => T, fontsReady: PromiseLike<unknown>, timeoutMs = 1500): Promise<T> {
  const snapshot = capture()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      Promise.resolve(fontsReady).catch(() => undefined),
      new Promise<void>(resolve => { timer = setTimeout(resolve, timeoutMs) }),
    ])
    return snapshot
  } finally { clearTimeout(timer) }
}
