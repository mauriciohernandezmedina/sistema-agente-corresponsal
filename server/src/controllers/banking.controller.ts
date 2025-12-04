import { Request, Response } from 'express';
import { MusoniService } from '../services/musoni.service';

const musoniService = new MusoniService();

export class BankingController {
  static async searchClients(req: Request, res: Response) {
    try {
      const query = req.query.query as string;
      console.log('Searching clients with query:', query);
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "query" is required'
        });
      }

      const clients = await musoniService.searchClients(query);
      console.log(`Found ${clients.length} clients`);
      
      return res.status(200).json({
        success: true,
        data: clients
      });
    } catch (error) {
      console.error('Search clients error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error searching clients'
      });
    }
  }

  static async getLoanDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Loan ID is required'
        });
      }

      const loan = await musoniService.getLoanDetails(Number(id));

      // Filter transactions: Only show transactions from TODAY
      // This is a requirement for the Correspondent Agent: "Only see what he did during the day"
      if (loan.transactions && Array.isArray(loan.transactions)) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // YYYY-M-D (matches Musoni array parts roughly)

        loan.transactions = loan.transactions.filter(trx => {
          if (!trx.date || !Array.isArray(trx.date)) return false;
          // trx.date is [YYYY, MM, DD]
          const trxDateStr = `${trx.date[0]}-${trx.date[1]}-${trx.date[2]}`;
          return trxDateStr === todayStr;
        });
      }

      return res.status(200).json({
        success: true,
        data: loan
      });
    } catch (error) {
      console.error('Get loan detail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching loan details'
      });
    }
  }

  static async makeRepayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { transactionDate, transactionAmount, note } = req.body;

      if (!id || !transactionDate || !transactionAmount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: id, transactionDate, transactionAmount'
        });
      }

      const result = await musoniService.processRepayment(Number(id), {
        transactionDate,
        transactionAmount,
        note
      });

      // Fetch full transaction details for the receipt
      let transactionDetails = result;
      if (result.resourceId) {
        const details = await musoniService.getTransaction(Number(id), result.resourceId);
        transactionDetails = { ...result, ...details };
      }

      return res.status(200).json({
        success: true,
        data: transactionDetails
      });
    } catch (error) {
      console.error('Make repayment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing repayment'
      });
    }
  }

  static async reversePayment(req: Request, res: Response) {
    try {
      const { id } = req.params; // Transaction ID
      const { loanId, amount } = req.body;

      if (!id || !loanId || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: transaction id (in url), loanId and amount (in body)'
        });
      }

      const result = await musoniService.reverseTransaction(Number(loanId), Number(id), Number(amount));

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Reverse payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error reversing payment'
      });
    }
  }
}
