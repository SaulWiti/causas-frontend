import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  MenuItem, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  CircularProgress, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  CardHeader,
  Avatar,
  Paper,
  Menu,
  MenuItem as MuiMenuItem
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import TareaForm from './TareaForm';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL_BACKEND;

function emptyCausa() {
  const now = new Date().toISOString();
  return {
    id_causa: '',
    titulo: '',
    descripcion: '',
    estado: 'ingresada',
    tipo: 'civil',
    partes: {
      demandante: { nombre: '', rut: '', abogado: '', contacto: '' },
      demandado: { nombre: '', rut: '', abogado: '', contacto: '' },
    },
    tribunal: { nombre: '', rol_tribunal: '' },
    notas: '',
    usuario_responsable: '',
    fecha_creacion: now,
    fecha_ultima_actualizacion: now
  };
}

const estados = ['ingresada', 'en_tramite', 'resuelta', 'archivada'];
const tipos = ['civil', 'penal', 'laboral', 'familia'];

// Estado inicial para las tareas
const tareasIniciales = [];

function CausaForm() {
  const { id_causa } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [causa, setCausa] = useState(emptyCausa());
  const [loading, setLoading] = useState(Boolean(id_causa));
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [tareas, setTareas] = useState(tareasIniciales);
  const [cargandoTareas, setCargandoTareas] = useState(false);
  const [showTareaForm, setShowTareaForm] = useState(false);
  const [selectedTareaId, setSelectedTareaId] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const menuAbierto = Boolean(menuAnchorEl);
  const isViewMode = location.pathname.startsWith('/ver/');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const cargarTareas = (idCausa) => {
    if (!idCausa) return;
    
    setCargandoTareas(true);
    axios.get(`${API_URL}/tareas/causa/${idCausa}/`, { 
      headers: { 
        'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log('Tareas cargadas:', res.data);
        setTareas(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error('Error cargando tareas:', err);
        setError('No se pudieron cargar las tareas');
        setTareas([]);
      })
      .finally(() => setCargandoTareas(false));
  };

  const handleNuevaTarea = () => {
    setSelectedTareaId('nueva');
    setShowTareaForm(true);
  };

  const handleAbrirMenuTarea = (event, tarea) => {
    event.stopPropagation();
    setTareaSeleccionada(tarea);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCerrarMenuTarea = () => {
    setMenuAnchorEl(null);
    setTareaSeleccionada(null);
  };

  const handleEditarTarea = (idTarea) => {
    setSelectedTareaId(idTarea);
    setShowTareaForm(true);
    handleCerrarMenuTarea();
  };

  const handleEliminarTarea = async () => {
    if (!tareaSeleccionada) return;
    
    try {
      await axios.delete(`${API_URL}/tareas/${tareaSeleccionada.id_tarea}`, {
        headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH }
      });
      
      // Actualizar la lista de tareas
      setTareas(tareas.filter(t => t.id_tarea !== tareaSeleccionada.id_tarea));
      
    } catch (error) {
      console.error('Error al eliminar la tarea:', error);
      setError('Error al eliminar la tarea');
    } finally {
      handleCerrarMenuTarea();
    }
  };

  const handleVerTarea = (idTarea) => {
    setSelectedTareaId(idTarea);
    setShowTareaForm(true);
  };

  const handleTareaSaved = () => {
    cargarTareas(id_causa);
    setShowTareaForm(false);
    setSelectedTareaId(null);
  };

  const handleCancelTarea = () => {
    setShowTareaForm(false);
    setSelectedTareaId(null);
  };

  useEffect(() => {
    console.log('id_causa:', id_causa);
    console.log('isViewMode:', isViewMode);
    
    if (id_causa) {
      console.log('Fetching cause with id:', id_causa);
      setLoading(true);
      
      // Cargar datos de la causa
      axios.get(`${API_URL}/causas/${id_causa}/`, { 
        headers: { 
          'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
          'Content-Type': 'application/json'
        },
        params: { id_causa }
      })
        .then(res => {
          console.log('Response data:', res.data);
          setCausa(res.data);
          // Una vez cargada la causa, cargar las tareas
          cargarTareas(id_causa);
        })
        .catch(err => {
          console.error('Error fetching cause:', err);
          setError('No se pudo cargar la causa');
        })
        .finally(() => setLoading(false));
    } else {
      console.log('No id_causa, fetching next available ID');
      // Obtener el próximo id_causa solo en modo creación
      axios.get(`${API_URL}/causas/proximo/id/`, { 
        headers: { 
          'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
          'Content-Type': 'application/json'
        } 
      })
        .then(res => {
          console.log('Next ID:', res.data.proximo_id);
          setCausa(prev => ({ ...prev, id_causa: res.data.proximo_id }));
        })
        .catch(err => {
          console.error('Error fetching next ID:', err);
          setError('No se pudo obtener el próximo ID');
        });
    }
  }, [id_causa]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCausa(prev => ({ ...prev, [name]: value }));
  };

  const handlePartChange = (part, field, value) => {
    setCausa(prev => ({
      ...prev,
      partes: {
        ...prev.partes,
        [part]: { ...prev.partes[part], [field]: value }
      }
    }));
  };

  const handleTribunalChange = (field, value) => {
    setCausa(prev => ({
      ...prev,
      tribunal: { ...prev.tribunal, [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Si está en modo vista, no hacer nada al enviar el formulario
    if (isViewMode) {
      navigate('/');
      return;
    }
    
    setLoading(true);
    
    const method = id_causa ? 'put' : 'post';
    const url = id_causa ? `${API_URL}/causas/${id_causa}/` : `${API_URL}/causas/`;
    
    // Crear una copia del objeto causa para evitar modificar el estado directamente
    const causaToSend = JSON.parse(JSON.stringify(causa));
    
    // Eliminar campos vacíos de las partes
    Object.keys(causaToSend.partes).forEach(parte => {
      Object.keys(causaToSend.partes[parte]).forEach(campo => {
        if (causaToSend.partes[parte][campo] === '') {
          delete causaToSend.partes[parte][campo];
        }
      });
    });
    
    // Eliminar campos vacíos del tribunal
    Object.keys(causaToSend.tribunal).forEach(campo => {
      if (causaToSend.tribunal[campo] === '') {
        delete causaToSend.tribunal[campo];
      }
    });

    axios({
      method,
      url,
      data: causaToSend,
      headers: { 
        'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
        'Content-Type': 'application/json'
      }
    })
    .then(() => navigate('/'))
    .catch(err => {
      console.error('Error al guardar la causa:', err);
      
      // Manejar error de validación 422
      if (err.response?.status === 422 && err.response?.data?.detail) {
        // Si el detalle es un array, extraer los mensajes
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map(error => 
            `• ${error.loc?.join('.') || 'Error'}: ${error.msg || 'Error de validación'}`
          ).join('\n');
          setError(`No se pudo guardar la causa. Faltan campos por completar.`);
        } 
        // Si es un string, mostrarlo directamente
        else if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        }
        // Si es un objeto, intentar mostrarlo de manera legible
        else if (typeof err.response.data.detail === 'object') {
          setError(JSON.stringify(err.response.data.detail, null, 2));
        }
      } 
      // Manejar otros tipos de errores
      else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } 
      else if (err.response?.data?.message) {
        setError(err.response.data.message);
      }
      else {
        setError('Error al guardar la causa. Por favor, intente nuevamente.');
      }
    })
    .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/causas/${id_causa}/`, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } });
      setDeleteDialog(false);
      navigate('/');
    } catch {
      setError('Error al eliminar la causa');
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ 
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      pt: '64px', // Add padding for the AppBar
      boxSizing: 'border-box'
    }}>
      <Box sx={{ 
        width: '90%',
        maxWidth: '1600px',
        mx: 'auto',
        py: 2,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <Paper sx={{ 
          p: 4,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 3,
            flexShrink: 0
          }}>
            {id_causa ? (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {isViewMode ? (
                    <VisibilityIcon color="action" sx={{ fontSize: 28 }} />
                  ) : (
                    <EditIcon color="primary" sx={{ fontSize: 28 }} />
                  )}
                  <Typography variant="h4" component="span">
                    {causa.id_causa}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.5
                  }}>
                    <EventIcon color="primary" sx={{ mr: 0.8, fontSize: '1.1rem' }} />
                    <Typography variant="body2" color="primary">
                      Creada: {new Date(causa.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                  
                  {causa.fecha_ultima_actualizacion && (
                    <Box sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(158, 158, 158, 0.08)',
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.5
                    }}>
                      <AccessTimeIcon color="action" sx={{ mr: 0.8, fontSize: '1.1rem' }} />
                      <Typography variant="body2" color="text.secondary">
                        Actualizada: {new Date(causa.fecha_ultima_actualizacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Typography variant="h4">Nueva Causa</Typography>
            )}
            {isViewMode && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/editar/${id_causa}`)}
                sx={{
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
                aria-label="Editar causa"
              >
                <EditIcon />
              </Button>
            )}
          </Box>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                flexShrink: 0,
                whiteSpace: 'pre-line',
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          {/* Pestañas */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="pestañas de causa"
            >
              <Tab label="Causa" id="tab-causa" aria-controls="tabpanel-causa" />
              <Tab label="Tareas" id="tab-tareas" aria-controls="tabpanel-tareas" />
            </Tabs>
          </Box>
          
          {/* Contenido de las pestañas */}
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Pestaña de Causa */}
            <Box
              role="tabpanel"
              hidden={tabValue !== 0}
              id="tabpanel-causa"
              aria-labelledby="tab-causa"
              sx={{ flex: 1, overflow: 'auto' }}
            >
              <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ 
                  '& .MuiTextField-root': { 
                    mb: 2 
                  } 
                }}
              >
                <Box sx={{ 
                  overflowY: 'auto', 
                  pr: 2, 
                  flex: 1, 
                  py: 2,
                  pb: 4,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  }
                }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Causa"
                value={causa.id_causa || '(Autogenerado)'}
                disabled
                InputProps={{
                  readOnly: true,
                }}
                helperText="El ID es autogenerado por el sistema"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Título"
                value={causa.titulo}
                onChange={(e) => setCausa({...causa, titulo: e.target.value})}
                required
                disabled={isViewMode}
                InputProps={{
                  readOnly: isViewMode,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción"
                value={causa.descripcion}
                onChange={(e) => setCausa({...causa, descripcion: e.target.value})}
                disabled={isViewMode}
                InputProps={{
                  readOnly: isViewMode,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Estado" name="estado" value={causa.estado} onChange={handleChange} fullWidth SelectProps={{ native: true }}>
                {estados.map(e => <option key={e} value={e}>{e}</option>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Tipo" name="tipo" value={causa.tipo} onChange={handleChange} fullWidth SelectProps={{ native: true }}>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </TextField>
            </Grid>

            {/* Demandante */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Demandante</Typography>
              <TextField label="Nombre" value={causa.partes.demandante.nombre} onChange={e => handlePartChange('demandante', 'nombre', e.target.value)} fullWidth sx={{ mb: 1 }} disabled={isViewMode} />
              <TextField label="RUT" value={causa.partes.demandante.rut} onChange={e => handlePartChange('demandante', 'rut', e.target.value)} fullWidth sx={{ mb: 1 }} disabled={isViewMode} />
              <TextField label="Abogado" value={causa.partes.demandante.abogado} onChange={e => handlePartChange('demandante', 'abogado', e.target.value)} fullWidth sx={{ mb: 1 }} disabled={isViewMode} />
              <TextField label="Contacto" value={causa.partes.demandante.contacto} onChange={e => handlePartChange('demandante', 'contacto', e.target.value)} fullWidth disabled={isViewMode} />
            </Grid>

            {/* Demandado */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Demandado</Typography>
              <TextField label="Nombre" value={causa.partes.demandado.nombre} onChange={e => handlePartChange('demandado', 'nombre', e.target.value)} fullWidth sx={{ mb: 1 }} disabled={isViewMode} />
              <TextField label="RUT" value={causa.partes.demandado.rut} onChange={e => handlePartChange('demandado', 'rut', e.target.value)} fullWidth sx={{ mb: 1 }} disabled={isViewMode} />
              <TextField label="Abogado" value={causa.partes.demandado.abogado} onChange={e => handlePartChange('demandado', 'abogado', e.target.value)} fullWidth sx={{ mb: 1 }} disabled={isViewMode} />
              <TextField label="Contacto" value={causa.partes.demandado.contacto} onChange={e => handlePartChange('demandado', 'contacto', e.target.value)} fullWidth disabled={isViewMode} />
            </Grid>

            {/* Tribunal */}
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1">Tribunal</Typography>
              <TextField label="Nombre" value={causa.tribunal.nombre} onChange={e => handleTribunalChange('nombre', e.target.value)} fullWidth sx={{ mb: 1 }} disabled={isViewMode} />
              <TextField label="Rol Tribunal" value={causa.tribunal.rol_tribunal} onChange={e => handleTribunalChange('rol_tribunal', e.target.value)} fullWidth disabled={isViewMode} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Notas" name="notas" value={causa.notas} onChange={handleChange} fullWidth multiline rows={2} disabled={isViewMode} />
              <TextField label="Usuario Responsable" name="usuario_responsable" value={causa.usuario_responsable} onChange={handleChange} fullWidth sx={{ mt: 2 }} disabled={isViewMode} />
            </Grid>

            <Grid item xs={12} sx={{ 
              mt: 2, 
              mb: 4, // Add bottom margin to the button container
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-start' 
            }}>
              <Button 
                variant="contained" 
                color="primary" 
                type="submit" 
                disabled={loading || isViewMode}
              >
                {loading ? <CircularProgress size={24} /> : (id_causa ? 'Guardar cambios' : 'Crear causa')}
              </Button>
              {id_causa && !isViewMode && (
                <Tooltip title="Eliminar" arrow>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteDialog(true)}
                    disabled={loading}
                    sx={{
                      minWidth: '40px',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      padding: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.04)'
                      }
                    }}
                    aria-label="Eliminar causa"
                  >
                    <DeleteIcon />
                  </Button>
                </Tooltip>
              )}
            </Grid>
                  </Grid>
                </Box>
              </Box>
            </Box>
            
            {/* Pestaña de Tareas */}
            <Box
              role="tabpanel"
              hidden={tabValue !== 1}
              id="tabpanel-tareas"
              aria-labelledby="tab-tareas"
              sx={{ flex: 1, overflow: 'auto', p: 2 }}
            >
              {showTareaForm ? (
                <TareaForm 
                  id_tarea={selectedTareaId}
                  id_causa={id_causa}
                  isViewMode={isViewMode}
                  onSave={handleTareaSaved}
                  onCancel={handleCancelTarea}
                  tareas={tareas}
                />
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Card>
                    <CardHeader
                      title="Tareas"
                      action={
                        !isViewMode && (
                          <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<AddIcon />}
                            onClick={handleNuevaTarea}
                          >
                            Nueva Tarea
                          </Button>
                        )
                      }
                    />
                    <CardContent>
                      {cargandoTareas ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <CircularProgress />
                        </Box>
                      ) : tareas.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                          No hay tareas registradas para esta causa
                        </Box>
                      ) : (
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                          {tareas.map((tarea) => (
                            <ListItem
                              key={tarea.id_tarea}
                              button
                              onClick={() => isViewMode ? handleVerTarea(tarea.id_tarea) : handleEditarTarea(tarea.id_tarea)}
                              secondaryAction={
                                <IconButton 
                                  edge="end" 
                                  aria-label="opciones"
                                  onClick={(e) => handleAbrirMenuTarea(e, tarea)}
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              }
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'action.hover',
                                  cursor: 'pointer'
                                }
                              }}
                            >
                              <ListItemIcon>
                                <Checkbox
                                  edge="start"
                                  checked={tarea.estado === 'completada'}
                                  tabIndex={-1}
                                  disableRipple
                                  disabled={isViewMode}
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={tarea.nombre}
                                secondary={
                                  <>
                                    <Box component="span" display="block">{tarea.descripcion}</Box>
                                    <Box component="span" display="block" sx={{ mt: 0.5 }}>
                                      <Chip 
                                        label={tarea.estado.replace('_', ' ')} 
                                        size="small" 
                                        color={
                                          tarea.estado === 'completada' ? 'success' : 
                                          tarea.estado === 'en_proceso' ? 'primary' : 'default'
                                        }
                                        variant="outlined"
                                        sx={{ mr: 1 }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        Actualizada: {new Date(tarea.fecha_ultima_actualizacion).toLocaleString('es-ES')}
                                      </Typography>
                                    </Box>
                                  </>
                                }
                                primaryTypographyProps={{
                                  style: {
                                    textDecoration: tarea.estado === 'completada' ? 'line-through' : 'none',
                                    color: tarea.estado === 'completada' ? 'text.secondary' : 'text.primary',
                                    fontWeight: 500
                                  }
                                }}
                                sx={{ my: 1 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                      
                      {/* Menú de opciones de tarea */}
                      <Menu
                        id="menu-tarea"
                        anchorEl={menuAnchorEl}
                        open={menuAbierto}
                        onClose={handleCerrarMenuTarea}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MuiMenuItem onClick={() => handleEditarTarea(tareaSeleccionada?.id_tarea)}>
                          <ListItemIcon>
                            <EditIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Editar</ListItemText>
                        </MuiMenuItem>
                        <MuiMenuItem onClick={handleEliminarTarea} sx={{ color: 'error.main' }}>
                          <ListItemIcon sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>Eliminar</ListItemText>
                        </MuiMenuItem>
                      </Menu>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          </Box>

          {/* Diálogo de confirmación para eliminar */}
          <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
              <Typography>¿Estás seguro de que deseas eliminar esta causa? Esta acción no se puede deshacer.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
              <Button 
                onClick={handleDelete} 
                color="error"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Eliminar'}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Box>
  );
}

export default CausaForm;
