export const DEFAULT_PROJECT_PHASES = [
  'Intake Received',
  'Research Phase',
  'Website Audit',
  'Google Business Profile Audit',
  'Social Media Audit',
  'Competitor Research',
  'Strategy Report',
  'Delivery Meeting',
  'Final Payment',
]

export const PROJECT_STATUS_OPTIONS = [
  'Intake Received',
  'In Progress',
  'Waiting on Client',
  'Ready for Review',
  'Delivered',
  'Final Payment',
]

/**
 * Browser-safe demo data for the legacy client portal UI.
 *
 * Every value below is fictitious. Never place client, project, payment, or
 * cloud-storage data in this browser-shipped module. Real records belong in
 * an authenticated private system when that work is separately approved.
 */
export const clientPortalClients = [
  {
    id: 'demo-example-studio',
    clientName: 'Avery Example',
    businessName: 'Example Studio',
    contactName: 'Avery Example',
    email: 'avery@example.com',
    phone: '+1 (312) 555-0100',
    websiteUrl: 'https://example.com/',
    projectType: 'Demo website audit',
    socialMediaLinks: ['https://example.com/social'],
    googleBusinessProfileUrl: 'https://example.com/business-profile',
    businessDescription: 'A fictional studio used only to keep the legacy UI renderable.',
    servicesOffered: 'Synthetic example services only.',
    serviceArea: 'Example City',
    topGoals: 'Demonstrate the legacy portal layout.',
    businessGoals: 'Demonstrate the legacy portal layout.',
    marketingChallenges: 'None; this is demo data.',
    idealCustomer: 'Example customer',
    customerQuestions: 'This is a fictional question.',
    competitors: 'Not applicable',
    currentMarketingActivities: 'None; demo data only.',
    fileUploadNote: 'Demo only. No cloud storage is connected.',
    projectStatus: 'In Progress',
    depositPaid: false,
    depositPaidAmount: 0,
    balanceDue: 0,
    totalProjectValue: 0,
    finalPaymentStatus: 'Demo only',
    startDate: '2030-01-15',
    estimatedDeliveryDate: '2030-02-15',
    currentPhase: 'Research Phase',
    nextSteps: ['Review the synthetic demo layout.'],
    deliverables: [
      { id: 'demo-intake', label: 'Demo intake', completed: true, status: 'Complete' },
      { id: 'demo-audit', label: 'Demo audit', completed: false, status: 'Not Started' },
    ],
    googleDriveFolderUrl: '',
    reportLinks: [],
    adminNotes: ['Synthetic browser-safe example; not a customer record.'],
    communicationLog: [
      {
        date: '2030-01-16',
        type: 'Demo',
        summary: 'Synthetic entry for the legacy portal layout.',
        nextStep: 'No action required.',
        followUpDate: '2030-01-17',
        status: 'Complete',
      },
    ],
  },
]
