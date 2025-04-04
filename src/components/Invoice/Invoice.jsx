import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import { Edit, ArrowBack, KeyboardReturn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

function Invoice() {
  const [bids, setBids] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { callApi } = useApi();

  useEffect(() => {
    fetchReadyForInvoiceBids();
  }, []);

  const fetchReadyForInvoiceBids = async () => {
    try {
      setLoading(true);
      const data = await callApi('/bids/ready-for-invoice');
      setBids(data);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bidId) => {
    navigate(`/invoice/edit/${bidId}`);
  };

  const handleMoveToClosureClick = async (bidId) => {
    try {
      const response = await callApi(`/bids/${bidId}/move-to-closure`, {
        method: 'PUT'
      });
      
      if (response.message) {
        alert('Bid moved to closure successfully');
        fetchReadyForInvoiceBids();
      }
    } catch (error) {
      console.error('Error moving bid to closure:', error);
      alert('Error moving bid to closure. Please try again.');
    }
  };

  return (
    <div className="invoice-container">
      <h2>Ready for Invoice Bids</h2>
      <TextField
        label="Search bids..."
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#7c4dff' }}>
              <TableCell sx={{ color: 'white' }}>PO Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Bid Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Study Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Client</TableCell>
              <TableCell sx={{ color: 'white' }}>N-Delivered</TableCell>
              <TableCell sx={{ color: 'white' }}>Avg. Final LOI</TableCell>
              <TableCell sx={{ color: 'white' }}>Avg. Initial Vendor CPI</TableCell>
              <TableCell sx={{ color: 'white' }}>Avg. Final Vendor CPI</TableCell>
              <TableCell sx={{ color: 'white' }}>Invoice Amount</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bids.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.po_number}</TableCell>
                <TableCell>{row.bid_number}</TableCell>
                <TableCell>{row.study_name}</TableCell>
                <TableCell>{row.client}</TableCell>
                <TableCell>{row.n_delivered}</TableCell>
                <TableCell>{row.avg_final_loi}</TableCell>
                <TableCell>{row.avg_initial_vendor_cpi}</TableCell>
                <TableCell>{row.avg_final_vendor_cpi}</TableCell>
                <TableCell>{row.invoice_amount}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit">
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(row.id)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {row.status === 'ready_for_invoice' && (
                      <Tooltip title="Move to Closure">
                        <IconButton
                          color="secondary"
                          onClick={() => handleMoveToClosureClick(row.id)}
                          size="small"
                        >
                          <KeyboardReturn fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default Invoice; 