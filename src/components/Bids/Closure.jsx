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
  Button,
  Typography,
  TextField,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EditIcon from '@mui/icons-material/Edit';
import ReplayIcon from '@mui/icons-material/Replay';
import ReceiptIcon from '@mui/icons-material/Receipt';
import './Bids.css';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

function Closure() {
  const navigate = useNavigate();
  const { callApi } = useApi();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.permissions?.can_edit_closure;
  const [bid, setBid] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedLOI, setSelectedLOI] = useState('');
  const [fieldCloseDates, setFieldCloseDates] = useState({});
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    fetchClosureBids();
  }, []);

  const fetchClosureBids = async () => {
    try {
      setLoading(true);
      console.log('Fetching closure bids...');
      const data = await callApi('/bids/closure');
      console.log('Closure bids response:', data);
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching closure bids:', error);
      setError('Failed to fetch closure bids');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bidId) => {
    navigate(`/closure/edit/${bidId}`);
  };

  const handleApply = () => {
    // Will implement filter functionality later
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchTerm('');
    fetchClosureBids();
  };

  const handleBackToInField = async (bidId) => {
    try {
      await callApi(`/bids/${bidId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'infield'
        })
      });
      fetchClosureBids(); // Refresh the list after status update
    } catch (error) {
      console.error('Error moving bid back to infield:', error);
      alert('Error moving bid back to infield. Please try again.');
    }
  };

  const handleMoveToInvoice = async (bidId) => {
    try {
      await callApi(`/bids/${bidId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'ready_for_invoice'
        })
      });
      
      fetchClosureBids();
    } catch (error) {
      console.error('Error moving bid to ready for invoice:', error);
      alert('Failed to move bid to ready for invoice. Please try again.');
    }
  };

  const fetchBidDetails = async () => {
    try {
      setLoading(true);
      const data = await callApi(`/bids/${bidId}`);
      setBid(data);
      
      // Initialize field close dates and metrics
      const initialFieldCloseDates = {};
      const initialMetrics = {};
      data.target_audiences.forEach(audience => {
        initialFieldCloseDates[audience.id] = '';
        initialMetrics[audience.id] = {
          ir: '',
          drop_rate: '',
          incidence_rate: '',
          loi: ''
        };
      });
      setFieldCloseDates(initialFieldCloseDates);
      setMetrics(initialMetrics);
    } catch (error) {
      console.error('Error fetching bid details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldCloseDateChange = (audienceId, date) => {
    setFieldCloseDates(prev => ({
      ...prev,
      [audienceId]: date
    }));
  };

  const handleMetricChange = (audienceId, metric, value) => {
    setMetrics(prev => ({
      ...prev,
      [audienceId]: {
        ...prev[audienceId],
        [metric]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      await callApi(`/bids/${bidId}/closure`, {
        method: 'PUT',
        body: JSON.stringify({
          partner: selectedPartner,
          loi: selectedLOI,
          audienceData: bid.target_audiences.map(audience => ({
            id: audience.id,
            field_close_date: fieldCloseDates[audience.id],
            metrics: metrics[audience.id],
            countries: audience.countries.map(country => ({
              name: country,
              delivered: 0 // You might want to add input for this
            }))
          }))
        })
      });

      // Update bid status to completed
      await callApi(`/bids/${bidId}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'completed'
        })
      });

      navigate('/infield');
    } catch (error) {
      console.error('Error submitting closure data:', error);
    }
  };

  return (
    <div className="bids-container">
      <Typography variant="h5">Closure Bids</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
        <TextField
          size="small"
          placeholder="Search bids..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 200 }}
        />

        <Typography>Field Close Date Range:</Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => <TextField {...params} size="small" />}
            format="MM/dd/yyyy"
          />
          <Typography>to</Typography>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            renderInput={(params) => <TextField {...params} size="small" />}
            format="MM/dd/yyyy"
          />
        </LocalizationProvider>

        <Button 
          variant="contained" 
          onClick={handleApply}
          sx={{ bgcolor: '#7c4dff' }}
        >
          Apply
        </Button>
        <Button 
          variant="contained"
          onClick={handleReset}
          sx={{ bgcolor: 'grey.500' }}
        >
          Reset
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#7c4dff' }}>
              <TableCell sx={{ color: 'white' }}>PO Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Bid Number</TableCell>
              <TableCell sx={{ color: 'white' }}>Study Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Client</TableCell>
              <TableCell sx={{ color: 'white' }}>Total N-Delivered</TableCell>
              <TableCell sx={{ color: 'white' }}>Quality Rejects</TableCell>
              <TableCell sx={{ color: 'white' }}>Avg LOI (mins)</TableCell>
              <TableCell sx={{ color: 'white' }}>Avg IR (%)</TableCell>
              <TableCell sx={{ color: 'white' }}>Field Close Date</TableCell>
              <TableCell sx={{ color: 'white' }}>Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">Loading...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ color: 'error.main' }}>
                  {error}
                </TableCell>
              </TableRow>
            ) : bids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">No closure bids found</TableCell>
              </TableRow>
            ) : (
              bids.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>{bid.po_number || '-'}</TableCell>
                  <TableCell>{bid.bid_number}</TableCell>
                  <TableCell>{bid.study_name}</TableCell>
                  <TableCell>{bid.client_name}</TableCell>
                  <TableCell>{bid.total_n_delivered || 0}</TableCell>
                  <TableCell>{bid.quality_rejects || 0}</TableCell>
                  <TableCell>{bid.avg_loi || 0}</TableCell>
                  <TableCell>{bid.avg_ir || 0}</TableCell>
                  <TableCell>{bid.field_close_date || '-'}</TableCell>
                  <TableCell>{bid.status}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {canEdit && (
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(bid.id)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip title="Back to InField">
                          <IconButton 
                            onClick={() => {
                              if (window.confirm('Move this bid back to InField status?')) {
                                handleBackToInField(bid.id);
                              }
                            }}
                            color="secondary"
                          >
                            <ReplayIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip title="Move to Ready for Invoice">
                          <IconButton
                            onClick={() => handleMoveToInvoice(bid.id)}
                            size="small"
                            sx={{ color: 'purple' }}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Submit Closure</DialogTitle>
        <DialogContent>
          {bid ? (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Partner</InputLabel>
                <Select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                >
                  {bid.partners.map(partner => (
                    <MenuItem key={partner} value={partner}>
                      {partner}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>LOI</InputLabel>
                <Select
                  value={selectedLOI}
                  onChange={(e) => setSelectedLOI(e.target.value)}
                >
                  {bid.loi.map(loi => (
                    <MenuItem key={loi} value={loi}>
                      {loi} mins
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Audience</TableCell>
                      <TableCell>Field Close Date</TableCell>
                      <TableCell>IR</TableCell>
                      <TableCell>Drop Rate</TableCell>
                      <TableCell>Incidence Rate</TableCell>
                      <TableCell>LOI</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bid.target_audiences.map((audience) => (
                      <TableRow key={audience.id}>
                        <TableCell>{audience.name}</TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            value={fieldCloseDates[audience.id]}
                            onChange={(e) => handleFieldCloseDateChange(audience.id, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={metrics[audience.id].ir}
                            onChange={(e) => handleMetricChange(audience.id, 'ir', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={metrics[audience.id].drop_rate}
                            onChange={(e) => handleMetricChange(audience.id, 'drop_rate', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={metrics[audience.id].incidence_rate}
                            onChange={(e) => handleMetricChange(audience.id, 'incidence_rate', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={metrics[audience.id].loi}
                            onChange={(e) => handleMetricChange(audience.id, 'loi', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmit}
          >
            Submit & Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Closure; 