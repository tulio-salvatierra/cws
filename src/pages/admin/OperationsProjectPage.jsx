import { useParams } from 'react-router-dom'
import OperationsPage from './OperationsPage.jsx'

export default function OperationsProjectPage() {
  const { projectId } = useParams()
  return <OperationsPage projectId={projectId} />
}
