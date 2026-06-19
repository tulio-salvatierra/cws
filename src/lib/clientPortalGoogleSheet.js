export const CLIENT_PORTAL_GOOGLE_SHEET = {
  id: '1reR9DB9xsPir8WOs9pVD1HThyJ9bmHN_qwcZQ8ICJxY',
  gid: '0',
  label: 'Cicero Web Studio client tracker',
  url: 'https://docs.google.com/spreadsheets/d/1reR9DB9xsPir8WOs9pVD1HThyJ9bmHN_qwcZQ8ICJxY/edit?gid=0#gid=0',
}

export const CLIENT_PORTAL_SHEET_SCHEMA = {
  dashboard: {
    name: 'Dashboard',
  },
  clientOverview: {
    name: 'Client Overview',
    matchColumn: 'Client Name',
    headers: [
      'Client Name',
      'Business Name',
      'Contact Name',
      'Email',
      'Phone',
      'Website URL',
      'Project Type',
      'Project Status',
      'Start Date',
      'Estimated Delivery Date',
      'Deposit Paid',
      'Balance Due',
      'Total Project Fee',
      'Final Payment Status',
      'Notes',
    ],
  },
  assets: {
    name: 'Assets & Links',
    matchColumn: 'Client Name',
    headers: ['Client Name', 'Asset Type', 'Received?', 'Link', 'Notes'],
  },
  intake: {
    name: 'Intake Responses',
    matchColumn: 'Client Name',
    headers: [
      'Client Name',
      'Business Description',
      'Services Offered',
      'Service Area',
      'Top 3 Goals',
      'Marketing Challenges',
      'Ideal Customer',
      'Customer Questions',
      'Competitors',
      'Current Marketing Activities',
      'Notes',
    ],
  },
  deliverables: {
    name: 'Deliverables',
    matchColumn: 'Client Name',
    headers: ['Client Name', 'Deliverable', 'Status', 'Due Date', 'Completed Date', 'Link', 'Notes'],
  },
  payments: {
    name: 'Payments',
    matchColumn: 'Client Name',
    headers: [
      'Client Name',
      'Invoice/Receipt #',
      'Total Fee',
      'Deposit Paid',
      'Balance Due',
      'Payment Date',
      'Payment Method',
      'Payment Status',
      'Notes',
    ],
  },
  communicationLog: {
    name: 'Client Communication Log',
    matchColumn: 'Client Name',
    headers: [
      'Client Name',
      'Date',
      'Communication Type',
      'Summary',
      'Next Step',
      'Follow-Up Date',
      'Status',
    ],
  },
}

const intakeWebhookUrl = import.meta.env.VITE_CLIENT_PORTAL_INTAKE_WEBHOOK_URL || ''
const updateWebhookUrl = import.meta.env.VITE_CLIENT_PORTAL_UPDATE_WEBHOOK_URL || intakeWebhookUrl

export function mapClientRecordToSheetPayload(clientRecord) {
  return {
    clientOverview: buildClientOverviewRow(clientRecord),
    intakeResponses: buildIntakeResponsesRow(clientRecord),
    assetsAndLinks: buildAssetRows(clientRecord),
    deliverables: buildDeliverableRows(clientRecord),
    payments: buildPaymentRow(clientRecord),
    communicationLog: buildCommunicationRows(clientRecord),
  }
}

export function buildClientPortalSheetOperations(clientRecord) {
  return [
    {
      action: 'upsertRow',
      sheetName: CLIENT_PORTAL_SHEET_SCHEMA.clientOverview.name,
      matchColumn: CLIENT_PORTAL_SHEET_SCHEMA.clientOverview.matchColumn,
      row: buildClientOverviewRow(clientRecord),
    },
    {
      action: 'upsertRow',
      sheetName: CLIENT_PORTAL_SHEET_SCHEMA.intake.name,
      matchColumn: CLIENT_PORTAL_SHEET_SCHEMA.intake.matchColumn,
      row: buildIntakeResponsesRow(clientRecord),
    },
    {
      action: 'replaceClientRows',
      sheetName: CLIENT_PORTAL_SHEET_SCHEMA.assets.name,
      matchColumn: CLIENT_PORTAL_SHEET_SCHEMA.assets.matchColumn,
      rows: buildAssetRows(clientRecord),
    },
    {
      action: 'replaceClientRows',
      sheetName: CLIENT_PORTAL_SHEET_SCHEMA.deliverables.name,
      matchColumn: CLIENT_PORTAL_SHEET_SCHEMA.deliverables.matchColumn,
      rows: buildDeliverableRows(clientRecord),
    },
    {
      action: 'upsertRow',
      sheetName: CLIENT_PORTAL_SHEET_SCHEMA.payments.name,
      matchColumn: CLIENT_PORTAL_SHEET_SCHEMA.payments.matchColumn,
      row: buildPaymentRow(clientRecord),
    },
    ...buildCommunicationRows(clientRecord).map((row) => ({
      action: 'appendRow',
      sheetName: CLIENT_PORTAL_SHEET_SCHEMA.communicationLog.name,
      row,
    })),
  ]
}

export async function syncIntakeToGoogleSheet(clientRecord) {
  return postToGoogleSheetWebhook({
    webhookUrl: intakeWebhookUrl,
    eventName: 'client_intake.created',
    clientRecord,
  })
}

export async function syncClientUpdateToGoogleSheet(clientRecord, changes) {
  return postToGoogleSheetWebhook({
    webhookUrl: updateWebhookUrl,
    eventName: 'client_project.updated',
    clientRecord: { ...clientRecord, ...changes },
    changes,
  })
}

function buildClientOverviewRow(clientRecord) {
  return {
    'Client Name': clientRecord.clientName || '',
    'Business Name': clientRecord.businessName || '',
    'Contact Name': clientRecord.contactName || clientRecord.clientName || '',
    Email: clientRecord.email || '',
    Phone: clientRecord.phone || '',
    'Website URL': clientRecord.websiteUrl || '',
    'Project Type': clientRecord.projectType || '',
    'Project Status': clientRecord.projectStatus || 'Intake Received',
    'Start Date': clientRecord.startDate || '',
    'Estimated Delivery Date': clientRecord.estimatedDeliveryDate || '',
    'Deposit Paid': clientRecord.depositPaidAmount ?? (clientRecord.depositPaid ? 'Yes' : 'No'),
    'Balance Due': clientRecord.balanceDue ?? '',
    'Total Project Fee': clientRecord.totalProjectValue ?? '',
    'Final Payment Status': clientRecord.finalPaymentStatus || '',
    Notes: clientRecord.adminNotes?.join(' | ') || clientRecord.notes || '',
  }
}

function buildIntakeResponsesRow(clientRecord) {
  return {
    'Client Name': clientRecord.clientName || '',
    'Business Description': clientRecord.businessDescription || '',
    'Services Offered': clientRecord.servicesOffered || '',
    'Service Area': clientRecord.serviceArea || '',
    'Top 3 Goals': clientRecord.topGoals || clientRecord.businessGoals || '',
    'Marketing Challenges': clientRecord.marketingChallenges || '',
    'Ideal Customer': clientRecord.idealCustomer || clientRecord.targetCustomers || '',
    'Customer Questions': clientRecord.customerQuestions || '',
    Competitors: clientRecord.competitors || '',
    'Current Marketing Activities': clientRecord.currentMarketingActivities || '',
    Notes: clientRecord.notes || '',
  }
}

function buildAssetRows(clientRecord) {
  const rows = []

  if (clientRecord.websiteUrl) {
    rows.push(buildAssetRow(clientRecord, 'Website', clientRecord.websiteUrl))
  }

  for (const link of normalizeLinks(clientRecord.socialMediaLinks)) {
    rows.push(buildAssetRow(clientRecord, getSocialAssetType(link), link))
  }

  if (clientRecord.googleBusinessProfileUrl) {
    rows.push(buildAssetRow(clientRecord, 'GoogleMyBusiness Profile', clientRecord.googleBusinessProfileUrl))
  }

  if (clientRecord.googleDriveFolderUrl) {
    rows.push(buildAssetRow(clientRecord, 'Google Drive Folder', clientRecord.googleDriveFolderUrl))
  }

  return rows
}

function buildAssetRow(clientRecord, assetType, link) {
  return {
    'Client Name': getSheetClientName(clientRecord),
    'Asset Type': assetType,
    'Received?': link ? 'Yes' : 'No',
    Link: link || '',
    Notes: '',
  }
}

function buildDeliverableRows(clientRecord) {
  const deliverables = clientRecord.deliverables?.length
    ? clientRecord.deliverables
    : [
        { label: 'Intake Form', status: 'Not Started' },
        { label: 'Website Audit', status: 'Not Started' },
        { label: 'Google Business Profile Audit', status: 'Not Started' },
        { label: 'Social Media Audit', status: 'Not Started' },
        { label: 'Competitor Research', status: 'Not Started' },
        { label: 'Current State Summary', status: 'Not Started' },
        { label: 'Final Strategy Report', status: 'Not Started' },
        { label: 'Delivery Meeting', status: 'Not Started' },
        { label: 'Final Payment', status: 'Not Started' },
      ]

  return deliverables.map((deliverable) => ({
    'Client Name': getSheetClientName(clientRecord),
    Deliverable: deliverable.label,
    Status: deliverable.status || (deliverable.completed ? 'Complete' : 'Not Started'),
    'Due Date': deliverable.dueDate || '',
    'Completed Date': deliverable.completedDate || '',
    Link: deliverable.link || '',
    Notes: deliverable.notes || '',
  }))
}

function buildPaymentRow(clientRecord) {
  return {
    'Client Name': getSheetClientName(clientRecord),
    'Invoice/Receipt #': clientRecord.invoiceNumber || '',
    'Total Fee': clientRecord.totalProjectValue ?? '',
    'Deposit Paid': clientRecord.depositPaidAmount ?? (clientRecord.depositPaid ? 'Yes' : 'No'),
    'Balance Due': clientRecord.balanceDue ?? '',
    'Payment Date': clientRecord.paymentDate || clientRecord.startDate || '',
    'Payment Method': clientRecord.paymentMethod || '',
    'Payment Status': clientRecord.paymentStatus || (clientRecord.balanceDue > 0 ? 'Partial' : 'Paid'),
    Notes: clientRecord.paymentNotes || '',
  }
}

function buildCommunicationRows(clientRecord) {
  return (clientRecord.communicationLog || []).map((entry) => ({
    'Client Name': getSheetClientName(clientRecord),
    Date: entry.date || '',
    'Communication Type': entry.type || '',
    Summary: entry.summary || '',
    'Next Step': entry.nextStep || '',
    'Follow-Up Date': entry.followUpDate || '',
    Status: entry.status || '',
  }))
}

function getSheetClientName(clientRecord) {
  return clientRecord.businessName || clientRecord.clientName || ''
}

function normalizeLinks(links) {
  if (!links) return []
  if (Array.isArray(links)) return links.filter(Boolean)

  return String(links)
    .split(/[\n,]+/)
    .map((link) => link.trim())
    .filter(Boolean)
}

function getSocialAssetType(link) {
  const normalized = link.toLowerCase()

  if (normalized.includes('facebook')) return 'Facebook page'
  if (normalized.includes('instagram') || normalized.startsWith('@')) return 'Instagram'
  if (normalized.includes('tiktok')) return 'TikTok'
  if (normalized.includes('linkedin')) return 'LinkedIn'
  if (normalized.includes('youtube')) return 'YouTube'

  return 'Social Media'
}

async function postToGoogleSheetWebhook({ webhookUrl, eventName, clientRecord, changes = {} }) {
  const payload = {
    event: eventName,
    spreadsheet: CLIENT_PORTAL_GOOGLE_SHEET,
    schema: CLIENT_PORTAL_SHEET_SCHEMA,
    client: mapClientRecordToSheetPayload(clientRecord),
    operations: buildClientPortalSheetOperations(clientRecord),
    changes,
    submittedAt: new Date().toISOString(),
  }

  if (!webhookUrl) {
    return {
      synced: false,
      mode: 'mock',
      reason: 'Add VITE_CLIENT_PORTAL_INTAKE_WEBHOOK_URL or VITE_CLIENT_PORTAL_UPDATE_WEBHOOK_URL to send this payload to the Vercel API route.',
      payload,
    }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Google Sheet webhook failed with status ${response.status}`)
  }

  return {
    synced: true,
    mode: 'webhook',
    payload,
  }
}
