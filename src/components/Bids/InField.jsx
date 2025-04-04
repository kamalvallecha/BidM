import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  TextField,
  Stack,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import './Bids.css';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

function InField() {
  const navigate = useNavigate();
  const { callApi } = useApi();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.permissions?.can_edit_infield;

  useEffect(() => {
    fetchInFieldBids();
  }, []);

  const fetchInFieldBids = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await callApi('/bids/infield');
      setBids(data);
    } catch (error) {
      console.error('Error fetching infield bids:', error);
      setError('Failed to fetch infield bids');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bidId) => {
    navigate(`/bids/field-allocation/${bidId}`);
  };

  const handleMoveToClosure = async (bidNumber) => {
    try {
      console.log("Moving bid to closure:", bidNumber);
      const response = await callApi(`/bids/${bidNumber}/move-to-closure`, {
        method: 'POST'
      });
      
      if (response.message) {
        alert('Bid moved to closure successfully');
        fetchInFieldBids();
      }
    } catch (error) {
      console.error('Error moving bid to closure:', error);
      if (error.status === 404) {
        alert('Bid not found. Please refresh the page and try again.');
      } else {
        alert('Error moving bid to closure. Please try again.');
      }
    }
  };

  const filteredBids = bids.filter(bid =>
    Object.values(bid).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bids-container">
      <div className="bids-header">
        <Typography variant="h5">InField Bids</Typography>
        <TextField
          size="small"
          placeholder="Search bids..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow className="table-header">
              <TableCell>PO Number</TableCell>
              <TableCell>Bid Number</TableCell>
              <TableCell>Study Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell>Sales Contact</TableCell>
              <TableCell>VM Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBids.map((bid) => (
              <TableRow key={bid.id}>
                <TableCell>{bid.po_number}</TableCell>
                <TableCell>{bid.bid_number}</TableCell>
                <TableCell>{bid.study_name}</TableCell>
                <TableCell>{bid.client_name}</TableCell>
                <TableCell>{bid.methodology}</TableCell>
                <TableCell>{bid.sales_contact}</TableCell>
                <TableCell>{bid.vm_contact}</TableCell>
                <TableCell>{bid.status}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {canEdit && (
                      <IconButton
                        onClick={() => handleEdit(bid.id)}
                        color="primary"
                        size="small"
                        title="Edit Bid"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    <Tooltip title="Move to Closure">
                      <IconButton
                        onClick={() => handleMoveToClosure(bid.bid_number)}
                        color="secondary"
                        size="small"
                      >
                        <KeyboardReturnIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

export default InField; 