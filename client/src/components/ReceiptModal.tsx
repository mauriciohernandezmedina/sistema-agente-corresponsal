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

  // Extract details from response or use defaults
  // The backend response structure for transaction usually contains resourceId and changes
  const transactionId = data.resourceId;
  const amount = data.changes?.transactionAmount || 0;
  const date = new Date().toLocaleString();

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
      <div id="receipt-content" style={{ padding: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}>SISTEMA CORRESPONSAL</Title>
          <Text type="secondary">Comprobante de Pago</Text>
        </div>

        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Fecha">{date}</Descriptions.Item>
          <Descriptions.Item label="Transacción #">{transactionId}</Descriptions.Item>
          <Descriptions.Item label="Cliente">{clientName || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Préstamo">{loanAccountNo || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Monto Pagado">
            <Text strong>{Number(amount).toLocaleString('es-HN', { style: 'currency', currency: 'HNL' })}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider dashed />

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
