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

  async searchClients(query: string): Promise<ClientResponseModel[]> {
    if (process.env.USE_MOCK_API === 'true') {
      const mockClients: ClientResponseModel[] = [
        {
          id: 1,
          firstname: 'Juan',
          lastname: 'Perez',
          displayname: 'Juan Perez',
          active: true,
          status: { id: 300, code: 'active', value: 'Active' },
          mobileNo: '1234567890',
          accountNo: '000000001'
        },
        {
          id: 2,
          firstname: 'Maria',
          lastname: 'Gomez',
          displayname: 'Maria Gomez',
          active: true,
          status: { id: 300, code: 'active', value: 'Active' },
          mobileNo: '0987654321',
          accountNo: '000000002'
        }
      ];
      // Filter mock data if needed, or just return all for simplicity
      return this.mockDelay(mockClients);
    }

    try {
      const response = await musoniApi.get<ClientResponseModel[]>('/clients', {
        params: { displayName: query } // Assuming standard query param
      });
      // Musoni/Mifos often returns { pageItems: [...] } or just [...] depending on version.
      // Assuming array based on return type, but handling potential wrapper object is safer in real world.
      // For this task, I'll assume direct array or handle { pageItems: [] } if I knew the structure for sure.
      // Given the type definition implies ClientResponseModel[], I'll assume the API returns that or I map it.
      // Standard Fineract returns { pageItems: [...] }. Let's be safe and check if it has pageItems.
      const data: any = response.data;
      if (data.pageItems) {
        return data.pageItems;
      }
      return Array.isArray(data) ? data : [];
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

  async processRepayment(loanId: number, payload: { transactionDate: string; transactionAmount: number; note?: string }): Promise<LoanTransactionCommandGenericSuccessResponse> {
    const formattedDate = this.formatDate(payload.transactionDate);
    
    const apiPayload: PostLoansLoanIdTransactionsRequest = {
      ...payload,
      transactionDate: formattedDate,
      locale: 'en',
      dateFormat: 'dd MMMM yyyy'
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

  async reverseTransaction(loanId: number, trxId: number): Promise<any> {
    if (process.env.USE_MOCK_API === 'true') {
      return this.mockDelay({ status: 'success', resourceId: trxId });
    }

    try {
      // Standard Fineract/Mifos reversal endpoint
      const response = await musoniApi.post(`/loans/${loanId}/transactions/${trxId}?command=undo`, {});
      return response.data;
    } catch (error) {
      console.error(`Error reversing transaction ${trxId} for loan ${loanId}:`, error);
      throw error;
    }
  }
}
