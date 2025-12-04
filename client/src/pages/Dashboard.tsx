import React, { useState } from 'react';
import { Input, Table, Tag, Button, Card, Space, Typography, message, Modal, List, Skeleton } from 'antd';
import { SearchOutlined, UserOutlined, BankOutlined, RightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const { Title, Text } = Typography;

interface SearchResult {
  entityType: 'CLIENT' | 'LOAN';
  id: number;
  displayname: string;
  accountNo: string;
  externalId?: string;
  status: {
    value: string;
    code: string;
  };
  mobileNo?: string;
  officeName?: string;
  loanProductName?: string;
}

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<SearchResult | null>(null);
  const [clientLoans, setClientLoans] = useState<any[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // We need a separate state to trigger the query only on Enter/Search click
  const [activeQuery, setActiveQuery] = useState('');

  const { data: searchResults, isLoading: loadingSearch, isError: isQueryError } = useQuery({
    queryKey: ['search', activeQuery],
    queryFn: async () => {
      const response = await api.get(`/clients?query=${activeQuery}`);
      return response.data.data;
    },
    enabled: !!activeQuery,
  });

  if (isQueryError) {
    message.error('Error al buscar');
  }

  const onSearch = (value: string) => {
    if (!value.trim()) return;
    setActiveQuery(value);
  };

  const handleSelect = async (record: SearchResult) => {
    if (record.entityType === 'LOAN') {
      navigate(`/loan/${record.id}`);
    } else {
      // It's a client, fetch loans and show modal
      setSelectedClient(record);
      setIsModalOpen(true);
      setClientLoans([]);
      setLoadingLoans(true);
      try {
        const res = await api.get(`/clients/${record.id}/loans`);
        setClientLoans(res.data.data || []);
      } catch (e) {
        console.error(e);
        message.error('Error al cargar préstamos del cliente');
      } finally {
        setLoadingLoans(false);
      }
    }
  };

  const handleLoanSelect = (loanId: number) => {
    setIsModalOpen(false);
    navigate(`/loan/${loanId}`);
  };

  const columns = [
    {
      title: 'Tipo',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 100,
      render: (type: string) => (
        type === 'CLIENT' 
          ? <Tag color="blue" icon={<UserOutlined />}>CLIENTE</Tag>
          : <Tag color="orange" icon={<BankOutlined />}>PRÉSTAMO</Tag>
      ),
    },
    {
      title: 'Nombre',
      dataIndex: 'displayname',
      key: 'displayname',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'No. Cuenta / Préstamo',
      dataIndex: 'accountNo',
      key: 'accountNo',
    },
    {
      title: 'Producto / Oficina',
      key: 'info',
      render: (_: any, record: SearchResult) => (
        <Space direction="vertical" size={0}>
          {record.loanProductName && <Text type="secondary" style={{ fontSize: 12 }}>{record.loanProductName}</Text>}
          {record.officeName && <Text type="secondary" style={{ fontSize: 12 }}>{record.officeName}</Text>}
        </Space>
      )
    },
    {
      title: 'Estado',
      dataIndex: ['status', 'value'],
      key: 'status',
      render: (status: string) => {
        const color = status.toLowerCase() === 'active' ? 'green' : 'volcano';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Acción',
      key: 'action',
      render: (_: any, record: SearchResult) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => handleSelect(record)}
        >
          Seleccionar
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>Búsqueda de Clientes y Préstamos</Title>
      
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Input.Search
          placeholder="Buscar por Nombre, Identidad, Cuenta o No. Préstamo"
          allowClear
          enterButton={<Button type="primary" icon={<SearchOutlined />}>Buscar</Button>}
          size="large"
          onSearch={onSearch}
          loading={loadingSearch}
        />
      </Card>

      <Card 
        title="Resultados" 
        bordered={false} 
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={searchResults || []}
          rowKey={(record) => `${record.entityType}-${record.id}`}
          loading={loadingSearch}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No hay datos. Realice una búsqueda.' }}
        />
      </Card>

      <Modal
        title={`Préstamos de ${selectedClient?.displayname || 'Cliente'}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        {loadingLoans ? (
          <Skeleton active />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={clientLoans}
            locale={{ emptyText: 'Este cliente no tiene préstamos activos.' }}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => handleLoanSelect(item.id)}>
                    Seleccionar <RightOutlined />
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<BankOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={<Text strong>{item.loanProductName} - {item.accountNo}</Text>}
                  description={
                    <Space>
                      <Tag color={item.status.value === 'Active' ? 'green' : 'default'}>
                        {item.status.value}
                      </Tag>
                      <Text>Saldo: {item.summary?.principalOutstanding ?? 0} {item.currency?.code}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
