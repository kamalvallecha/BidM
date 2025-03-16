import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Paper, 
  FormControl, 
  Select, 
  MenuItem, 
  TextField, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Bids.css';

function PartnerResponse() {
  const navigate = useNavigate();
  const { bidId } = useParams();
  const [selectedPartner, setSelectedPartner] = useState(0);
  const [selectedLOI, setSelectedLOI] = useState('');
  const [partners, setPartners] = useState([]);
  const [bidData, setBidData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [savingStatus, setSavingStatus] = useState({});
  const [allResponsesComplete, setAllResponsesComplete] = useState(false);
  const [partnerSettings, setPartnerSettings] = useState({});
  const [error, setError] = useState(null);
  const [responsesInitialized, setResponsesInitialized] = useState(false);

  const currentPartner = partners[selectedPartner];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        let formData;
        
        // Check if this is a new bid or edit mode
        if (bidId.startsWith('temp_')) {
          // New bid - get data from session storage
          formData = JSON.parse(sessionStorage.getItem('basicDetailsFormData'));
          if (!formData) {
            throw new Error('No bid data found');
          }
        } else {
          // Edit mode - fetch from API
          const bidResponse = await axios.get(`http://localhost:5000/api/bids/${bidId}`);
          formData = bidResponse.data;
        }

        // Format the bid data
        const formattedBidData = {
          ...formData,
          target_audiences: formData.target_audiences.map((ta, index) => ({
            ...ta,
            uniqueId: `audience-${index}`,
            audience_name: ta.name
          }))
        };
        setBidData(formattedBidData);

        // Load partners
        const partnersResponse = await axios.get('http://localhost:5000/api/partners');
        const allPartners = partnersResponse.data;
        
        // Filter partners based on selected partners in form data
        const selectedPartners = allPartners.filter(
          partner => formData.partners.includes(partner.id)
        );
        setPartners(selectedPartners);

        // Load responses based on mode
        if (!bidId.startsWith('temp_')) {
          // Edit mode - load existing responses
          const responseData = await axios.get(`http://localhost:5000/api/bids/${bidId}/responses`);
          setResponses(responseData.data.responses || {});
          setPartnerSettings(responseData.data.settings || {});
        } else {
          // New bid - initialize empty responses
          const initialResponses = {};
          const initialSettings = {};
          
          selectedPartners.forEach(partner => {
            // Initialize settings for each partner
            initialSettings[partner.id] = {
              currency: 'USD',
              pmf: 0
            };

            formData.loi.forEach(loi => {
              const key = `${partner.id}-${loi}`;
              initialResponses[key] = {
                partner_id: partner.id,
                loi: loi,
                status: 'draft',
                currency: 'USD',
                pmf: 0,
                audiences: {}
              };

              // Initialize empty audience data
              formData.target_audiences.forEach((audience, index) => {
                initialResponses[key].audiences[`audience-${index}`] = {
                  timeline: '',
                  comments: '',
                };

                // Initialize empty country data
                Object.keys(audience.country_samples || {}).forEach(country => {
                  initialResponses[key].audiences[`audience-${index}`][country] = {
                    commitment: '',
                    cpi: ''
                  };
                });
              });
            });
          });

          setResponses(initialResponses);
          setPartnerSettings(initialSettings);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bidId]);

  useEffect(() => {
    if (bidData && bidData.loi && bidData.loi.length > 0) {
      setSelectedLOI(bidData.loi[0]);
    }
  }, [bidData]);

  useEffect(() => {
    if (!bidData || !partners) return;

    const isComplete = partners.every(partner => 
      bidData.loi.every(loi => {
        const responseKey = `${partner.id}-${loi}`;
        const response = responses[responseKey];
        
        if (!response) return false;

        const allAudiencesComplete = bidData.target_audiences.every(audience => {
          const audienceResponse = response.audiences?.[audience.uniqueId];
          if (!audienceResponse) return false;

          const allCountriesComplete = Object.entries(audience.country_samples || {}).every(
            ([country]) => {
              const countryResponse = audienceResponse[country];
              return countryResponse?.commitment > 0 && countryResponse?.cpi > 0;
            }
          );

          const hasTimeline = audienceResponse.timeline > 0;

          return allCountriesComplete && hasTimeline;
        });

        return allAudiencesComplete;
      })
    );

    setAllResponsesComplete(isComplete);
  }, [responses, bidData, partners]);

  useEffect(() => {
    if (bidData && partners) {
      const initialStatus = {};
      partners.forEach(partner => {
        bidData.loi.forEach(loi => {
          initialStatus[`${partner.id}-${loi}`] = 'unsaved';
        });
      });
      setSavingStatus(initialStatus);
    }
  }, [bidData, partners]);

  useEffect(() => {
    sessionStorage.setItem('partnerResponsesData', JSON.stringify(responses));
  }, [responses]);

  useEffect(() => {
    if (!responsesInitialized && bidData && partners && bidData.loi) {
      const initialResponses = { ...responses };
      
      partners.forEach(partner => {
        bidData.loi.forEach(loi => {
          const key = `${partner.id}-${loi}`;
          if (!initialResponses[key]) {
            initialResponses[key] = {
              partner_id: partner.id,
              loi: loi,
              status: 'pending',
              currency: partnerSettings[partner.id]?.currency || 'USD',
              pmf: partnerSettings[partner.id]?.pmf || 0,
              audiences: {}
            };

            // Initialize audience data for each LOI
            bidData.target_audiences.forEach(audience => {
              initialResponses[key].audiences[audience.uniqueId] = {
                timeline: 0,
                comments: '',
              };

              // Initialize country data for each audience
              Object.entries(audience.country_samples || {}).forEach(([country, sample]) => {
                initialResponses[key].audiences[audience.uniqueId][country] = {
                  commitment: sample,
                  cpi: 0
                };
              });
            });
          }
        });
      });

      setResponses(initialResponses);
      sessionStorage.setItem('partnerResponsesData', JSON.stringify(initialResponses));
      setResponsesInitialized(true);
    }
  }, [bidData, partners, responsesInitialized]);

  const handlePartnerChange = (event, newValue) => {
    setSelectedPartner(newValue);
  };

  const handleSave = async (partner, currentLoi) => {
    try {
      // Save current LOI data
      const key = `${partner.id}-${currentLoi}`;
      setSavingStatus(prev => ({
        ...prev,
        [key]: 'saving'
      }));

      // Get current values for this partner-LOI combination
      const currentValues = responses[key] || {};

      // Create updated response with current values
      const updatedResponse = {
        ...currentValues,
        partner_id: partner.id,
        loi: currentLoi,
        status: 'saved',
        currency: partnerSettings[partner.id]?.currency || 'USD',
        pmf: partnerSettings[partner.id]?.pmf || 0,
        audiences: currentValues.audiences || {}
      };

      // Update responses state
      setResponses(prev => ({
        ...prev,
        [key]: updatedResponse
      }));

      // Save to session storage
      sessionStorage.setItem('partnerResponsesData', JSON.stringify({
        ...responses,
        [key]: updatedResponse
      }));

      setSavingStatus(prev => ({
        ...prev,
        [key]: 'saved'
      }));

    } catch (error) {
      console.error('Error saving response:', error);
      setSavingStatus(prev => ({
        ...prev,
        [key]: 'error'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate all responses are complete
      if (!allResponsesComplete) {
        alert('Please complete all partner responses before submitting');
        return;
      }

      // Create complete responses for all LOIs
      const updatedResponses = {};
      partners.forEach(partner => {
        bidData.loi.forEach(loi => {
          const key = `${partner.id}-${loi}`;
          
          // Create complete response structure for each LOI
          const response = {
            partner_id: partner.id,
            loi: loi,
            status: 'submitted',
            currency: partnerSettings[partner.id]?.currency || 'USD',
            pmf: partnerSettings[partner.id]?.pmf || 0,
            audiences: {}
          };

          // Add audience data for each target audience
          bidData.target_audiences.forEach(audience => {
            response.audiences[audience.uniqueId] = {
              ...responses[key]?.audiences?.[audience.uniqueId],
              timeline: responses[key]?.audiences?.[audience.uniqueId]?.timeline || 0,
              comments: responses[key]?.audiences?.[audience.uniqueId]?.comments || '',
            };

            // Add country data for each audience
            Object.entries(audience.country_samples || {}).forEach(([country, sample]) => {
              response.audiences[audience.uniqueId][country] = {
                commitment: responses[key]?.audiences?.[audience.uniqueId]?.[country]?.commitment || sample,
                cpi: responses[key]?.audiences?.[audience.uniqueId]?.[country]?.cpi || 0
              };
            });
          });

          updatedResponses[key] = response;
        });
      });

      // Send all responses to backend
      const response = await axios.put(`http://localhost:5000/api/bids/${bidId}/partner-responses`, {
        responses: updatedResponses
      });

      if (response.status === 200) {
        alert('Partner responses submitted successfully');
        navigate('/bids');
      }
    } catch (error) {
      console.error('Full error details:', error);
      console.error('Error response data:', error.response?.data);
      alert(`Error submitting responses: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleBack = () => {
    if (bidId.startsWith('temp_')) {
      // For new bids, preserve the form data
      navigate('/bids/new', { 
        state: { 
          preserveResponses: true,
          fromEdit: true 
        } 
      });
    } else {
      // For existing bids, go back to edit mode
      navigate(`/bids/edit/${bidId}`, { 
        state: { fromEdit: true } 
      });
    }
  };

  const handlePMFChange = (partnerId, value) => {
    const pmf = parseFloat(value);
    setPartnerSettings(prev => ({
      ...prev,
      [partnerId]: { ...prev[partnerId], pmf }
    }));

    // Update all responses for this partner with new PMF
    setResponses(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.startsWith(`${partnerId}-`)) {
          updated[key] = {
            ...updated[key],
            pmf
          };
        }
      });
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="partner-response-container">
        <Paper className="partner-response-form">
          <Typography>Loading bid data...</Typography>
        </Paper>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-response-container">
        <Paper className="partner-response-form">
          <Typography color="error">Error: {error}</Typography>
          <Button onClick={() => navigate('/bids/new')}>Go Back</Button>
        </Paper>
      </div>
    );
  }

  if (!bidData) {
    return (
      <div className="partner-response-container">
        <Paper className="partner-response-form">
          <Typography>No bid data found</Typography>
          <Button onClick={() => navigate('/bids/new')}>Go Back</Button>
        </Paper>
      </div>
    );
  }

  return (
    <div className="partner-response-container">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : !bidData || partners.length === 0 ? (
        <div>No data available</div>
      ) : (
        <Paper className="partner-response-form">
          <h2>Partner Response Collection</h2>
          <div className="form-controls">
            <FormControl className="loi-select">
              <Select
                value={selectedLOI}
                onChange={(e) => setSelectedLOI(e.target.value)}
                displayEmpty
                placeholder="Select LOI"
              >
                <MenuItem value="" disabled>Select LOI</MenuItem>
                {bidData.loi.map(loi => (
                  <MenuItem key={loi} value={loi}>{loi} mins</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {partners.length > 0 && (
            <>
              <Tabs
                value={selectedPartner}
                onChange={handlePartnerChange}
                variant="scrollable"
                scrollButtons="auto"
                className="partner-tabs"
              >
                {partners.map((partner) => (
                  <Tab key={partner.id} label={partner.partner_name} />
                ))}
              </Tabs>

              {currentPartner && (
                <div className="partner-tab-content">
                  <div className="partner-settings">
                    <FormControl className="currency-select">
                      <Select
                        value={partnerSettings[currentPartner.id]?.currency || 'USD'}
                        onChange={(e) => setPartnerSettings(prev => ({
                          ...prev,
                          [currentPartner.id]: { ...prev[currentPartner.id], currency: e.target.value }
                        }))}
                        size="small"
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="PMF"
                      type="number"
                      size="small"
                      className="pmf-input"
                      inputProps={{ min: 0, step: 0.1 }}
                      value={partnerSettings[currentPartner.id]?.pmf || ''}
                      onChange={(e) => handlePMFChange(currentPartner.id, e.target.value)}
                    />
                  </div>

                  {bidData.target_audiences.map((audience, audienceIndex) => (
                    <div key={audienceIndex} className="audience-section">
                      <Typography variant="subtitle1" className="audience-title">
                        {audience.audience_name} Details
                      </Typography>
                      <Typography variant="subtitle2" className="audience-category">
                        {audience.ta_category}
                      </Typography>

                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Country</TableCell>
                              <TableCell align="right">Required</TableCell>
                              <TableCell align="right">Commitment</TableCell>
                              <TableCell align="right">CPI</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(audience.country_samples || {}).map(([country, sample], idx) => (
                              <TableRow key={idx}>
                                <TableCell>{country}</TableCell>
                                <TableCell align="right">{sample}</TableCell>
                                <TableCell align="right">
                                  <TextField
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 0 }}
                                    value={responses[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId]?.[country]?.commitment || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      setResponses(prev => ({
                                        ...prev,
                                        [`${currentPartner.id}-${selectedLOI}`]: {
                                          ...prev[`${currentPartner.id}-${selectedLOI}`],
                                          partner_id: currentPartner.id,
                                          loi: selectedLOI,
                                          audiences: {
                                            ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences,
                                            [audience.uniqueId]: {
                                              ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId],
                                              [country]: {
                                                ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId]?.[country],
                                                commitment: value
                                              }
                                            }
                                          }
                                        }
                                      }));
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 0 }}
                                    value={responses[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId]?.[country]?.cpi || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      setResponses(prev => ({
                                        ...prev,
                                        [`${currentPartner.id}-${selectedLOI}`]: {
                                          ...prev[`${currentPartner.id}-${selectedLOI}`],
                                          partner_id: currentPartner.id,
                                          loi: selectedLOI,
                                          audiences: {
                                            ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences,
                                            [audience.uniqueId]: {
                                              ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId],
                                              [country]: {
                                                ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId]?.[country],
                                                cpi: value
                                              }
                                            }
                                          }
                                        }
                                      }));
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Bid Timeline (days)"
                        className="timeline-field"
                        value={responses[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId]?.timeline || ''}
                        onChange={(e) => setResponses(prev => ({
                          ...prev,
                          [`${currentPartner.id}-${selectedLOI}`]: {
                            ...prev[`${currentPartner.id}-${selectedLOI}`],
                            audiences: {
                              ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences,
                              [audience.uniqueId]: {
                                ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId],
                                timeline: parseFloat(e.target.value)
                              }
                            }
                          }
                        }))}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Comments"
                        className="comments-field"
                        value={responses[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId]?.comments || ''}
                        onChange={(e) => setResponses(prev => ({
                          ...prev,
                          [`${currentPartner.id}-${selectedLOI}`]: {
                            ...prev[`${currentPartner.id}-${selectedLOI}`],
                            audiences: {
                              ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences,
                              [audience.uniqueId]: {
                                ...prev[`${currentPartner.id}-${selectedLOI}`]?.audiences?.[audience.uniqueId],
                                comments: e.target.value
                              }
                            }
                          }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="form-actions">
            <Button onClick={handleBack}>BACK</Button>
            {currentPartner && (
              <Button 
                onClick={() => handleSave(currentPartner, selectedLOI)}
                disabled={!selectedLOI}
                color={savingStatus[`${currentPartner.id}-${selectedLOI}`] === 'error' ? 'error' : 'primary'}
                variant={savingStatus[`${currentPartner.id}-${selectedLOI}`] === 'saved' ? 'outlined' : 'contained'}
              >
                {!selectedLOI ? 'Select LOI' :
                  savingStatus[`${currentPartner.id}-${selectedLOI}`] === 'saving' ? 'Saving...' : 
                  savingStatus[`${currentPartner.id}-${selectedLOI}`] === 'saved' ? 'Saved ✓' : 
                  savingStatus[`${currentPartner.id}-${selectedLOI}`] === 'error' ? 'Try Again' : 
                  'Save'}
              </Button>
            )}
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSubmit}
              disabled={!allResponsesComplete}
            >
              SUBMIT
            </Button>
          </div>
        </Paper>
      )}
    </div>
  );
}

export default PartnerResponse; 