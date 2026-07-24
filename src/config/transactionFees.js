/**
 * Transaction fee configuration — backend backup plan.
 *
 * Revenue model is controlled by REVENUE_MODEL env var:
 *   'transaction'  (default) — charge a % fee per sale
 *   'membership'             — memberships-only; no per-transaction fee
 *
 * Fee tiers are indexed by membership plan_type slug. A user with no
 * active membership is treated as 'none'.
 *
 * All rates are percentages (e.g. 5 = 5%).
 * Switching between models requires no app release — only env var change.
 *
 * TODO (spring 2027): Confirm final rates and model with client before
 * activating memberships. Consider linking fee tier to membership tier.
 */

const REVENUE_MODEL = process.env.REVENUE_MODEL || 'transaction';

const TRANSACTION_FEE_TIERS = {
  none:    { rate: 5.0, label: 'Standard (5%)' },   // No membership / Starter
  starter: { rate: 5.0, label: 'Starter (5%)' },
  plus:    { rate: 3.5, label: 'Plus (3.5%)' },      // Orange tier
  gold:    { rate: 2.0, label: 'Gold/Pro (2%)' },    // Pro / Gold tier
};

/**
 * Returns the applicable transaction fee rate (%) for a user.
 * @param {string|null} membershipPlanType - the user's active membership slug or null
 * @returns {number} fee percentage (0 if membership-only model)
 */
function getTransactionFeeRate(membershipPlanType) {
  if (REVENUE_MODEL === 'membership') return 0;
  const tier = TRANSACTION_FEE_TIERS[membershipPlanType] || TRANSACTION_FEE_TIERS.none;
  return tier.rate;
}

/**
 * Calculates the fee amount for a given sale price.
 * @param {number} salePrice
 * @param {string|null} membershipPlanType
 * @returns {{ feeRate: number, feeAmount: number, netAmount: number }}
 */
function calculateTransactionFee(salePrice, membershipPlanType) {
  const feeRate = getTransactionFeeRate(membershipPlanType);
  const feeAmount = parseFloat(((salePrice * feeRate) / 100).toFixed(2));
  const netAmount = parseFloat((salePrice - feeAmount).toFixed(2));
  return { feeRate, feeAmount, netAmount };
}

module.exports = {
  REVENUE_MODEL,
  TRANSACTION_FEE_TIERS,
  getTransactionFeeRate,
  calculateTransactionFee,
};
