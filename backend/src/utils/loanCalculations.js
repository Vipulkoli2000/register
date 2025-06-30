/**
 * Loan Interest and Balance Calculation Utilities
 * 
 * This file contains utility functions for calculating loan balances and interest
 * based on received payments, with detailed examples of how the logic works.
 */

/**
 * Calculate and update loan balances based on received payments
 * @param {Object} loan - Current loan state
 * @param {number} loan.balanceAmount - Current principal balance
 * @param {number} loan.balanceInterest - Current accumulated interest
 * @param {number} loan.interest - Interest rate percentage
 * @param {number} receivedAmount - Principal payment received (default: 0)
 * @param {number} receivedInterest - Interest payment received (default: 0)
 * @returns {Object} Updated loan state
 */
const calculateUpdatedLoanBalances = (loan, receivedAmount = 0, receivedInterest = 0) => {
  const currentBalanceAmount = loan.balanceAmount;
  const currentBalanceInterest = loan.balanceInterest;
  const interestRate = loan.interest;
  
  // Calculate interest on balance amount only
  const interestOnBalance = (currentBalanceAmount * interestRate) / 100;
  
  // New interest amount = interest on balance + current balance interest
  const newInterestAmount = interestOnBalance + currentBalanceInterest;
  
  // Add new interest to existing balance interest to get total before payment
  const totalInterestBeforePayment = currentBalanceInterest + newInterestAmount;
  
  // Apply received interest payment
  const remainingBalanceInterest = Math.max(0, totalInterestBeforePayment - receivedInterest);
  
  // Apply received amount payment to principal
  const newBalanceAmount = Math.max(0, currentBalanceAmount - receivedAmount);
  
  return {
    newBalanceAmount,
    newBalanceInterest: remainingBalanceInterest,
    interestAmount: newInterestAmount,
    totalInterestBeforePayment,
    interestOnBalance
  };
};

module.exports = {
  calculateUpdatedLoanBalances
};
