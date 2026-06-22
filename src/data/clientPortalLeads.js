export const LEAD_STATUS_OPTIONS = [
  'New',
  'Researching',
  'Ready to Contact',
  'Contacted',
  'Follow-Up',
  'Qualified',
  'Won',
  'Lost',
  'Do Not Contact',
]

export const LEAD_OUTREACH_TYPES = {
  intro: {
    label: 'Send intro',
    activityLabel: 'Intro email',
  },
  followUp: {
    label: 'Send follow-up',
    activityLabel: 'Follow-up email',
  },
}

export const clientPortalLeads = [
  {
    id: 'lead-lakeview-dental',
    businessName: 'Lakeview Dental Studio',
    contactName: 'Practice Manager',
    email: 'hello@example-dental.com',
    phone: '(312) 555-0141',
    websiteUrl: 'https://example-dental.com',
    googleBusinessProfileUrl: '',
    source: 'Local search',
    status: 'Ready to Contact',
    fitScore: 82,
    lastContacted: '',
    nextFollowUpDate: '2026-06-24',
    notes: 'Good fit for website refresh and Google Business Profile improvements.',
    doNotContact: false,
    activity: [
      {
        id: 'lead-lakeview-dental-note-1',
        date: '2026-06-19',
        type: 'Research',
        summary: 'Website appears dated and mobile hierarchy could be clearer.',
      },
    ],
  },
  {
    id: 'lead-northshore-wellness',
    businessName: 'Northshore Wellness Clinic',
    contactName: 'Owner',
    email: 'info@example-wellness.com',
    phone: '(847) 555-0188',
    websiteUrl: 'https://example-wellness.com',
    googleBusinessProfileUrl: '',
    source: 'Referral list',
    status: 'Researching',
    fitScore: 74,
    lastContacted: '',
    nextFollowUpDate: '',
    notes: 'Potential fit for strategy audit and local SEO cleanup.',
    doNotContact: false,
    activity: [],
  },
]
