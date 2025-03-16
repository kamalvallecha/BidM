import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Button,
  Stack,
  Grid,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import './Bids.css';

function InvoiceEdit() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    partners: [],
    partner_lois: {},
    audiences: [],
    po_number: '',
    status: '',
    study_name: ''
  });

  const [selectedLOIs, setSelectedLOIs] = useState({});
  const [finalCPIs, setFinalCPIs] = useState({});
  const [invoiceDetails, setInvoiceDetails] = useState({
    po_number: '',
    invoice_date: null,
    invoice_sent: null,
    invoice_serial: '',
    invoice_number: '',
    invoice_amount: '0.00'
  });

  useEffect(() => {
    fetchData();
  }, [bidId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/bids/${bidId}/invoice-data`);
      setData(response.data);
      
      // Initialize selected LOIs for each partner with their first valid LOI
      const initialSelectedLOIs = {};
      response.data.partners.forEach(partner => {
        const validLOIs = response.data.partner_lois[partner.id] || [];
        if (validLOIs.length > 0) {
          initialSelectedLOIs[partner.id] = validLOIs[0];
        }
      });
      setSelectedLOIs(initialSelectedLOIs);

      // Initialize final CPIs
      const initialCPIs = {};
      response.data.audiences.forEach(audience => {
        audience.deliverables.forEach(del => {
          const key = `${del.partner_id}-${del.loi}-${audience.id}-${del.country}`;
          initialCPIs[key] = del.final_cpi || del.initial_cpi;
        });
      });
      setFinalCPIs(initialCPIs);

      // Set PO number if available
      if (response.data.po_number) {
        setInvoiceDetails(prev => ({
          ...prev,
          po_number: response.data.po_number
        }));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching invoice data:', err);
      setError('Failed to load invoice data');
      setLoading(false);
    }
  };

  const handleFinalCPIChange = (key, value) => {
    setFinalCPIs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // TODO: Implement save functionality
      alert('Changes saved successfully!');
      navigate('/ready-for-invoice');
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes');
    }
  };

  const handleCancel = () => {
    navigate('/ready-for-invoice');
  };

  const getCurrentPartner = () => data.partners[currentTab] || null;
  const getCurrentPartnerLOIs = () => {
    const partner = getCurrentPartner();
    return partner ? (data.partner_lois[partner.id] || []) : [];
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="invoice-edit-container">
      <Paper className="invoice-edit-form">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5">Ready to Invoice - {data.study_name}</Typography>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PO Number"
                value={invoiceDetails.po_number}
                onChange={(e) => setInvoiceDetails(prev => ({ ...prev, po_number: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Invoice Date"
                  value={invoiceDetails.invoice_date}
                  onChange={(date) => setInvoiceDetails(prev => ({ ...prev, invoice_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            {/* Add more invoice detail fields */}
          </Grid>
        </Box>

        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ mb: 2 }}
        >
          {data.partners.map((partner, index) => (
            <Tab key={partner.id} label={partner.partner_name} />
          ))}
        </Tabs>

        {getCurrentPartner() && (
          <Box sx={{ mb: 2 }}>
            <Typography>Select LOI:</Typography>
            <Stack direction="row" spacing={1}>
              {getCurrentPartnerLOIs().map(loi => (
                <Button
                  key={loi}
                  variant={selectedLOIs[getCurrentPartner().id] === loi ? "contained" : "outlined"}
                  onClick={() => setSelectedLOIs({
                    ...selectedLOIs,
                    [getCurrentPartner().id]: loi
                  })}
                >
                  {loi} MIN
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        {data.audiences.map((audience) => (
          <div key={audience.id} className="audience-section">
            <Typography variant="h6" sx={{ mb: 2 }}>
              {`${audience.name} - ${audience.ta_category}`}
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#7c4dff' }}>
                    <TableCell sx={{ color: 'white' }}>Country</TableCell>
                    <TableCell sx={{ color: 'white' }}>Allocation</TableCell>
                    <TableCell sx={{ color: 'white' }}>N Delivered</TableCell>
                    <TableCell sx={{ color: 'white' }}>Initial CPI</TableCell>
                    <TableCell sx={{ color: 'white' }}>Final CPI</TableCell>
                    <TableCell sx={{ color: 'white' }}>Initial Cost</TableCell>
                    <TableCell sx={{ color: 'white' }}>Final Cost</TableCell>
                    <TableCell sx={{ color: 'white' }}>Savings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {audience.deliverables
                    .filter(del => 
                      del.partner_id === getCurrentPartner()?.id && 
                      del.loi === selectedLOIs[getCurrentPartner()?.id]
                    )
                    .map((deliverable) => {
                      const key = `${deliverable.partner_id}-${deliverable.loi}-${audience.id}-${deliverable.country}`;
                      const finalCPI = finalCPIs[key] || deliverable.initial_cpi;
                      const finalCost = deliverable.n_delivered * finalCPI;
                      const savings = deliverable.initial_cost - finalCost;

                      return (
                        <TableRow key={deliverable.country}>
                          <TableCell>{deliverable.country}</TableCell>
                          <TableCell>{deliverable.allocation}</TableCell>
                          <TableCell>{deliverable.n_delivered}</TableCell>
                          <TableCell>{deliverable.initial_cpi.toFixed(2)}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={finalCPI}
                              onChange={(e) => handleFinalCPIChange(key, e.target.value)}
                              inputProps={{ step: 0.01, min: 0 }}
                            />
                          </TableCell>
                          <TableCell>{deliverable.initial_cost.toFixed(2)}</TableCell>
                          <TableCell>{finalCost.toFixed(2)}</TableCell>
                          <TableCell sx={{ color: savings > 0 ? 'green' : 'red' }}>
                            {savings.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ))}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Save Changes
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default InvoiceEdit;