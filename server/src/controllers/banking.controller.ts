import { Request, Response } from 'express';
import { MusoniService } from '../services/musoni.service';

const musoniService = new MusoniService();

export class BankingController {
  static async searchClients(req: Request, res: Response) {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "query" is required'
        });
      }

      const clients = await musoniService.searchClients(query);
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

      return res.status(200).json({
        success: true,
        data: result
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
      const { loanId } = req.body;

      if (!id || !loanId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: transaction id (in url) and loanId (in body)'
        });
      }

      const result = await musoniService.reverseTransaction(Number(loanId), Number(id));

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
