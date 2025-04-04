import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const InvoiceList = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { callApi } = useApi();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
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
    navigate(`/invoice/${bidId}/edit`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Ready to Invoice Bids</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white' }}>PO Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Bid Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Study Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Client</TableCell>
              <TableCell sx={{ color: 'white' }}>Initial CPI</TableCell>
              <TableCell sx={{ color: 'white' }}>Allocation</TableCell>
              <TableCell sx={{ color: 'white' }}>N Delivered</TableCell>
              <TableCell sx={{ color: 'white' }}>Final LOI</TableCell>
              <TableCell sx={{ color: 'white' }}>Final IR</TableCell>
              <TableCell sx={{ color: 'white' }}>Final CPI</TableCell>
              <TableCell sx={{ color: 'white' }}>Invoice Amount</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bids.map((bid) => (
              <TableRow key={bid.bid_number}>
                <TableCell>{bid.po_number}</TableCell>
                <TableCell>{bid.bid_number}</TableCell>
                <TableCell>{bid.study_name}</TableCell>
                <TableCell>{bid.client_name}</TableCell>
                <TableCell>{bid.avg_initial_cpi}</TableCell>
                <TableCell>{bid.allocation}</TableCell>
                <TableCell>{bid.n_delivered}</TableCell>
                <TableCell>{bid.avg_final_loi}</TableCell>
                <TableCell>{bid.avg_final_ir}</TableCell>
                <TableCell>{bid.avg_final_cpi}</TableCell>
                <TableCell>{bid.invoice_amount}</TableCell>
                <TableCell>{bid.status}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleEdit(bid.bid_number)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InvoiceList; 