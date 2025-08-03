import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
  Alert,
  IconButton,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const steps = ['Basic Info', 'Build World', 'Review & Publish']

const CreateWorldPage = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [tabValue, setTabValue] = useState(0)
  const [worldData, setWorldData] = useState({
    worldInfo: {
      name: '',
      description: '',
      author: '',
      version: '1.0.0'
    },
    startLocation: '',
    locations: {},
    items: {},
    specialActions: {},
    tags: [],
    isPublic: true
  })
  
  const [currentLocation, setCurrentLocation] = useState({
    id: '',
    name: '',
    description: '',
    choices: []
  })
  
  const [currentChoice, setCurrentChoice] = useState({
    text: '',
    action: 'move',
    target: ''
  })
  
  const [editingLocation, setEditingLocation] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false)
  const [jsonContent, setJsonContent] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Validate world structure
      if (!data.worldInfo || !data.locations || !data.startLocation) {
        toast.error('Invalid world file format')
        return
      }
      
      setWorldData({
        ...data,
        tags: data.tags || [],
        isPublic: data.isPublic !== false
      })
      
      toast.success('World file loaded successfully!')
      setActiveStep(1)
    } catch (error) {
      toast.error('Failed to load world file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  })

  const handleAddLocation = () => {
    if (!currentLocation.id || !currentLocation.name) {
      toast.error('Location ID and name are required')
      return
    }

    setWorldData(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        [currentLocation.id]: {
          name: currentLocation.name,
          description: currentLocation.description,
          choices: currentLocation.choices
        }
      },
      startLocation: prev.startLocation || currentLocation.id
    }))

    setCurrentLocation({
      id: '',
      name: '',
      description: '',
      choices: []
    })
    
    toast.success('Location added!')
  }

  const handleAddChoice = () => {
    if (!currentChoice.text || !currentChoice.target) {
      toast.error('Choice text and target are required')
      return
    }

    setCurrentLocation(prev => ({
      ...prev,
      choices: [...prev.choices, { ...currentChoice }]
    }))

    setCurrentChoice({
      text: '',
      action: 'move',
      target: ''
    })
  }

  const handleDeleteLocation = (locationId) => {
    const newLocations = { ...worldData.locations }
    delete newLocations[locationId]
    
    setWorldData(prev => ({
      ...prev,
      locations: newLocations,
      startLocation: prev.startLocation === locationId ? '' : prev.startLocation
    }))
  }

  const handleEditLocation = (locationId) => {
    const location = worldData.locations[locationId]
    setCurrentLocation({
      id: locationId,
      name: location.name,
      description: location.description,
      choices: location.choices
    })
    setEditingLocation(locationId)
    setTabValue(0)
  }

  const handleUpdateLocation = () => {
    if (!editingLocation) return

    handleAddLocation()
    setEditingLocation(null)
  }

  const handlePublish = async () => {
    setUploading(true)
    
    try {
      // Validate world data
      if (!worldData.worldInfo.name) {
        toast.error('World name is required')
        return
      }
      
      if (Object.keys(worldData.locations).length === 0) {
        toast.error('At least one location is required')
        return
      }
      
      if (!worldData.startLocation) {
        toast.error('Start location must be set')
        return
      }

      const response = await axios.post(`${API_URL}/worlds`, {
        name: worldData.worldInfo.name,
        description: worldData.worldInfo.description,
        worldData: {
          worldInfo: worldData.worldInfo,
          locations: worldData.locations,
          items: worldData.items,
          specialActions: worldData.specialActions,
          startLocation: worldData.startLocation
        },
        tags: worldData.tags,
        isPublic: worldData.isPublic
      })

      toast.success('World published successfully!')
      navigate(`/worlds/${response.data.id}`)
    } catch (error) {
      toast.error('Failed to publish world')
    } finally {
      setUploading(false)
    }
  }

  const downloadWorldFile = () => {
    const dataStr = JSON.stringify({
      worldInfo: worldData.worldInfo,
      locations: worldData.locations,
      items: worldData.items,
      specialActions: worldData.specialActions,
      startLocation: worldData.startLocation
    }, null, 2)
    
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${worldData.worldInfo.name || 'world'}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const openJsonEditor = () => {
    setJsonContent(JSON.stringify({
      worldInfo: worldData.worldInfo,
      locations: worldData.locations,
      items: worldData.items,
      specialActions: worldData.specialActions,
      startLocation: worldData.startLocation
    }, null, 2))
    setJsonEditorOpen(true)
  }

  const handleJsonSave = () => {
    try {
      const data = JSON.parse(jsonContent)
      setWorldData(prev => ({
        ...prev,
        ...data
      }))
      setJsonEditorOpen(false)
      toast.success('World data updated!')
    } catch (error) {
      toast.error('Invalid JSON format')
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Basic Info
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="World Name"
                value={worldData.worldInfo.name}
                onChange={(e) => setWorldData(prev => ({
                  ...prev,
                  worldInfo: { ...prev.worldInfo, name: e.target.value }
                }))}
                placeholder="The Enchanted Forest"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={worldData.worldInfo.description}
                onChange={(e) => setWorldData(prev => ({
                  ...prev,
                  worldInfo: { ...prev.worldInfo, description: e.target.value }
                }))}
                placeholder="A mystical forest filled with ancient magic and hidden treasures..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Author Name"
                value={worldData.worldInfo.author}
                onChange={(e) => setWorldData(prev => ({
                  ...prev,
                  worldInfo: { ...prev.worldInfo, author: e.target.value }
                }))}
                placeholder="Your name"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Version"
                value={worldData.worldInfo.version}
                onChange={(e) => setWorldData(prev => ({
                  ...prev,
                  worldInfo: { ...prev.worldInfo, version: e.target.value }
                }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tags (press Enter to add)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {worldData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => setWorldData(prev => ({
                      ...prev,
                      tags: prev.tags.filter((_, i) => i !== index)
                    }))}
                  />
                ))}
              </Box>
              <TextField
                fullWidth
                placeholder="Add tags (fantasy, mystery, adventure...)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const tag = e.target.value.trim()
                    if (tag && !worldData.tags.includes(tag)) {
                      setWorldData(prev => ({
                        ...prev,
                        tags: [...prev.tags, tag]
                      }))
                      e.target.value = ''
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={worldData.isPublic}
                    onChange={(e) => setWorldData(prev => ({
                      ...prev,
                      isPublic: e.target.checked
                    }))}
                  />
                }
                label="Make this world public"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Or Upload Existing World File
              </Typography>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a world file here'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to select a JSON file
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )

      case 1: // Build World
        return (
          <Box>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
              <Tab label="Add Location" />
              <Tab label="Manage Locations" />
              <Tab label="Items & Actions" />
            </Tabs>

            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location ID"
                    value={currentLocation.id}
                    onChange={(e) => setCurrentLocation(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="forest_entrance"
                    disabled={!!editingLocation}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location Name"
                    value={currentLocation.name}
                    onChange={(e) => setCurrentLocation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Forest Entrance"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={currentLocation.description}
                    onChange={(e) => setCurrentLocation(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="You stand at the edge of a dark forest..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Choices
                  </Typography>
                  
                  <List>
                    {currentLocation.choices.map((choice, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={choice.text}
                          secondary={`${choice.action} → ${choice.target}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => setCurrentLocation(prev => ({
                              ...prev,
                              choices: prev.choices.filter((_, i) => i !== index)
                            }))}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Choice Text"
                        value={currentChoice.text}
                        onChange={(e) => setCurrentChoice(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Enter the forest"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        select
                        label="Action"
                        value={currentChoice.action}
                        onChange={(e) => setCurrentChoice(prev => ({ ...prev, action: e.target.value }))}
                        SelectProps={{ native: true }}
                      >
                        <option value="move">Move</option>
                        <option value="examine">Examine</option>
                        <option value="use">Use</option>
                        <option value="take">Take</option>
                        <option value="special">Special</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Target"
                        value={currentChoice.target}
                        onChange={(e) => setCurrentChoice(prev => ({ ...prev, target: e.target.value }))}
                        placeholder="forest_path"
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleAddChoice}
                        sx={{ height: '56px' }}
                      >
                        <AddIcon />
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={editingLocation ? handleUpdateLocation : handleAddLocation}
                    startIcon={editingLocation ? <SaveIcon /> : <AddIcon />}
                    fullWidth
                  >
                    {editingLocation ? 'Update Location' : 'Add Location'}
                  </Button>
                  {editingLocation && (
                    <Button
                      size="large"
                      onClick={() => {
                        setEditingLocation(null)
                        setCurrentLocation({
                          id: '',
                          name: '',
                          description: '',
                          choices: []
                        })
                      }}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && (
              <Box>
                <TextField
                  fullWidth
                  select
                  label="Start Location"
                  value={worldData.startLocation}
                  onChange={(e) => setWorldData(prev => ({ ...prev, startLocation: e.target.value }))}
                  SelectProps={{ native: true }}
                  sx={{ mb: 3 }}
                >
                  <option value="">Select start location</option>
                  {Object.keys(worldData.locations).map(locationId => (
                    <option key={locationId} value={locationId}>
                      {worldData.locations[locationId].name}
                    </option>
                  ))}
                </TextField>
                
                {Object.entries(worldData.locations).length === 0 ? (
                  <Alert severity="info">
                    No locations added yet. Add locations in the "Add Location" tab.
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {Object.entries(worldData.locations).map(([locationId, location]) => (
                      <Grid item xs={12} md={6} key={locationId}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {location.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                              ID: {locationId}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                              {location.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {location.choices.length} choices
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditLocation(locationId)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteLocation(locationId)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {tabValue === 2 && (
              <Alert severity="info">
                Items and special actions can be added by editing the JSON directly or will be available in a future update.
              </Alert>
            )}
          </Box>
        )

      case 2: // Review & Publish
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your world is ready to publish! Review the details below.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    {worldData.worldInfo.name}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {worldData.worldInfo.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {worldData.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Locations
                      </Typography>
                      <Typography variant="h6">
                        {Object.keys(worldData.locations).length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Start Location
                      </Typography>
                      <Typography variant="h6">
                        {worldData.locations[worldData.startLocation]?.name || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Visibility
                      </Typography>
                      <Typography variant="h6">
                        {worldData.isPublic ? 'Public' : 'Private'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="h6">
                        {worldData.worldInfo.version}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={() => setPreviewOpen(true)}
                  >
                    Preview World
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CodeIcon />}
                    onClick={openJsonEditor}
                  >
                    Edit JSON
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={downloadWorldFile}
                  >
                    Download File
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
          Create Your World
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              size="large"
              onClick={handlePublish}
              disabled={uploading}
              startIcon={<CloudUploadIcon />}
            >
              {uploading ? 'Publishing...' : 'Publish World'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setActiveStep(prev => prev + 1)}
              disabled={
                activeStep === 0 && !worldData.worldInfo.name ||
                activeStep === 1 && Object.keys(worldData.locations).length === 0
              }
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>World Preview</DialogTitle>
        <DialogContent>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify({
              worldInfo: worldData.worldInfo,
              locations: worldData.locations,
              items: worldData.items,
              specialActions: worldData.specialActions,
              startLocation: worldData.startLocation
            }, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* JSON Editor Dialog */}
      <Dialog
        open={jsonEditorOpen}
        onClose={() => setJsonEditorOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Edit World JSON</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJsonEditorOpen(false)}>Cancel</Button>
          <Button onClick={handleJsonSave} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CreateWorldPage