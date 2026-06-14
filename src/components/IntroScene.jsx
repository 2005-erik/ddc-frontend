import { useEffect, useRef } from 'react'
import IntroSceneEngine from '../scenes/introScene.js'

/**
 * React-обёртка над Three.js-движком IntroScene.
 *
 * @param {() => void} [props.onComplete] - вызывается при входе сцены в финальную фазу (4).
 * @param {string} [props.className]
 */
export default function IntroScene({ onComplete, className }) {
  const containerRef = useRef(null)
  // держим актуальный колбэк в ref, чтобы не пересоздавать сцену при смене onComplete
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let engine = null
    try {
      engine = new IntroSceneEngine(container, {
        onPhaseComplete: (phase) => {
          if (phase === 4 && onCompleteRef.current) onCompleteRef.current()
        },
      })
      engine.start()
    } catch (err) {
      // напр. WebGL недоступен — не роняем дерево React, показываем контент без фона
      console.error('IntroScene: не удалось запустить сцену', err)
      if (onCompleteRef.current) onCompleteRef.current()
    }

    // cleanup: полная очистка ресурсов (и при unmount, и при двойном маунте Strict Mode)
    return () => {
      if (engine) engine.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    />
  )
}
