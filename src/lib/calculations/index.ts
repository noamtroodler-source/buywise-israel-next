/**
 * Calculation Utilities Index
 * Re-exports all calculation functions for easy importing
 */

// Purchase Tax
export {
  calculatePurchaseTax,
  calculateTaxAmount,
  calculateOlehEligibility,
  getOlehBenefitRemaining,
  calculateUpgraderTimeline,
  compareTaxByBuyerType,
  calculateTaxSavings,
  getTaxBrackets,
  getBuyerTypeLabel,
  determineBuyerType,
  type BuyerType,
  type TaxBracket,
  type PurchaseTaxResult,
} from './purchaseTax';

// Mortgage
export {
  calculateMortgagePayment,
  calculateAmortizationSchedule,
  getMaxLTV,
  calculateMaxLoanByLTV,
  calculateMaxLoanByPTI,
  calculateAffordability,
  calculateMultiTrackMortgage,
  estimateMortgageMix,
  calculatePrepaymentPenalty,
  calculateForeignIncomeDiscount,
  stressTestPayment,
  getCurrentRateRange,
  getTrackTypeLabel,
  type MortgageTrackType,
  type BuyerCategory,
  type MortgageTrack,
  type MortgagePaymentResult,
  type AmortizationEntry,
  type AffordabilityResult,
  type MortgageMixRecommendation,
} from './mortgage';

// Purchase Costs
export {
  calculateTotalPurchaseCosts,
  calculateMonthlyCosts,
  calculateNewConstructionPremium,
  getArnonaRate,
  calculateAnnualArnona,
  getCostsByCategory,
  calculateCashToClose,
  type PurchaseCostOptions,
  type CostItem,
  type TotalPurchaseCostsResult,
  type MonthlyCostsResult,
} from './purchaseCosts';

// Rental Yield
export {
  calculateGrossYield,
  estimateAnnualExpenses,
  calculateNetYield,
  calculateCashOnCash,
  projectROI,
  calculateRentalIncomeTax,
  findOptimalTaxMethod,
  compareToMarketYield,
  getVacancyRate,
  calculateBreakEvenOccupancy,
  type YieldResult,
  type ExpenseBreakdown,
  type ROIProjection,
  type RentalTaxResult,
} from './rentalYield';

// Capital Gains
export {
  calculateInflationAdjustment,
  isPrimaryResidenceExempt,
  calculatePrimaryResidenceExemption,
  calculateUpgraderExemption,
  calculateMasShevach,
  estimateNetProceeds,
  compareTaxBySellerCategory,
  calculateHoldingBenefits,
  getSellerCategoryLabel,
  type CapitalGainsResult,
  type SellerCategory,
} from './capitalGains';
