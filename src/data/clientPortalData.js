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

export const clientPortalClients = [
  {
    id: 'cws-cordial-medical-spa',
    clientName: 'Natasha',
    businessName: 'Cordial Medical Spa',
    contactName: 'Natasha',
    email: 'doctor@cordialmedicalspa.com',
    phone: '(847) 401-3601',
    websiteUrl: 'https://cordialmedicalspa.com/',
    projectType: 'Advertisement campaign to get more clients',
    socialMediaLinks: [
      'https://www.facebook.com/share/1ELA2kybD8/?mibextid=wwXIfr',
      '@cordialmedicalspa',
      'https://www.tiktok.com/@cordialmedicalspa?_r=1&_t=ZT-97FQDM3mLtt',
    ],
    googleBusinessProfileUrl: 'https://maps.app.goo.gl/NqouNYedkgBtfYGC8',
    businessDescription:
      'Body sculpting, IPL laser genesis, Aerolase for acne and skin tightening, PRP and PRF for hair loss, and radiofrequency microneedling for body and face.',
    servicesOffered:
      'Emsculpt and Vanquish, radiofrequency microneedling, Aerolase for acne and skin tightening, PRP and PRF for hair loss.',
    serviceArea:
      'Mundelein, Libertyville, Vernon Hills, Buffalo Grove, Arlington Heights, Mount Prospect, Chicago, Lake Zurich, Wheeling',
    topGoals: 'More patients and more exposure through social media',
    businessGoals: 'More patients and more exposure through social media',
    marketingChallenges: 'Exposure through social media',
    idealCustomer: '',
    customerQuestions: 'How many treatments does it usually take?',
    competitors: 'Not sure',
    currentMarketingActivities: 'Instagram and Facebook',
    fileUploadNote: 'Future Google Drive upload handoff for logos, photos, and brand files.',
    projectStatus: 'In Progress',
    depositPaid: true,
    depositPaidAmount: 100,
    balanceDue: 250,
    totalProjectValue: 350,
    finalPaymentStatus: 'Unpaid',
    startDate: '2026-06-12',
    estimatedDeliveryDate: '2026-06-20',
    currentPhase: 'Google Business Profile Audit',
    nextSteps: [
      'Work on social media audit',
      'Finish website audit recommendations',
      'Prepare strategy recommendations for top services',
    ],
    deliverables: [
      { id: 'intake', label: 'Intake Form', completed: true, status: 'Complete' },
      { id: 'website-audit', label: 'Website Audit', completed: true, status: 'Complete' },
      {
        id: 'gbp-audit',
        label: 'Google Business Profile Audit',
        completed: false,
        status: 'In Progress',
      },
      { id: 'social-audit', label: 'Social Media Audit', completed: false, status: 'In Progress' },
      { id: 'competitor-map', label: 'Competitor Research', completed: false, status: 'Not Started' },
      { id: 'current-state', label: 'Current State Summary', completed: false, status: 'Not Started' },
      { id: 'strategy-report', label: 'Final Strategy Report', completed: false, status: 'Not Started' },
      { id: 'delivery-meeting', label: 'Delivery Meeting', completed: false, status: 'Not Started' },
      { id: 'final-payment', label: 'Final Payment', completed: false, status: 'Not Started' },
    ],
    googleDriveFolderUrl: '',
    reportLinks: [],
    adminNotes: [
      'Updated client after questionnaire was sent.',
      'Focus recommendations around social, website, and top medical spa services.',
    ],
    communicationLog: [
      {
        date: '2026-06-17',
        type: 'Text',
        summary: 'Updated on current state after questionnaire being sent.',
        nextStep: 'Work on social and website audits to make recommendations.',
        followUpDate: '2026-06-20',
        status: 'Complete',
      },
    ],
  },
]
