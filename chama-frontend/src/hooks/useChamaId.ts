import { useParams } from 'react-router-dom'
import { useChamaStore } from '../store/chamaStore'

/**
 * Hook to get chamaId from route params and verify it matches active chama
 */
export function useChamaId() {
  const { chamaId } = useParams<{ chamaId: string }>()
  const { activeChamaId } = useChamaStore()

  if (!chamaId) {
    throw new Error('chamaId is required in route params')
  }

  if (activeChamaId !== chamaId) {
    console.warn(`Route chamaId (${chamaId}) does not match active chama (${activeChamaId})`)
  }

  return chamaId
}
