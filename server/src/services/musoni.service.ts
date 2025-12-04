import musoniApi from '../adapters/musoniClient';
import {
  ClientResponseModel,
  LoanResponseModel,
  LoanTransactionCommandGenericSuccessResponse,
  PostLoansLoanIdTransactionsRequest
} from '../types/musoni';

export class MusoniService {
  
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    // Format: dd MMMM yyyy (e.g., 03 December 2025)
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private async mockDelay<T>(data: T, ms: number = 800): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms));
  }

  async getClientDetails(clientId: number): Promise<ClientResponseModel> {
    if (process.env.USE_MOCK_API === 'true') {
      return this.mockDelay({
        id: clientId,
        firstname: 'Mock',
        lastname: 'Client',
        displayname: 'Mock Client ' + clientId,
        active: true,
        status: { id: 300, code: 'active', value: 'Active' },
        accountNo: 'MOCK-' + clientId
      });
    }
    try {
      const response = await musoniApi.get<ClientResponseModel>(`/clients/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting client details for ${clientId}:`, error);
      throw error;
    }
  }

  async getClientLoans(clientId: number): Promise<LoanResponseModel[]> {
    if (process.env.USE_MOCK_API === 'true') {
      return this.mockDelay([
        {
          id: 101,
          accountNo: 'LOAN-001',
          status: { id: 300, code: 'active', value: 'Active' },
          clientId: clientId,
          loanProductName: 'Personal Loan',
          principal: 1000
        },
        {
          id: 102,
          accountNo: 'LOAN-002',
          status: { id: 300, code: 'active', value: 'Active' },
          clientId: clientId,
          loanProductName: 'Business Loan',
          principal: 5000
        }
      ]);
    }
    try {
      const response = await musoniApi.get<any>(`/clients/${clientId}/accounts`);
      return response.data.loanAccounts || [];
    } catch (error) {
      console.error(`Error getting loans for client ${clientId}:`, error);
      return [];
    }
  }

  async searchClients(query: string): Promise<any[]> {
    if (process.env.USE_MOCK_API === 'true') {
      const mockClients = [
        {
          entityType: 'CLIENT',
          id: 1,
          displayname: 'Juan Perez',
          accountNo: '000000001',
          status: { value: 'Active' }
        },
        {
          entityType: 'LOAN',
          id: 101,
          accountNo: 'LOAN-001',
          clientId: 1,
          displayname: 'Juan Perez',
          loanProductName: 'Personal Loan',
          status: { value: 'Active' }
        }
      ];
      return this.mockDelay(mockClients);
    }

    try {
      // Parallel search: Clients (by name/id/externalId) AND Loans (by accountNo)
      const [clientsResponse, loansResponse] = await Promise.all([
        musoniApi.get<any>('/clients', { params: { search: query } }),
        musoniApi.get<any>('/loans', { params: { search: query } })
      ]);

      const results: any[] = [];

      // Process Clients Response
      let clientsData: any[] = [];
      if (clientsResponse.data.pageItems) {
        clientsData = clientsResponse.data.pageItems;
      } else if (Array.isArray(clientsResponse.data)) {
        clientsData = clientsResponse.data;
      }

      clientsData.forEach(client => {
        results.push({
          entityType: 'CLIENT',
          id: client.id,
          displayname: client.displayname || client.displayName,
          accountNo: client.accountNo,
          status: client.status,
          externalId: client.externalId
        });
      });

      // Process Loans Response
      const loansData = loansResponse.data.pageItems || (Array.isArray(loansResponse.data) ? loansResponse.data : []);
      
      loansData.forEach((loan: any) => {
        results.push({
          entityType: 'LOAN',
          id: loan.id,
          accountNo: loan.accountNo,
          clientId: loan.clientId,
          displayname: loan.clientName,
          loanProductName: loan.loanProductName,
          status: loan.status,
          externalId: loan.externalId
        });
      });

      return results;
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  }

  async getLoanDetails(loanId: number): Promise<LoanResponseModel> {
    if (process.env.USE_MOCK_API === 'true') {
      const mockLoan: LoanResponseModel = {
        id: loanId,
        accountNo: 'LOAN-001',
        status: { id: 300, code: 'active', value: 'Active', active: true },
        clientId: 1,
        clientName: 'Juan Perez',
        loanProductId: 1,
        loanProductName: 'Personal Loan',
        currency: {
          code: 'USD',
          name: 'US Dollar',
          decimalPlaces: 2,
          displaySymbol: '$',
          nameCode: 'USD'
        },
        principal: 1000,
        approvedPrincipal: 1000,
        summary: {
          totalExpectedRepayment: 1100,
          totalRepayment: 500,
          totalOutstanding: 600,
          totalOverdue: 0
        },
        transactions: [
          {
            id: 101,
            type: { id: 1, code: 'disbursement', value: 'Disbursement' },
            date: [2023, 1, 1],
            amount: 1000
          },
          {
            id: 102,
            type: { id: 2, code: 'repayment', value: 'Repayment' },
            date: [2023, 2, 1],
            amount: 500
          }
        ]
      };
      return this.mockDelay(mockLoan);
    }

    try {
      const response = await musoniApi.get<LoanResponseModel>(`/loans/${loanId}`, {
        params: { associations: 'all' }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting loan details for ${loanId}:`, error);
      throw error;
    }
  }

  async processRepayment(loanId: number, payload: { transactionDate: string; transactionAmount: number; note?: string; receiptNumber?: string }): Promise<LoanTransactionCommandGenericSuccessResponse> {
    const formattedDate = this.formatDate(payload.transactionDate);
    const paymentTypeId = parseInt(process.env.PAYMENT_TYPE_ID || '10', 10);
    
    const apiPayload: PostLoansLoanIdTransactionsRequest = {
      ...payload,
      transactionDate: formattedDate,
      locale: 'en',
      dateFormat: 'dd MMMM yyyy',
      paymentTypeId: paymentTypeId,
      receiptNumber: payload.receiptNumber || `REC-${Date.now()}`
    };

    if (process.env.USE_MOCK_API === 'true') {
      const mockResponse: LoanTransactionCommandGenericSuccessResponse = {
        officeId: 1,
        clientId: 1,
        loanId: loanId,
        resourceId: Math.floor(Math.random() * 10000),
        changes: {
          status: 'approved',
          transactionAmount: payload.transactionAmount
        }
      };
      return this.mockDelay(mockResponse);
    }

    try {
      const response = await musoniApi.post<LoanTransactionCommandGenericSuccessResponse>(
        `/loans/${loanId}/transactions?command=repayment`,
        apiPayload
      );
      return response.data;
    } catch (error) {
      console.error(`Error processing repayment for loan ${loanId}:`, error);
      throw error;
    }
  }

  async reverseTransaction(loanId: number, trxId: number, amount: number): Promise<any> {
    if (process.env.USE_MOCK_API === 'true') {
      return this.mockDelay({ status: 'success', resourceId: trxId });
    }

    try {
      // Standard Fineract/Mifos reversal endpoint
      // Some versions require a note or transactionDate/dateFormat/locale even for undo
      // The error log indicated transactionAmount is mandatory.
      const payload = {
        transactionDate: this.formatDate(new Date().toISOString()),
        dateFormat: 'dd MMMM yyyy',
        locale: 'en',
        note: 'Reversal via Agent',
        transactionAmount: 0
      };
      
      const response = await musoniApi.post(`/loans/${loanId}/transactions/${trxId}?command=undo`, payload);
      return response.data;
    } catch (error: any) {
      console.error(`Error reversing transaction ${trxId} for loan ${loanId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getTransaction(loanId: number, transactionId: number): Promise<any> {
    if (process.env.USE_MOCK_API === 'true') {
      return this.mockDelay({
        id: transactionId,
        type: { value: 'Repayment' },
        date: [2023, 1, 1],
        amount: 100,
        principalPortion: 80,
        interestPortion: 20,
        feeChargesPortion: 0,
        penaltyChargesPortion: 0,
        currency: { code: 'HNL' }
      });
    }

    try {
      const response = await musoniApi.get(`/loans/${loanId}/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting transaction ${transactionId} for loan ${loanId}:`, error);
      return { id: transactionId };
    }
  }
}
