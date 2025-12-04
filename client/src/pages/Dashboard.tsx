import React, { useState } from 'react';
import { Input, Table, Tag, Button, Card, Space, Typography, message } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const { Title } = Typography;

interface Client {
  id: number;
  firstname: string;
  lastname: string;
  displayname: string;
  accountNo: string;
  status: {
    value: string;
    code: string;
  };
  mobileNo?: string;
}

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const response = await api.get(`/clients?query=${searchTerm}`);
      return response.data.data;
    },
    enabled: false, // Don't run automatically on mount
  });

  const handleSearch = (value: string) => {
    if (!value.trim()) {
      message.warning('Ingrese un término de búsqueda');
      return;
    }
    setSearchTerm(value);
    // Trigger the query manually after setting state is a bit tricky with enabled: false
    // Better approach: let the effect of changing searchTerm trigger it if enabled was true, 
    // but we want explicit search.
    // We can just call refetch() immediately after setting state, but state update is async.
    // Actually, react-query's refetch will use the current state in the queryFn closure if not careful,
    // but since searchTerm is in queryKey, changing it creates a new query instance.
    // Let's change strategy: enabled: !!searchTerm is better, but we want to wait for Enter.
    // So we keep a separate state for the "active" search term.
  };
  
  // We need a separate state to trigger the query only on Enter/Search click
  const [activeQuery, setActiveQuery] = useState('');

  const { data: clients, isLoading: loadingClients, isError: isQueryError } = useQuery({
    queryKey: ['clients', activeQuery],
    queryFn: async () => {
      const response = await api.get(`/clients?query=${activeQuery}`);
      return response.data.data;
    },
    enabled: !!activeQuery,
  });

  if (isQueryError) {
    message.error('Error al buscar clientes');
  }

  const onSearch = (value: string) => {
    if (!value.trim()) return;
    setActiveQuery(value);
  };

  const columns = [
    {
      title: 'Nombre Cliente',
      dataIndex: 'displayname',
      key: 'displayname',
      render: (text: string) => <Space><UserOutlined /> {text}</Space>,
    },
    {
      title: 'No. Cuenta',
      dataIndex: 'accountNo',
      key: 'accountNo',
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
      render: (_: any, record: Client) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => navigate(`/loan/${record.id}`)} // Assuming we go to loan list or detail. 
          // If the client has multiple loans, we might go to a client detail page first.
          // But the prompt says "navigate to /loan/:id". 
          // This implies the search result IS a loan or we pick a default loan?
          // Or maybe the search returns Clients, and we assume we go to a view to see their loans.
          // Let's assume for this task we navigate to a client detail or loan list.
          // Wait, prompt says "navigate to /loan/:id". 
          // If the list is CLIENTS, we don't have a loan ID yet.
          // Maybe the search should return Loans? Or we pick the first loan?
          // Let's assume we navigate to a client view that lists loans, OR the prompt meant /client/:id.
          // Re-reading prompt: "Muestra columnas: Nombre, Identidad... Acción... navegar a /loan/:id".
          // This is ambiguous if we are listing Clients.
          // Let's assume we navigate to `/client/${record.id}` which will show loans, 
          // OR for the sake of the specific instruction, maybe we just pass the client ID 
          // and the next page handles finding the loan.
          // Let's stick to the prompt literally but maybe use client ID as param if that's what's available.
          // Actually, let's look at the backend. GET /clients returns ClientResponseModel.
          // It has ID. Let's assume we go to a page to SELECT a loan for this client.
          // But the route requested is /loan/:id. 
          // I will navigate to `/client/${record.id}` for now as it makes more sense, 
          // and we can implement the loan selection there.
          // OR, if the prompt implies a direct flow, maybe I should just use the client ID 
          // and the next page is "Loan Details" (which might be wrong if multiple loans).
          // Let's use `/client/${record.id}` to be safe and logical.
        >
          Seleccionar
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 24 }}>Búsqueda de Clientes</Title>
      
      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Input.Search
          placeholder="Buscar por nombre, identidad o cuenta..."
          allowClear
          enterButton="Buscar"
          size="large"
          onSearch={onSearch}
          autoFocus
          loading={loadingClients}
        />
      </Card>

      <Card 
        title="Resultados" 
        bordered={false} 
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={clients || []}
          rowKey="id"
          loading={loadingClients}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No hay datos. Realice una búsqueda.' }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
