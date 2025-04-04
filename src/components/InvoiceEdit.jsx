import React, { useState, useEffect } from 'react';
import { 
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Box,
  Tabs,
  Tab,
  styled,
  InputAdornment,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

// Styled components
const StyledTab = styled(Tab)({
  color: '#666',
  '&.Mui-selected': {
    color: '#1976d2',
  }
});

const LOIButton = styled(Button)(({ theme, isActive }) => ({
  borderRadius: '20px',
  marginRight: '10px',
  backgroundColor: isActive ? theme.palette.primary.main : 'transparent',
  color: isActive ? 'white' : theme.palette.primary.main,
  '&:hover': {
    backgroundColor: isActive ? theme.palette.primary.dark : 'rgba(25, 118, 210, 0.04)',
  }
}));

const InvoiceEdit = () => {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { callApi } = useApi();
  const isAdmin = user?.role === 'admin';
  const [activeVendor, setActiveVendor] = useState(0);
  const [activeLOI, setActiveLOI] = useState(null);
  const [partners, setPartners] = useState([]);
  const [lois, setLois] = useState([]);
  const [audienceIds, setAudienceIds] = useState([]);
  const [invoiceData, setInvoiceData] = useState({
    poNumber: '',
    invoiceDate: '',
    invoiceSerial: '',
    invoiceNumber: '',
    invoiceAmount: '0.00',
    deliverables: []
  });
  const [invoiceSent, setInvoiceSent] = useState('');
  const [formData, setFormData] = useState({
    poNumber: '',
    invoiceDate: '',
    invoiceSerial: '',
    invoiceNumber: '',
    invoiceSent: '',
    invoiceAmount: '0.00'
  });
  const [partnerFormData, setPartnerFormData] = useState({});
  const [finalCPIs, setFinalCPIs] = useState({});
  const [partnerInvoiceDetails, setPartnerInvoiceDetails] = useState({});
  const [hasInvalidCPI, setHasInvalidCPI] = useState(false);

  useEffect(() => {
    if (bidId) {
      fetchPartnerData();
    } else {
      navigate('/invoice');
    }
  }, [bidId]);

  useEffect(() => {
    if (bidId && partners.length > 0 && activeLOI !== null) {
      fetchInvoiceData();
    }
  }, [bidId, activeVendor, activeLOI]);

  useEffect(() => {
    // Load from session storage
    const savedState = sessionStorage.getItem(`invoice_${bidId}`);
    if (savedState && (!invoiceData.deliverables.length || !formData.invoiceDate)) {
      const { 
        formData: savedForm, 
        invoiceData: savedInvoice, 
        partnerFormData: savedPartnerForm,
        finalCPIs: savedFinalCPIs 
      } = JSON.parse(savedState);
      setFormData(savedForm);
      setInvoiceData(savedInvoice);
      setPartnerFormData(savedPartnerForm || {});
      setFinalCPIs(savedFinalCPIs || {});
    }
  }, []);

  useEffect(() => {
    // Add effect to save to session storage
    sessionStorage.setItem(`invoice_${bidId}`, JSON.stringify({
      formData,
      invoiceData,
      partnerFormData,
      finalCPIs
    }));
  }, [formData, invoiceData, partnerFormData, finalCPIs]);

  useEffect(() => {
    if (bidId && partners.length > 0) {
      checkAllFinalCPIs();
    }
  }, [bidId, partners, invoiceData]);

  const fetchPartnerData = async () => {
    try {
      const data = await callApi(`/invoice/${bidId}/partner-data`);
      console.log('Partner data response:', data); // Debug log
      
      // Extract unique partners and LOIs from partner_data keys
      const uniquePartners = [...new Set(Object.keys(data.partner_data).map(key => key.split('_')[0]))];
      const uniqueLois = [...new Set(Object.keys(data.partner_data).map(key => parseInt(key.split('_')[1])))].sort((a, b) => a - b);
      const uniqueAudiences = [...new Set(
        Object.values(data.partner_data)
          .flatMap(pd => pd.deliverables)
          .map(d => d.audience_id)
      )].sort((a, b) => a - b);
      
      setPartners(uniquePartners);
      setLois(uniqueLois);
      setAudienceIds(uniqueAudiences);

      // Store invoice details for each partner
      const partnerDetails = {};
      Object.entries(data.partner_data).forEach(([key, value]) => {
        const [partner, loi] = key.split('_');
        if (!partnerDetails[partner]) {
          partnerDetails[partner] = {
            poNumber: data.po_number || '',
            invoiceDate: value.invoice_details?.invoice_date || '',
            invoiceSent: value.invoice_details?.invoice_sent || '',
            invoiceSerial: value.invoice_details?.invoice_serial || '',
            invoiceNumber: value.invoice_details?.invoice_number || '',
            invoiceAmount: value.invoice_details?.invoice_amount || '0.00'
          };
        }
      });
      console.log('Partner invoice details:', partnerDetails); // Debug log
      setPartnerInvoiceDetails(partnerDetails);

      // Set initial form data for first partner
      if (uniquePartners.length > 0) {
        const firstPartner = uniquePartners[0];
        const initialFormData = {
          poNumber: data.po_number || '',
          invoiceDate: data.partner_data[`${firstPartner}_${uniqueLois[0]}`]?.invoice_details?.invoice_date || '',
          invoiceSent: data.partner_data[`${firstPartner}_${uniqueLois[0]}`]?.invoice_details?.invoice_sent || '',
          invoiceSerial: data.partner_data[`${firstPartner}_${uniqueLois[0]}`]?.invoice_details?.invoice_serial || '',
          invoiceNumber: data.partner_data[`${firstPartner}_${uniqueLois[0]}`]?.invoice_details?.invoice_number || '',
          invoiceAmount: data.partner_data[`${firstPartner}_${uniqueLois[0]}`]?.invoice_details?.invoice_amount || '0.00'
        };
        console.log('Setting initial form data:', initialFormData); // Debug log
        setFormData(initialFormData);
        setActiveVendor(0);
        setActiveLOI(uniqueLois[0]);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    }
  };

  const fetchInvoiceData = async () => {
    try {
        const currentPartner = partners[activeVendor];
        const data = await callApi(`/invoice/${bidId}/${currentPartner}/${activeLOI}/details`);
        console.log('Invoice data response:', data);

        if (data.error) {
            throw new Error(data.error);
        }

        // Check if there are any deliverables with n_delivered > 0
        const hasDeliverables = data.deliverables && data.deliverables.some(item => item.nDelivered > 0);

        if (!hasDeliverables) {
            setInvoiceData({
                ...invoiceData,
                deliverables: [],
                message: 'No respondents delivered for this LOI'
            });
            return;
        }

        // Update invoice data state
        setInvoiceData({
            ...data,
            deliverables: data.deliverables.map(item => ({
                ...item,
                finalCPI: getFinalCPI(currentPartner, activeLOI, item.audience_id, item.country) || item.finalCPI || item.initialCPI,
                finalCost: item.finalCost || (item.nDelivered * item.initialCPI)
            }))
        });

        // Get the invoice details for this partner
        const currentInvoiceDetails = data.invoice_details || {};
        
        // Update form data with invoice details
        const newFormData = {
            poNumber: data.po_number || '',
            invoiceDate: currentInvoiceDetails.invoice_date || '',
            invoiceSent: currentInvoiceDetails.invoice_sent || '',
            invoiceSerial: currentInvoiceDetails.invoice_serial || '',
            invoiceNumber: currentInvoiceDetails.invoice_number || '',
            invoiceAmount: currentInvoiceDetails.invoice_amount?.toString() || calculateTotalAmount(data.deliverables).toFixed(2)
        };

        // Update form data
        setFormData(newFormData);

        // Update partner invoice details
        setPartnerInvoiceDetails(prev => ({
            ...prev,
            [currentPartner]: newFormData
        }));

    } catch (error) {
        console.error('Error fetching invoice data:', error);
        alert('Failed to fetch invoice data: ' + (error.message || 'Unknown error occurred'));
    }
  };

  // Helper function to calculate total amount from deliverables
  const calculateTotalAmount = (deliverables) => {
    return deliverables.reduce((sum, item) => {
        const finalCPI = item.finalCPI || item.initialCPI;
        return sum + (item.nDelivered * finalCPI);
    }, 0);
  };

  // Helper function to get Final CPI from state
  const getFinalCPI = (partner, loi, audienceId, country) => {
    const key = `${partner}-${loi}-${audienceId}-${country}`;
    return finalCPIs[key];
  };

  const handleCancel = () => {
    navigate('/invoice');
  };

  const handleSubmit = async () => {
    try {
        // Check current page first
        const currentDeliverables = invoiceData.deliverables.filter(item => item.nDelivered > 0);
        const hasInvalidCurrentCPI = currentDeliverables.some(item => 
            !item.finalCPI || 
            parseFloat(item.finalCPI) === 0 || 
            item.finalCPI === '0' || 
            item.finalCPI === ''
        );

        if (hasInvalidCurrentCPI) {
            alert(`Please fill in all Final CPI values for ${partners[activeVendor]} with ${activeLOI} min LOI`);
            return;
        }

        // Then check all other partner-LOI combinations
        for (let partnerIndex = 0; partnerIndex < partners.length; partnerIndex++) {
            const currentPartner = partners[partnerIndex];
            
            for (const loi of lois) {
                // Skip current combination as we already checked it
                if (currentPartner === partners[activeVendor] && loi === activeLOI) {
                    continue;
                }

                const data = await callApi(`/invoice/${bidId}/${currentPartner}/${loi}/details`);
                
                if (data.deliverables && data.deliverables.length > 0) {
                    const deliveredItems = data.deliverables.filter(item => item.nDelivered > 0);
                    
                    if (deliveredItems.length > 0) {
                        const hasInvalidCPI = deliveredItems.some(item => 
                            !item.finalCPI || 
                            parseFloat(item.finalCPI) === 0 || 
                            item.finalCPI === '0' || 
                            item.finalCPI === ''
                        );
                        
                        if (hasInvalidCPI) {
                            alert(`Please check ${currentPartner} with ${loi} min LOI for Final CPI`);
                            return;
                        }
                    }
                }
            }
        }

        // If we get here, all CPIs are valid - proceed with save and submit
        await handleSave();  // Save current page first

        // Submit the invoice
        await callApi(`/invoice/${bidId}/submit`, {
            method: 'POST'
        });

        alert('Invoice submitted successfully!');
        navigate('/invoice');
        
    } catch (error) {
        console.error('Error submitting invoice:', error);
        alert(error.message || 'Failed to submit invoice');
    }
  };

  // Update Final CPI handler to store values properly
  const handleFinalCPIChange = (item) => (event) => {
    const newValue = Number(event.target.value);
    const currentPartner = partners[activeVendor];
    const key = `${currentPartner}-${activeLOI}-${item.audience_id}-${item.country}`;

    setFinalCPIs(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Update deliverables with new CPI
    const updatedDeliverables = invoiceData.deliverables.map(d => {
      if (d.audience_id === item.audience_id && d.country === item.country) {
        const finalCost = d.nDelivered * newValue;
        return {
          ...d,
          finalCPI: newValue,
          finalCost: finalCost,
          savings: (d.nDelivered * d.initialCPI) - finalCost
        };
      }
      return d;
    });

    setInvoiceData(prev => ({
      ...prev,
      deliverables: updatedDeliverables
    }));

    // Update total invoice amount
    const totalAmount = updatedDeliverables.reduce((sum, d) => 
      sum + (d.nDelivered * (d.finalCPI || d.initialCPI)), 0
    );

    // Update form data and partner invoice details
    const updatedInvoiceDetails = {
      ...formData,
      invoiceAmount: totalAmount.toFixed(2)
    };
    
    setFormData(updatedInvoiceDetails);
    setPartnerInvoiceDetails(prev => ({
      ...prev,
      [currentPartner]: updatedInvoiceDetails
    }));
  };

  // Update partner change handler
  const handlePartnerChange = (event, newValue) => {
    setActiveVendor(newValue);
    const newPartner = partners[newValue];
    
    // Load saved invoice details for the new partner
    if (newPartner) {
      setFormData(partnerInvoiceDetails[newPartner] || {
        poNumber: '',
        invoiceDate: '',
        invoiceSent: '',
        invoiceSerial: '',
        invoiceNumber: '',
        invoiceAmount: '0.00'
      });
    }
  };

  // Update form data change handler to persist partner invoice details
  const handleInputChange = (field) => (event) => {
    const currentPartner = partners[activeVendor];
    const newValue = event.target.value;
    
    const updatedFormData = {
      ...formData,
      [field]: newValue
    };
    
    setFormData(updatedFormData);
    setPartnerInvoiceDetails(prev => ({
      ...prev,
      [currentPartner]: updatedFormData
    }));
  };

  const handleSave = async () => {
    try {
      const currentPartner = partners[activeVendor];
      if (!currentPartner) {
        throw new Error('No partner selected');
      }

      // Format dates properly
      const formattedInvoiceDate = formData.invoiceDate ? new Date(formData.invoiceDate).toISOString().split('T')[0] : null;
      const formattedInvoiceSent = formData.invoiceSent ? new Date(formData.invoiceSent).toISOString().split('T')[0] : null;

      // Filter deliverables with n_delivered > 0
      const validDeliverables = invoiceData.deliverables
        .filter(item => item.nDelivered > 0)
        .map(item => ({
          audience_id: item.audience_id,
          country: item.country,
          final_cpi: parseFloat(item.finalCPI || item.initialCPI),
          final_cost: item.nDelivered * parseFloat(item.finalCPI || item.initialCPI)
        }));

      // Prepare the data to match the backend structure
      const dataToSave = {
        invoice_date: formattedInvoiceDate,
        invoice_sent: formattedInvoiceSent,
        invoice_serial: formData.invoiceSerial,
        invoice_number: formData.invoiceNumber,
        invoice_amount: parseFloat(formData.invoiceAmount || '0'),
        partner_name: currentPartner,
        loi: parseInt(activeLOI),
        deliverables: validDeliverables
      };

      console.log('Saving invoice data:', dataToSave);

      const response = await callApi(`/invoice/${bidId}/save`, {
        method: 'POST',
        body: JSON.stringify(dataToSave)
      });

      console.log('Save response:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      alert('Data saved successfully!');
      
      // Refresh the data after saving
      await fetchInvoiceData();

    } catch (error) {
      console.error('Error saving invoice data:', error);
      alert('Failed to save data: ' + (error.message || 'Unknown error occurred'));
    }
  };

  const checkAllFinalCPIs = async () => {
    try {
      for (let partnerIndex = 0; partnerIndex < partners.length; partnerIndex++) {
        const currentPartner = partners[partnerIndex];
        
        for (const loi of lois) {
          const data = await callApi(`/invoice/${bidId}/${currentPartner}/${loi}/details`);
          
          if (data.deliverables && data.deliverables.length > 0) {
            const deliveredItems = data.deliverables.filter(item => item.nDelivered > 0);
            
            if (deliveredItems.length > 0) {
              const hasInvalidCPI = deliveredItems.some(item => 
                !item.finalCPI || 
                item.finalCPI === 0 || 
                item.finalCPI === '0' || 
                item.finalCPI === ''
              );
              
              if (hasInvalidCPI) {
                setHasInvalidCPI(true);
                return;
              }
            }
          }
        }
      }
      setHasInvalidCPI(false);
    } catch (error) {
      console.error('Error checking Final CPIs:', error);
    }
  };

  const renderAudienceTable = (audienceId) => {
    // Filter for rows with deliveries
    const audienceDeliverables = invoiceData.deliverables.filter(
      item => item.audience_id === audienceId && item.nDelivered > 0
    );

    if (!audienceDeliverables.length) return null;

    return (
      <TableContainer component={Paper} sx={{ mb: 4 }} key={audienceId}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Deliverables & Costs - Audience {audienceId}
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell align="right">Allocation</TableCell>
              <TableCell align="right">N Delivered</TableCell>
              <TableCell align="right">Initial CPI</TableCell>
              <TableCell align="right">Final CPI</TableCell>
              <TableCell align="right">Initial Cost</TableCell>
              <TableCell align="right">Final Cost</TableCell>
              <TableCell align="right">Savings</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {audienceDeliverables.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.country}</TableCell>
                <TableCell align="right">{item.allocation}</TableCell>
                <TableCell align="right">{item.nDelivered}</TableCell>
                <TableCell align="right">
                  ${Number(item.initialCPI).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <TextField
                    type="number"
                    value={item.finalCPI}
                    onChange={handleFinalCPIChange(item)}
                    inputProps={{ 
                      step: "0.01",
                      min: "0"
                    }}
                    size="small"
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell align="right">
                  ${Number(item.initialCost).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  ${Number(item.finalCost).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  ${Number(item.savings).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Ready to Invoice</Typography>
      
      <Tabs 
        value={activeVendor} 
        onChange={handlePartnerChange}
        sx={{ mb: 3 }}
      >
        {partners.map((partner, index) => (
          <StyledTab key={partner} label={partner} />
        ))}
      </Tabs>

      <Box sx={{ mb: 3, bgcolor: '#f5f5f5', p: 2 }}>
        <Typography sx={{ mb: 1 }}>Select LOI:</Typography>
        <Box>
          {lois.map(loi => (
            <LOIButton 
              key={loi}
              variant={activeLOI === loi ? 'contained' : 'outlined'}
              onClick={() => setActiveLOI(loi)}
              isActive={activeLOI === loi}
            >
              {loi} min
            </LOIButton>
          ))}
        </Box>
      </Box>

      <Typography sx={{ mb: 1, color: 'primary.main' }}>
        Currently viewing: {partners[activeVendor]} with {activeLOI} min LOI
      </Typography>

      {invoiceData.message ? (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
        >
          {invoiceData.message}
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              label="PO Number"
              value={formData.poNumber}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Invoice Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.invoiceDate}
              onChange={handleInputChange('invoiceDate')}
            />
            <TextField
              label="Invoice Sent"
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              value={formData.invoiceSent}
              onChange={handleInputChange('invoiceSent')}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 4 }}>
            <TextField
              label="Invoice Serial #"
              fullWidth
              value={formData.invoiceSerial}
              onChange={handleInputChange('invoiceSerial')}
            />
            <TextField
              label="Invoice #"
              fullWidth
              value={formData.invoiceNumber}
              onChange={handleInputChange('invoiceNumber')}
            />
            <TextField
              label="Invoice Amount"
              fullWidth
              value={formData.invoiceAmount}
              onChange={handleInputChange('invoiceAmount')}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />
          </Box>

          {audienceIds.map(audienceId => renderAudienceTable(audienceId))}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
            {isAdmin && (
              <Button variant="contained" color="secondary" onClick={handleSave}>
                Save
              </Button>
            )}
            {isAdmin && (
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={hasInvalidCPI}
              >
                Submit
              </Button>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default InvoiceEdit; 