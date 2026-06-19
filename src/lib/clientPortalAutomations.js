import {
  syncClientUpdateToGoogleSheet,
  syncIntakeToGoogleSheet,
} from './clientPortalGoogleSheet'

export async function runNewIntakeAutomation(intakePayload) {
  // Future integration point:
  // Replace these no-op calls with Google Sheets, Google Drive, email, Zapier,
  // n8n, Supabase, or PostgreSQL actions when the portal becomes live.
  const clientRecord = await createClientRecord(intakePayload)

  await Promise.all([
    createGoogleDriveFolder(clientRecord),
    addRowToGoogleSheet(clientRecord),
    sendConfirmationEmail(clientRecord),
    notifyAdminWhenClientSubmitsForm(clientRecord),
  ])

  return clientRecord
}

export async function createClientRecord(intakePayload) {
  // Future: save to Supabase/PostgreSQL or post to a Zapier/n8n webhook.
  return {
    id: `pending-${Date.now()}`,
    ...intakePayload,
    projectStatus: 'Intake Received',
    currentPhase: 'Intake Received',
  }
}

export async function createGoogleDriveFolder(clientRecord) {
  // Future: call the Google Drive API and store the folder URL on the client record.
  return { clientId: clientRecord.id, folderUrl: null }
}

export async function addRowToGoogleSheet(clientRecord) {
  return safelyRunSheetSync(() => syncIntakeToGoogleSheet(clientRecord))
}

export async function sendConfirmationEmail(clientRecord) {
  // Future: send the client a branded confirmation email after intake submission.
  return { clientId: clientRecord.id, sent: false }
}

export async function sendProjectStatusUpdate(clientRecord, nextStatus) {
  await sendClientPortalUpdate(clientRecord, { projectStatus: nextStatus })
  // Future: notify the client when the project phase or status changes.
  return { clientId: clientRecord.id, nextStatus, sent: false }
}

export async function sendProjectPhaseUpdate(clientRecord, nextPhase) {
  await sendClientPortalUpdate(clientRecord, { currentPhase: nextPhase })
  return { clientId: clientRecord.id, nextPhase, sent: false }
}

export async function sendClientPortalUpdate(clientRecord, changes = {}) {
  const nextRecord = { ...clientRecord, ...changes }
  return safelyRunSheetSync(() => syncClientUpdateToGoogleSheet(nextRecord, changes))
}

export async function notifyAdminWhenClientSubmitsForm(clientRecord) {
  // Future: notify Cicero Web Studio by email, Slack, or an n8n workflow.
  return { clientId: clientRecord.id, notified: false }
}

export async function notifyClientWhenReportIsReady(clientRecord, reportUrl) {
  await sendClientPortalUpdate(clientRecord, {
    reportLinks: [{ label: 'Strategy report', url: reportUrl }],
  })
  // Future: trigger when the final report link is added or marked ready.
  return { clientId: clientRecord.id, reportUrl, sent: false }
}

async function safelyRunSheetSync(runSync) {
  try {
    return await runSync()
  } catch (error) {
    return {
      synced: false,
      mode: 'webhook',
      error: error instanceof Error ? error.message : 'Google Sheet sync failed',
    }
  }
}
