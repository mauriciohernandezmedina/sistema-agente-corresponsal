import React from 'react';
import { Modal, Button, Typography, Divider, Descriptions } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  data: any; // Transaction response data
  loanAccountNo?: string;
  clientName?: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ visible, onClose, data, loanAccountNo, clientName }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!data) return null;

  // Extract details from response
  // data now contains the full transaction details merged with the command response
  const transactionId = data.resourceId || data.id;
  const amount = data.amount || data.changes?.transactionAmount || 0;
  const currencyCode = data.currency?.code || 'HNL';
  
  // Use server date if available (array [yyyy, mm, dd]), else current date
  let dateStr = new Date().toLocaleString();
  if (data.date && Array.isArray(data.date)) {
    dateStr = new Date(data.date[0], data.date[1] - 1, data.date[2]).toLocaleDateString();
  }

  // Breakdown
  const breakdown = [
    { label: 'Principal', value: data.principalPortion },
    { label: 'Interés', value: data.interestPortion },
    { label: 'Cargos', value: data.feeChargesPortion },
    { label: 'Mora', value: data.penaltyChargesPortion },
  ].filter(item => item.value > 0);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Imprimir Recibo
        </Button>,
      ]}
      width={400}
      centered
      className="receipt-modal"
    >
      <div id="receipt-content" style={{ padding: '10px', fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}>SISTEMA CORRESPONSAL</Title>
          <Text>Comprobante de Pago</Text>
        </div>

        <Descriptions column={1} size="small" bordered layout="horizontal">
          <Descriptions.Item label="Fecha">{dateStr}</Descriptions.Item>
          <Descriptions.Item label="Transacción #">{transactionId}</Descriptions.Item>
          {data.receiptNumber && <Descriptions.Item label="Recibo #">{data.receiptNumber}</Descriptions.Item>}
          <Descriptions.Item label="Cliente">{clientName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Préstamo">{loanAccountNo || 'N/A'}</Descriptions.Item>
        </Descriptions>

        <Divider dashed style={{ margin: '12px 0' }} />
        
        <div style={{ marginBottom: 12 }}>
          <Text strong>Desglose de Pago:</Text>
          <table style={{ width: '100%', fontSize: '14px', marginTop: '5px' }}>
            <tbody>
              {breakdown.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '2px 0' }}>{item.label}</td>
                  <td style={{ textAlign: 'right', padding: '2px 0' }}>
                    {Number(item.value).toLocaleString('es-HN', { minimumFractionDigits: 2 })} {currencyCode}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px dashed #ccc', fontWeight: 'bold' }}>
                <td style={{ paddingTop: '8px' }}>TOTAL PAGADO</td>
                <td style={{ textAlign: 'right', paddingTop: '8px' }}>
                  {Number(amount).toLocaleString('es-HN', { style: 'currency', currency: currencyCode })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <Divider dashed style={{ margin: '12px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '12px' }}>Gracias por su pago.</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>Este documento es un comprobante válido.</Text>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
