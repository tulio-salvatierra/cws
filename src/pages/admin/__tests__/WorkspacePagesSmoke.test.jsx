import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}))

import WorkspacePage from '../WorkspacePage'
import CampaignsPage from '../CampaignsPage'
import CampaignDetailPage from '../CampaignDetailPage'
import NewCampaignPage from '../NewCampaignPage'
import NewVariantPage from '../NewVariantPage'
import VariantDetailPage from '../VariantDetailPage'
import TasksPage from '../TasksPage'
import PlanningPage from '../PlanningPage'
import NewGoalPage from '../NewGoalPage'
import KnowledgePage from '../KnowledgePage'
import AgentRunsPage from '../AgentRunsPage'

const workspaceId = 'workspace-1'
const campaignId = 'campaign-1'
const variantId = 'variant-1'

function listData(table) {
  const data = {
    workspace_members: [{ workspace_id: workspaceId, role: 'owner' }],
    workspaces: [{ id: workspaceId, name: 'Cicero Web Studio', slug: 'cicero-web-studio' }],
    channels: [{ id: 'channel-1', name: 'Cicero Web Studio', slug: 'cicero-web-studio' }],
    campaigns: [{ id: campaignId, code: 'CWS-001', title: 'Cicero Web Studio Intro Advertisement', status: 'editing', description: 'Pilot campaign', channel_id: 'channel-1' }],
    content_variants: [{ id: variantId, code: 'CWS-001-EN-MASTER', locale: 'en', working_title: 'Cicero Web Studio Intro — English Master', status: 'recorded', campaign_id: campaignId }],
    approvals: [],
    tasks: [],
    goals: [],
    initiatives: [],
    projects: [],
    decisions: [],
    learnings: [],
    agent_runs: [],
  }
  return data[table] || []
}

function singleData(table) {
  return {
    workspace_members: { workspace_id: workspaceId, role: 'owner' },
    workspaces: { id: workspaceId, name: 'Cicero Web Studio', slug: 'cicero-web-studio' },
    campaigns: { id: campaignId, code: 'CWS-001', title: 'Cicero Web Studio Intro Advertisement', status: 'editing', description: 'Pilot campaign', channel_id: 'channel-1' },
    content_variants: { id: variantId, code: 'CWS-001-EN-MASTER', locale: 'en', working_title: 'Cicero Web Studio Intro — English Master', status: 'recorded', transcript: '', caption_text: '', campaign_id: campaignId },
  }[table]
}

function createQuery(table) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: singleData(table), error: null })),
    then: (resolve, reject) => Promise.resolve({ data: listData(table), error: null }).then(resolve, reject),
  }
  return chain
}

function renderPage(element, path, route = '*') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={element} />
      </Routes>
    </MemoryRouter>
  )
}

describe('relocated workspace page render smoke tests', () => {
  it('renders WorkspacePage with its primary heading', async () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<WorkspacePage />, '/admin/workspace')
    expect(await screen.findByRole('heading', { name: 'Cicero Web Studio' })).toBeInTheDocument()
  })

  it('renders CampaignsPage with its primary heading', async () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<CampaignsPage />, '/admin/campaigns')
    expect(await screen.findByRole('heading', { name: 'Work in motion' })).toBeInTheDocument()
  })

  it('renders CampaignDetailPage with its primary heading', async () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<CampaignDetailPage />, `/admin/campaigns/${campaignId}`, '/admin/campaigns/:campaignId')
    expect(await screen.findByRole('heading', { name: 'CWS-001' })).toBeInTheDocument()
  })

  it('renders NewCampaignPage with its primary heading', () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<NewCampaignPage />, '/admin/campaigns/new')
    expect(screen.getByRole('heading', { name: 'New campaign' })).toBeInTheDocument()
  })

  it('renders NewVariantPage with its primary heading', () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<NewVariantPage />, `/admin/campaigns/${campaignId}/variants/new`, '/admin/campaigns/:campaignId/variants/new')
    expect(screen.getByRole('heading', { name: 'New content variant' })).toBeInTheDocument()
  })

  it('renders VariantDetailPage with its primary heading', async () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<VariantDetailPage />, `/admin/variants/${variantId}`, '/admin/variants/:variantId')
    expect(await screen.findByRole('heading', { name: 'Cicero Web Studio Intro — English Master' })).toBeInTheDocument()
  })

  it('renders TasksPage with its primary heading', () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<TasksPage />, '/admin/tasks')
    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument()
  })

  it('renders PlanningPage with its primary heading', () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<PlanningPage />, '/admin/planning')
    expect(screen.getByRole('heading', { name: 'Direction and delivery' })).toBeInTheDocument()
  })

  it('renders NewGoalPage with its primary heading', () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<NewGoalPage />, '/admin/planning/new-goal')
    expect(screen.getByRole('heading', { name: 'New goal' })).toBeInTheDocument()
  })

  it('renders KnowledgePage with its primary heading', () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<KnowledgePage />, '/admin/knowledge')
    expect(screen.getByRole('heading', { name: 'Decisions and learnings' })).toBeInTheDocument()
  })

  it('renders AgentRunsPage with its primary heading', () => {
    mockFrom.mockImplementation(createQuery)
    renderPage(<AgentRunsPage />, '/admin/agent-runs')
    expect(screen.getByRole('heading', { name: 'Agent runs' })).toBeInTheDocument()
  })
})
