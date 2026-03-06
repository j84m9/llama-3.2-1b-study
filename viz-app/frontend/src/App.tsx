import { useEffect } from 'react'
import { useInferenceStore } from './store/inferenceStore'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  const fetchModelInfo = useInferenceStore((s) => s.fetchModelInfo)

  useEffect(() => {
    fetchModelInfo()
  }, [fetchModelInfo])

  return <AppShell />
}
