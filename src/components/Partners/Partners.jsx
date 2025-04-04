import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, Form, message } from 'antd';
import { useApi } from '../../hooks/useApi';
import PartnerForm from './PartnerForm';

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const { callApi } = useApi();

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await callApi('/partners');
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      message.error('Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const columns = [
    {
      title: 'Partner ID',
      dataIndex: 'partner_id',
      key: 'partner_id',
    },
    {
      title: 'Partner Name',
      dataIndex: 'partner_name',
      key: 'partner_name',
    },
    {
      title: 'Contact Person',
      dataIndex: 'contact_person',
      key: 'contact_person',
    },
    {
      title: 'Contact Email',
      dataIndex: 'contact_email',
      key: 'contact_email',
    },
    {
      title: 'Specialized',
      dataIndex: 'specialized',
      key: 'specialized',
      render: (specialized) => Array.isArray(specialized) ? specialized.join(', ') : specialized
    },
    {
      title: 'Geographic Coverage',
      dataIndex: 'geographic_coverage',
      key: 'geographic_coverage',
      render: (coverage) => Array.isArray(coverage) ? coverage.join(', ') : coverage
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>Delete</Button>
        </>
      ),
    },
  ];

  const handleAddPartner = () => {
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleFormSubmit = async (values) => {
    try {
      await callApi('/partners', {
        method: 'POST',
        body: JSON.stringify(values)
      });

      await fetchPartners();
      form.resetFields();
      setIsModalVisible(false);
      message.success('Partner created successfully');
    } catch (error) {
      console.error('Error creating partner:', error);
      message.error('Failed to create partner');
    }
  };

  const handleDelete = async (id) => {
    try {
      await callApi(`/partners/${id}`, {
        method: 'DELETE'
      });
      
      await fetchPartners();
      message.success('Partner deleted successfully');
    } catch (error) {
      console.error('Error deleting partner:', error);
      message.error('Failed to delete partner');
    }
  };

  const filteredPartners = partners.filter(partner => 
    partner.partner_name.toLowerCase().includes(searchText.toLowerCase()) ||
    partner.partner_id.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px' 
      }}>
        <h2 style={{ margin: 0 }}>Partner List</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Input.Search
            placeholder="Search partners..."
            style={{ width: 300 }}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            ADD PARTNER
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredPartners}
        rowKey="id"
        bordered
        loading={loading}
        style={{ backgroundColor: 'white' }}
      />

      <Modal
        title="Add New Partner"
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
      >
        <PartnerForm
          form={form}
          onSubmit={handleFormSubmit}
          onCancel={handleModalCancel}
        />
      </Modal>
    </div>
  );
};

export default Partners; 