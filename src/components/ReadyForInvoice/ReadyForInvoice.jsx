import React, { useState, useEffect } from 'react';
import { Table, message } from 'antd';
import { useApi } from '../../hooks/useApi';
import './ReadyForInvoice.css';

const ReadyForInvoice = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const { callApi } = useApi();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await callApi('/ready-for-invoice');
            setData(result);
        } catch (error) {
            console.error('Error fetching ready for invoice data:', error);
            message.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Partner',
            dataIndex: 'audience_Partner',
            key: 'audience_Partner',
        },
        {
            title: 'LOI',
            dataIndex: 'loi',
            key: 'loi',
        },
        {
            title: 'Country',
            dataIndex: 'country',
            key: 'country',
        },
        {
            title: 'Commitment',
            dataIndex: 'commitment',
            key: 'commitment',
        },
        {
            title: 'CPI',
            dataIndex: 'cpi',
            key: 'cpi',
        },
        {
            title: 'Timeline (Days)',
            dataIndex: 'timeline_d',
            key: 'timeline_d',
        },
        {
            title: 'Comments',
            dataIndex: 'comments',
            key: 'comments',
        },
        {
            title: 'Allocation',
            dataIndex: 'allocation',
            key: 'allocation',
        },
        {
            title: 'Delivered',
            dataIndex: 'n_delivered',
            key: 'n_delivered',
        }
    ];

    // Custom render for the table to handle the message display
    const renderExpandedRow = (record) => {
        if (record.message) {
            return {
                colSpan: columns.length,
                children: (
                    <div style={{ padding: '16px', color: '#ff4d4f', textAlign: 'center' }}>
                        {record.message}
                    </div>
                )
            };
        }
        return record;
    };

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ marginBottom: '16px' }}>Ready for Invoice</h2>
            <Table
                columns={columns}
                dataSource={data}
                loading={loading}
                rowKey={(record) => `${record.partner_id}_${record.loi}_${record.country}`}
                bordered
                onRow={(record) => ({
                    style: record.message ? { background: '#fafafa' } : {}
                })}
                components={{
                    body: {
                        cell: (props) => {
                            if (props.record.message) {
                                return renderExpandedRow(props.record)[props.index];
                            }
                            return <td {...props} />;
                        }
                    }
                }}
            />
        </div>
    );
};

export default ReadyForInvoice; 