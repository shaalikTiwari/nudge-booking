const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS) || 14;

function getTrialEndDate(createdAt) {
  const end = new Date(createdAt);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

function isTrialActive(createdAt) {
  return new Date() < getTrialEndDate(createdAt);
}

function daysLeftInTrial(createdAt) {
  const diff = getTrialEndDate(createdAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

module.exports = { getTrialEndDate, isTrialActive, daysLeftInTrial };