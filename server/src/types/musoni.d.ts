/**
 * Musoni API Type Definitions
 * Generated based on references/openapi.json and PROMPT_MAESTRO.md
 */

export interface ClientResponseModel {
  id: number;
  officeId?: number;
  officeName?: string;
  accountNo?: string;
  externalId?: string;
  status: {
    id: number;
    code: string;
    value: string;
  };
  subStatus?: {
    active: boolean;
    isDefault: boolean;
  };
  active: boolean;
  activationDate?: number[];
  firstname?: string;
  lastname?: string;
  displayname?: string; // Note: OpenAPI uses lowercase 'displayname'
  mobileNo?: string; // Inferred from prompt requirements, might be in clientNonPersonDetails or extra fields
  gender?: {
    active: boolean;
    isDefault: boolean;
  };
  clientType?: {
    active: boolean;
    isDefault: boolean;
  };
  clientClassification?: {
    active: boolean;
    isDefault: boolean;
  };
}

export interface LoanResponseModel {
  id: number;
  accountNo: string;
  externalId?: string;
  status: {
    id: number;
    code: string;
    value: string;
    active?: boolean;
    closed?: boolean;
  };
  clientId: number;
  clientAccountNo?: string;
  clientName?: string;
  clientOfficeId?: number;
  loanProductId?: number;
  loanProductName?: string;
  loanProductDescription?: string;
  loanOfficerId?: number;
  loanOfficerName?: string;
  currency?: {
    code: string;
    name: string;
    decimalPlaces: number;
    displaySymbol: string;
    nameCode: string;
  };
  principal?: number;
  approvedPrincipal?: number;
  proposedPrincipal?: number;
  termFrequency?: number;
  numberOfRepayments?: number;
  repaymentEvery?: number;
  inArrears?: boolean;
  
  // Fields populated when associations=summary,repaymentSchedule,transactions
  summary?: {
    currency?: {
      code: string;
      name: string;
      decimalPlaces: number;
      displaySymbol: string;
      nameCode: string;
    };
    principalDisbursed?: number;
    principalPaid?: number;
    principalWrittenOff?: number;
    principalOutstanding?: number;
    principalOverdue?: number;
    interestCharged?: number;
    interestPaid?: number;
    interestWaived?: number;
    interestWrittenOff?: number;
    interestOutstanding?: number;
    interestOverdue?: number;
    feeChargesCharged?: number;
    feeChargesDueAtDisbursementCharged?: number;
    feeChargesPaid?: number;
    feeChargesWaived?: number;
    feeChargesWrittenOff?: number;
    feeChargesOutstanding?: number;
    feeChargesOverdue?: number;
    penaltyChargesCharged?: number;
    penaltyChargesPaid?: number;
    penaltyChargesWaived?: number;
    penaltyChargesWrittenOff?: number;
    penaltyChargesOutstanding?: number;
    penaltyChargesOverdue?: number;
    totalExpectedRepayment?: number;
    totalRepayment?: number;
    totalExpectedCostOfLoan?: number;
    totalCostOfLoan?: number;
    totalWaived?: number;
    totalWrittenOff?: number;
    totalOutstanding?: number;
    totalOverdue?: number;
    overdueSinceDate?: number[];
  };
  
  repaymentSchedule?: {
    currency?: {
      code: string;
      name: string;
      decimalPlaces: number;
      displaySymbol: string;
      nameCode: string;
    };
    loanTermInDays?: number;
    totalPrincipalDisbursed?: number;
    totalPrincipalExpected?: number;
    totalPrincipalPaid?: number;
    totalInterestCharged?: number;
    totalFeeChargesCharged?: number;
    totalPenaltyChargesCharged?: number;
    totalWaived?: number;
    totalWrittenOff?: number;
    totalRepaymentExpected?: number;
    totalRepayment?: number;
    totalOutstanding?: number;
    periods: Array<{
      period: number;
      dueDate: number[];
      principalDisbursed?: number;
      principalLoanBalanceOutstanding?: number;
      feeChargesDue?: number;
      feeChargesPaid?: number;
      feeChargesWaived?: number;
      feeChargesWrittenOff?: number;
      feeChargesOutstanding?: number;
      penaltyChargesDue?: number;
      penaltyChargesPaid?: number;
      penaltyChargesWaived?: number;
      penaltyChargesWrittenOff?: number;
      penaltyChargesOutstanding?: number;
      totalOriginalDueForPeriod?: number;
      totalDueForPeriod?: number;
      totalPaidForPeriod?: number;
      totalPaidInAdvanceForPeriod?: number;
      totalLateForPeriod?: number;
      totalWaivedForPeriod?: number;
      totalWrittenOffForPeriod?: number;
      totalOutstandingForPeriod?: number;
      totalOverdue?: number;
      totalActualCostOfLoanForPeriod?: number;
      totalInstallmentAmountForPeriod?: number;
      complete?: boolean;
      daysInPeriod?: number;
      principalDue?: number;
      principalPaid?: number;
      principalWrittenOff?: number;
      principalOutstanding?: number;
      interestDue?: number;
      interestPaid?: number;
      interestWaived?: number;
      interestWrittenOff?: number;
      interestOutstanding?: number;
    }>;
  };
  
  transactions?: Array<{
    id: number;
    officeId?: number;
    officeName?: string;
    type: {
      id: number;
      code: string;
      value: string;
      disbursement?: boolean;
      repaymentAtDisbursement?: boolean;
      repayment?: boolean;
      contra?: boolean;
      waiveInterest?: boolean;
      waiveCharges?: boolean;
      writeOff?: boolean;
      recoveryRepayment?: boolean;
    };
    date: number[];
    currency?: {
      code: string;
      name: string;
      decimalPlaces: number;
      displaySymbol: string;
      nameCode: string;
    };
    amount: number;
    principalPortion?: number;
    interestPortion?: number;
    feeChargesPortion?: number;
    penaltyChargesPortion?: number;
    overpaymentPortion?: number;
    unrecognizedIncomePortion?: number;
    submittedOnDate?: number[];
    submittedByUsername?: string;
    createdByUsername?: string;
    note?: string;
    manuallyReversed?: boolean;
  }>;
}

export interface PostLoansLoanIdTransactionsRequest {
  transactionDate: string;
  transactionAmount: number;
  dateFormat: string;
  locale: string;
  paymentTypeId?: number;
  receiptNumber?: string;
  note?: string;
  // Additional fields from BasePaymentDetailsProperties
  accountNumber?: string;
  checkNumber?: string;
  routingCode?: string;
  bankNumber?: string;
}

export interface LoanTransactionCommandGenericSuccessResponse {
  officeId: number;
  clientId: number;
  loanId: number;
  resourceId: number; // The transaction ID
  changes?: {
    [key: string]: any;
  };
}
