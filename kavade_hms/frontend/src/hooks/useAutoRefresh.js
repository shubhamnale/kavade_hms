import { useEffect, useRef } from 'react'

export default function useAutoRefresh(callback, intervalMs = 5000) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    savedCallback.current()
    const id = setInterval(() => savedCallback.current(), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
