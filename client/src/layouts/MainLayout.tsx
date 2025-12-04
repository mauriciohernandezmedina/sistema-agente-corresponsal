import React from 'react';
import { Layout, Typography, Space, Avatar, theme } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();

  // Mock user or retrieve from storage
  const username = localStorage.getItem('username') || 'Agente';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 48,
          padding: '0 24px',
          background: '#001529', // Dark color
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text strong style={{ color: '#fff', fontSize: '16px', margin: 0 }}>
            Sistema de Corresponsalía
          </Text>
        </div>
        <Space size="middle">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <Text style={{ color: '#fff' }}>{username}</Text>
          </Space>
          <LogoutOutlined 
            style={{ color: '#fff', cursor: 'pointer' }} 
            onClick={handleLogout}
            title="Cerrar Sesión"
          />
        </Space>
      </Header>
      <Content
        style={{
          padding: '24px',
          backgroundColor: '#f0f2f5',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            background: colorBgContainer,
            minHeight: 280,
            padding: 24,
            borderRadius: borderRadiusLG,
            height: '100%',
          }}
        >
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};

export default MainLayout;
