import { Navigate, useParams } from 'react-router-dom'

export default function LegacyWorkspaceRedirect({ to }) {
  const params = useParams()
  const destination = to.replace(/:([A-Za-z0-9_]+)/g, (_, key) => params[key] || '')
  return <Navigate to={destination} replace />
}
