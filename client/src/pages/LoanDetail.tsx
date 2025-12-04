import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Row, Col, Card, Statistic, Button, InputNumber, 
  Input, Form, message, Spin, Typography, Divider, Tag, Descriptions, Table, Popconfirm 
} from 'antd';
import { ArrowLeftOutlined, DollarOutlined, CalendarOutlined, WarningOutlined, HistoryOutlined, UndoOutlined, PrinterOutlined } from '@ant-design/icons';
import api from '../api/axios';
import ReceiptModal from '../components/ReceiptModal';

const { Title, Text } = Typography;

const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Fetch Loan Details
  const { data: loan, isLoading, isError } = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => {
      const response = await api.get(`/loans/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Mutation for Repayment
  const repaymentMutation = useMutation({
    mutationFn: async (values: { amount: number; note?: string; receiptNumber?: string }) => {
      const response = await api.post(`/loans/${id}/transactions`, {
        transactionDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        transactionAmount: values.amount,
        note: values.note || 'Pago en Corresponsal',
        receiptNumber: values.receiptNumber
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      message.success('Pago procesado correctamente');
      setLastTransaction(data);
      setReceiptVisible(true);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
    },
    onError: (error: any) => {
      console.error(error);
      message.error(error.response?.data?.message || 'Error al procesar el pago');
    },
  });

  // Mutation for Reversal
  const reverseMutation = useMutation({
    mutationFn: async (params: { transactionId: number, amount: number }) => {
      const response = await api.post(`/transactions/${params.transactionId}/reverse`, {
        loanId: Number(id),
        amount: params.amount
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Transacción anulada correctamente');
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
    },
    onError: (error: any) => {
      console.error(error);
      message.error(error.response?.data?.message || 'Error al anular la transacción');
    },
  });

  const onFinish = (values: any) => {
    repaymentMutation.mutate({ 
      amount: values.amount, 
      note: values.note,
      receiptNumber: values.receiptNumber 
    });
  };

  const handleCloseReceipt = () => {
    setReceiptVisible(false);
    setLastTransaction(null);
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  if (isError || !loan) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Title level={4} type="danger">Error al cargar el préstamo</Title>
        <Button onClick={() => navigate('/dashboard')}>Volver</Button>
      </div>
    );
  }

  const totalOutstanding = loan.summary?.totalOutstanding || 0;
  const totalOverdue = loan.summary?.totalOverdue || 0;
  const currencyCode = loan.currency?.code || 'HNL';
  
  // Find next due date (simplified logic)
  // In a real scenario, iterate through repaymentSchedule.periods to find the first non-complete period
  let nextDueDate = 'N/A';
  if (loan.repaymentSchedule?.periods) {
    const nextPeriod = loan.repaymentSchedule.periods.find((p: any) => !p.complete);
    if (nextPeriod && nextPeriod.dueDate) {
      // dueDate is array [yyyy, mm, dd]
      const d = nextPeriod.dueDate;
      nextDueDate = new Date(d[0], d[1] - 1, d[2]).toLocaleDateString();
    }
  }

  const transactionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (date: number[]) => new Date(date[0], date[1] - 1, date[2]).toLocaleDateString(),
    },
    {
      title: 'Tipo',
      dataIndex: ['type', 'value'],
      key: 'type',
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong>{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currencyCode}</Text>
      ),
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_: any, record: any) => (
        record.manuallyReversed ? <Tag color="red">Reversado</Tag> : <Tag color="green">Aplicado</Tag>
      ),
    },
    {
      title: 'Acción',
      key: 'action',
      render: (_: any, record: any) => {
        // Allow reversal only if it's a repayment and not already reversed
        const isReversible = record.type.repayment && !record.manuallyReversed;
        
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              size="small" 
              icon={<PrinterOutlined />} 
              onClick={() => {
                setLastTransaction(record);
                setReceiptVisible(true);
              }}
              title="Reimprimir Recibo"
            />
            
            {isReversible && (
              <Popconfirm
                title="¿Anular transacción?"
                description="Esta acción revertirá el pago y actualizará el saldo."
                onConfirm={() => reverseMutation.mutate({ transactionId: record.id, amount: record.amount })}
                okText="Sí, Anular"
                cancelText="Cancelar"
              >
                <Button size="small" danger icon={<UndoOutlined />} title="Anular Transacción" />
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/dashboard')} 
        style={{ marginBottom: 16 }}
      >
        Volver al Dashboard
      </Button>

      <Row gutter={[16, 16]}>
        {/* Left Column: Loan Info */}
        <Col xs={24} md={14} lg={16}>
          <Card title={`Préstamo: ${loan.accountNo}`} bordered={false}>
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>{loan.clientName}</Title>
              <Tag color="blue">{loan.loanProductName}</Tag>
              <Tag color={loan.status.active ? 'green' : 'default'}>{loan.status.value}</Tag>
            </div>

            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="Saldo Total" 
                  value={totalOutstanding} 
                  precision={2} 
                  prefix={currencyCode}
                  valueStyle={{ color: '#003eb3' }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Monto en Mora" 
                  value={totalOverdue} 
                  precision={2} 
                  prefix={currencyCode}
                  valueStyle={{ color: totalOverdue > 0 ? '#cf1322' : '#3f8600' }}
                  suffix={totalOverdue > 0 ? <WarningOutlined /> : null}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Próximo Vencimiento" 
                  value={nextDueDate} 
                  prefix={<CalendarOutlined />}
                  valueStyle={{ fontSize: '18px' }}
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Descriptions title="Detalles Adicionales" size="small" column={2}>
              <Descriptions.Item label="Principal Original">
                {loan.principal?.toLocaleString()} {currencyCode}
              </Descriptions.Item>
              <Descriptions.Item label="Oficial de Crédito">
                {loan.loanOfficerName || 'No asignado'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Right Column: Payment Form */}
        <Col xs={24} md={10} lg={8}>
          <Card 
            title={<span><DollarOutlined /> Registrar Pago</span>} 
            bordered={false}
            style={{ height: '100%', borderTop: '4px solid #003eb3' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{ amount: totalOverdue > 0 ? totalOverdue : 0 }}
            >
              <Form.Item
                label="Monto a Pagar"
                name="amount"
                rules={[
                  { required: true, message: 'Ingrese el monto' },
                  { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0' },
                  { 
                    type: 'number', 
                    max: totalOutstanding, 
                    message: 'El monto no puede exceder el saldo total' 
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  prefix={currencyCode}
                  precision={2}
                  step={0.01}
                />
              </Form.Item>

              <Form.Item
                label="No. Recibo"
                name="receiptNumber"
                rules={[{ required: true, message: 'Ingrese el número de recibo' }]}
              >
                <Input placeholder="REC-XXXXXX" />
              </Form.Item>

              <Form.Item label="Nota / Referencia" name="note">
                <Input placeholder="Opcional: Nota adicional" />
              </Form.Item>

              <Divider />

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  size="large"
                  loading={repaymentMutation.isPending}
                  disabled={totalOutstanding <= 0}
                >
                  Procesar Pago
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card 
        title={<span><HistoryOutlined /> Historial de Transacciones</span>} 
        bordered={false}
        style={{ marginTop: 24 }}
      >
        <Table 
          dataSource={loan.transactions || []} 
          columns={transactionColumns} 
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
          locale={{ emptyText: 'No hay transacciones registradas' }}
        />
      </Card>

      <ReceiptModal 
        visible={receiptVisible} 
        onClose={handleCloseReceipt} 
        data={lastTransaction}
        loanAccountNo={loan.accountNo}
        clientName={loan.clientName}
      />
    </div>
  );
};

export default LoanDetail;
