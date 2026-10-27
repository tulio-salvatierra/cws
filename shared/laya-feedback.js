export const REASON_CATEGORIES = {
  right_next_step: 'Right next step',
  not_now: 'Not the right time',
  different_priority: 'Something else comes first',
  missing_information: 'Missing information',
  incorrect_information: 'Incorrect information',
  already_done: 'Already done',
  not_relevant: 'Not relevant',
  other: 'Other',
}

export function optionalFeedbackPayload(category, alternative) {
  return {
    ...(category ? { reason_category: category } : {}),
    ...(alternative?.trim() ? { alternative_action: alternative } : {}),
  }
}
