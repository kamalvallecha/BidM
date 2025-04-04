import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, Form, message } from 'antd';
import { useApi } from '../../hooks/useApi';
import './Clients.css';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { callApi } = useApi();

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const data = await callApi('/clients');
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
            message.error('Failed to fetch clients');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            await callApi('/clients', {
                method: 'POST',
                body: JSON.stringify(values)
            });

            await fetchClients();
            setIsModalVisible(false);
            form.resetFields();
            message.success('Client created successfully');
        } catch (error) {
            console.error('Error creating client:', error);
            message.error('Failed to create client');
        }
    };

    const handleDelete = async (id) => {
        try {
            await callApi(`/clients/${id}`, {
                method: 'DELETE'
            });

            await fetchClients();
            message.success('Client deleted successfully');
        } catch (error) {
            console.error('Error deleting client:', error);
            message.error('Failed to delete client');
        }
    };

    const columns = [
        {
            title: 'Client ID',
            dataIndex: 'client_id',
            key: 'client_id',
            width: '10%',
        },
        {
            title: 'Client Name',
            dataIndex: 'client_name',
            key: 'client_name',
            width: '20%',
        },
        {
            title: 'Contact Person',
            dataIndex: 'contact_person',
            key: 'contact_person',
            width: '15%',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: '20%',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: '15%',
        },
        {
            title: 'Country',
            dataIndex: 'country',
            key: 'country',
            width: '10%',
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '10%',
            render: (_, record) => (
                <span>
                    <Button type="link" style={{ color: '#1890ff', padding: '0 8px' }}>
                        EDIT
                    </Button>
                    <Button 
                        type="link" 
                        style={{ color: '#ff4d4f', padding: '0 8px' }}
                        onClick={() => handleDelete(record.id)}
                    >
                        DELETE
                    </Button>
                </span>
            ),
        },
    ];

    const filteredClients = clients.filter(client => 
        client.client_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        client.client_id?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px' 
            }}>
                <h2 style={{ margin: 0 }}>Client List</h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Input.Search
                        placeholder="Search clients..."
                        style={{ width: 300 }}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button type="primary" onClick={() => setIsModalVisible(true)}>
                        ADD CLIENT
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={filteredClients}
                rowKey="id"
                bordered
                loading={loading}
                style={{ backgroundColor: 'white' }}
            />

            <Modal
                title="Add New Client"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="client_id"
                            label="Client ID"
                            rules={[{ required: true, message: 'Please enter Client ID' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="client_name"
                            label="Client Name"
                            rules={[{ required: true, message: 'Please enter Client Name' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="contact_person"
                            label="Contact Person"
                            rules={[{ required: true, message: 'Please enter Contact Person' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Please enter Email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Phone"
                            rules={[{ required: true, message: 'Please enter Phone' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="country"
                            label="Country"
                            rules={[{ required: true, message: 'Please enter Country' }]}
                        >
                            <Input />
                        </Form.Item>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Add Client
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Clients; 