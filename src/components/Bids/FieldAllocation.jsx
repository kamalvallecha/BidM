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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Button,
  Stack
} from '@mui/material';
import { useApi } from '../../hooks/useApi';
import './Bids.css';

function FieldAllocation() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const { callApi } = useApi();
  const [currentTab, setCurrentTab] = useState(0);
  const [partners, setPartners] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLOI, setSelectedLOI] = useState('');
  const [loiOptions, setLoiOptions] = useState([]);
  const [tempAllocations, setTempAllocations] = useState({}); // Store temporary changes

  useEffect(() => {
    fetchData();
  }, [bidId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for bid:', bidId);
      const data = await callApi(`/bids/${bidId}/field-data`);
      console.log('Raw response:', data);

      // Validate data
      if (!data.partners || !Array.isArray(data.partners)) {
        console.error('Invalid partners data:', data.partners);
        return;
      }

      setPartners(data.partners);
      setAudiences(data.audiences || []);
      
      if (data.loi_options && data.loi_options.length > 0) {
        setSelectedLOI(data.loi_options[0].loi);
        setLoiOptions(data.loi_options);
      }

      // Format responses
      const formattedResponses = {};
      if (data.responses) {
        data.responses.forEach(resp => {
          const key = `${resp.partner_id}-${resp.audience_id}-${resp.country}-${resp.loi}`;
          formattedResponses[key] = resp;
        });
      }
      setResponses(formattedResponses);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAllocationChange = (partnerId, audienceId, country, value) => {
    const key = `${partnerId}-${audienceId}-${country}-${selectedLOI}`;
    setTempAllocations(prev => ({
      ...prev,
      [key]: {
        partner_id: partnerId,
        audience_id: audienceId,
        country: country,
        allocation: value === '' ? 0 : parseInt(value, 10),
        loi: selectedLOI
      }
    }));

    // Also update the responses state to see changes immediately
    setResponses(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        allocation: value === '' ? 0 : parseInt(value, 10)
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      // Submit all allocation changes
      const promises = Object.values(tempAllocations).map(allocation =>
        callApi(`/bids/${bidId}/field-allocations`, {
          method: 'POST',
          body: JSON.stringify(allocation)
        })
      );

      await Promise.all(promises);
      alert('Allocations saved successfully!');
      navigate('/infield'); // Navigate back to InField page
    } catch (error) {
      console.error('Error saving allocations:', error);
      alert('Failed to save allocations');
    }
  };

  const handleCancel = () => {
    navigate('/infield'); // Navigate back to InField page
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="partner-response-container">
      <Paper className="partner-response-form">
        <div className="partner-header">
          <Typography variant="h5">Field Phase Allocation</Typography>
          <FormControl sx={{ minWidth: 120, marginLeft: 2 }}>
            <InputLabel>LOI</InputLabel>
            <Select
              value={selectedLOI}
              onChange={(e) => setSelectedLOI(e.target.value)}
              label="LOI"
            >
              {loiOptions.map((option) => (
                <MenuItem key={option.loi} value={option.loi}>
                  {option.loi}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          className="partner-tabs"
        >
          {partners.map((partner) => (
            <Tab key={partner.id} label={partner.partner_name} />
          ))}
        </Tabs>

        {audiences.map((audience, index) => (
          <div key={audience.id} className="audience-section">
            <Typography variant="h6" className="audience-title">
              {`Audience ${index + 1}: ${audience.audience_name}`}
            </Typography>
            <Typography variant="subtitle1" className="audience-category">
              {audience.ta_category}
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="table-header">
                    <TableCell>Country</TableCell>
                    <TableCell>Required</TableCell>
                    <TableCell>Partner Commitment</TableCell>
                    <TableCell>CPI</TableCell>
                    <TableCell>Allocation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {audience.countries.map((countryData) => {
                    const responseKey = `${partners[currentTab].id}-${audience.id}-${countryData.country}-${selectedLOI}`;
                    const response = responses[responseKey] || {};
                    
                    return (
                      <TableRow key={countryData.country}>
                        <TableCell>{countryData.country}</TableCell>
                        <TableCell>{countryData.sample_size}</TableCell>
                        <TableCell>{response.commitment || '-'}</TableCell>
                        <TableCell>{response.cpi || '-'}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={(tempAllocations[responseKey]?.allocation !== undefined) 
                              ? tempAllocations[responseKey].allocation 
                              : (response.allocation || 0)}
                            onChange={(e) => handleAllocationChange(
                              partners[currentTab].id,
                              audience.id,
                              countryData.country,
                              e.target.value
                            )}
                            inputProps={{
                              min: 0,
                              step: 1
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ))}

        {/* Add buttons at the bottom */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default FieldAllocation; 