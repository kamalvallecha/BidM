import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Button,
  TextField,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useApi } from '../../hooks/useApi';
import './Bids.css';

function Bids() {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { callApi } = useApi();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const data = await callApi('/bids');
      setBids(data);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bid) => {
    navigate(`/bids/edit/${bid.id}`);
  };

  const handleDelete = async (bidId) => {
    if (window.confirm('Are you sure you want to delete this bid?')) {
      try {
        await callApi(`/bids/${bidId}`, {
          method: 'DELETE'
        });
        fetchBids();
      } catch (error) {
        console.error('Error deleting bid:', error);
      }
    }
  };

  const filteredBids = bids.filter(bid => 
    bid.bid_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bid.study_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bid.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bids-container">
      <div className="bids-header">
        <h2>Bid Management</h2>
        <div className="search-add">
          <TextField
            size="small"
            placeholder="Search bids..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/bids/new')}
          >
            ADD BID
          </Button>
        </div>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bid Number</TableCell>
              <TableCell>Study Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Methodology</TableCell>
              <TableCell>Countries</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredBids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No bids found</TableCell>
              </TableRow>
            ) : (
              filteredBids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>{bid.bid_number}</TableCell>
                  <TableCell>{bid.study_name}</TableCell>
                  <TableCell>{bid.client}</TableCell>
                  <TableCell>{bid.methodology}</TableCell>
                  <TableCell>{Array.isArray(bid.countries) ? bid.countries.join(', ') : bid.countries}</TableCell>
                  <TableCell>{bid.status}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEdit(bid)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(bid.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default Bids; 