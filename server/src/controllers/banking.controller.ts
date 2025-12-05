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
          message: 'El parámetro de búsqueda es requerido.'
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
        message: 'Error al buscar clientes. Por favor, intente nuevamente.'
      });
    }
  }

  static async getClientLoans(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      if (!clientId) {
        return res.status(400).json({ success: false, message: 'El ID del cliente es requerido.' });
      }
      const loans = await musoniService.getClientLoans(Number(clientId));
      return res.status(200).json({ success: true, data: loans });
    } catch (error) {
      console.error('Get client loans error:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener los préstamos del cliente.' });
    }
  }

  static async getLoanDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user; // Usuario autenticado del JWT
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'El ID del préstamo es requerido.'
        });
      }

      const loan = await musoniService.getLoanDetails(Number(id));

      // Filter transactions: Only show transactions from TODAY and made by CURRENT USER
      // This is a requirement for the Correspondent Agent: "Only see what he did during the day"
      if (loan.transactions && Array.isArray(loan.transactions)) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // YYYY-M-D (matches Musoni array parts roughly)
        const currentUsername = user?.username || 'unknown';

        loan.transactions = loan.transactions.filter(trx => {
          if (!trx.date || !Array.isArray(trx.date)) return false;
          
          // Check if transaction is from today
          const trxDateStr = `${trx.date[0]}-${trx.date[1]}-${trx.date[2]}`;
          const isToday = trxDateStr === todayStr;
          
          // Check if transaction was made by current user
          // Look for username in multiple possible fields
          const submittedBy = (trx as any).submittedByUsername || '';
          const createdBy = (trx as any).createdByUsername || '';
          const noteText = (trx as any).note || '';
          
          const isMadeByUser = 
            submittedBy === currentUsername ||
            createdBy === currentUsername ||
            noteText.includes(`[Usuario: ${currentUsername}]`);
          
          return isToday && isMadeByUser;
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
        message: 'Error al obtener los detalles del préstamo.'
      });
    }
  }

  static async makeRepayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { transactionDate, transactionAmount, note, receiptNumber } = req.body;
      const user = (req as any).user; // Usuario autenticado del JWT

      if (!id || !transactionDate || !transactionAmount) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos: ID, fecha o monto.'
        });
      }

      // Agregar username a la nota para identificar quién hizo el pago
      const noteWithUser = note ? `${note} [Usuario: ${user?.username || 'unknown'}]` : `Pago en Corresponsal [Usuario: ${user?.username || 'unknown'}]`;

      const result = await musoniService.processRepayment(Number(id), {
        transactionDate,
        transactionAmount,
        note: noteWithUser,
        receiptNumber
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
        message: 'Error al procesar el pago. Verifique los datos e intente nuevamente.'
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
          message: 'Faltan datos requeridos para la anulación.'
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
        message: 'Error al anular la transacción.'
      });
    }
  }
}
