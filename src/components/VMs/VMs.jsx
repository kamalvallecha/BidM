import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, Form, Select, message } from 'antd';
import './VMs.css';

const { Option } = Select;

const VMs = () => {
    const [vms, setVMs] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    useEffect(() => {
        fetchVMs();
    }, []);

    const fetchVMs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vms');
            const data = await response.json();
            setVMs(data);
        } catch (error) {
            console.error('Error fetching VMs:', error);
            message.error('Failed to fetch VMs');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const response = await fetch('http://localhost:5000/api/vms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values)
            });

            if (!response.ok) {
                throw new Error('Failed to create VM');
            }

            await fetchVMs();
            setIsModalVisible(false);
            form.resetFields();
            message.success('VM created successfully');
        } catch (error) {
            console.error('Error creating VM:', error);
            message.error('Failed to create VM');
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/vms/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete VM');
            }

            await fetchVMs();
            message.success('VM deleted successfully');
        } catch (error) {
            console.error('Error deleting VM:', error);
            message.error('Failed to delete VM');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: '5%',
        },
        {
            title: 'VM ID',
            dataIndex: 'vm_id',
            key: 'vm_id',
            width: '10%',
        },
        {
            title: 'VM Name',
            dataIndex: 'vm_name',
            key: 'vm_name',
            width: '20%',
        },
        {
            title: 'Contact Person',
            dataIndex: 'contact_person',
            key: 'contact_person',
            width: '20%',
        },
        {
            title: 'Reporting Manager',
            dataIndex: 'reporting_manager',
            key: 'reporting_manager',
            width: '20%',
        },
        {
            title: 'Team',
            dataIndex: 'team',
            key: 'team',
            width: '15%',
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

    const filteredVMs = vms.filter(vm => 
        vm.vm_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        vm.vm_id?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '16px' 
            }}>
                <h2 style={{ margin: 0 }}>VM List</h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Input.Search
                        placeholder="Search VMs..."
                        style={{ width: 300 }}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button type="primary" onClick={() => setIsModalVisible(true)}>
                        ADD VM
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={filteredVMs}
                rowKey="id"
                bordered
                style={{ backgroundColor: 'white' }}
            />

            <Modal
                title="Add New VM"
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
                    <Form.Item
                        name="vm_id"
                        label="VM ID"
                        rules={[{ required: true, message: 'Please enter VM ID' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="vm_name"
                        label="VM Name"
                        rules={[{ required: true, message: 'Please enter VM name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="contact_person"
                        label="Contact Person"
                        rules={[{ required: true, message: 'Please enter contact person' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="reporting_manager"
                        label="Reporting Manager"
                        rules={[{ required: true, message: 'Please enter reporting manager' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="team"
                        label="Team"
                        rules={[{ required: true, message: 'Please select team' }]}
                    >
                        <Select>
                            <Option value="sales">Sales</Option>
                            <Option value="marketing">Marketing</Option>
                            <Option value="engineering">Engineering</Option>
                        </Select>
                    </Form.Item>

                    <div style={{ textAlign: 'right' }}>
                        <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            Add VM
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default VMs; 