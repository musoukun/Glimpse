import { useState, useEffect } from 'react'

const OPACITY_STORAGE_KEY = 'app-opacity'
const DEFAULT_OPACITY = 1.0

export const useOpacity = () => {
  const [opacity, setOpacityState] = useState(DEFAULT_OPACITY)

  // 初期化時にローカルストレージから透明度を読み込み
  useEffect(() => {
    try {
      const savedOpacity = localStorage.getItem(OPACITY_STORAGE_KEY)
      if (savedOpacity) {
        const parsedOpacity = parseFloat(savedOpacity)
        if (!isNaN(parsedOpacity) && parsedOpacity >= 0.3 && parsedOpacity <= 1.0) {
          setOpacityState(parsedOpacity)
          updateCSSOpacity(parsedOpacity)
        }
      }
    } catch (error) {
      console.warn('透明度の読み込みに失敗しました:', error)
    }
  }, [])

  // 透明度を設定する関数
  const setOpacity = (newOpacity: number) => {
    const clampedOpacity = Math.max(0.3, Math.min(1.0, newOpacity))
    setOpacityState(clampedOpacity)
    updateCSSOpacity(clampedOpacity)
    
    try {
      localStorage.setItem(OPACITY_STORAGE_KEY, clampedOpacity.toString())
    } catch (error) {
      console.warn('透明度の保存に失敗しました:', error)
    }
  }

  // CSS変数を更新してアプリの透明度を変更
  const updateCSSOpacity = (opacity: number) => {
    document.documentElement.style.setProperty('--app-opacity', opacity.toString())
  }

  return {
    opacity,
    setOpacity,
  }
} 