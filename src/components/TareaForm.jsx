import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL_BACKEND;

const estadosTarea = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'completada', label: 'Completada' }
];

function TareaForm({ id_causa, id_tarea, isViewMode, onSave, onCancel, tareas = [] }) {
  const isEditMode = id_tarea && id_tarea !== 'nueva';
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tarea, setTarea] = useState({
    id_causa: id_causa || '',  // Formato: C-2024-001
    id_tarea: null,  // Se genera en el backend
    nombre: '',
    descripcion: '',
    respuestas: '',
    estado: 'pendiente',
    fecha_creacion: null,  // Se establece en el backend
    fecha_ultima_actualizacion: null  // Se actualiza en el backend
  });

  useEffect(() => {
    if (isEditMode) {
      cargarTarea();
    } else if (!id_tarea) {
      // Resetear el formulario para nueva tarea
      setTarea({
        id_causa: id_causa || '',
        id_tarea: null,
        nombre: '',
        descripcion: '',
        respuestas: '',
        estado: 'pendiente',
        fecha_creacion: null,
        fecha_ultima_actualizacion: null
      });
    }
  }, [id_tarea, id_causa, isEditMode]);

  const cargarTarea = async () => {
    try {
      // Si estamos en modo edición, intentamos obtener la tarea de la lista primero
      if (isEditMode && tareas && tareas.length > 0) {
        const tareaExistente = tareas.find(t => t.id_tarea === id_tarea);
        if (tareaExistente) {
          setTarea(tareaExistente);
          setLoading(false);
          return;
        }
      }
      
      // Si no encontramos la tarea en la lista o no estamos en modo edición, la cargamos del servidor
      const response = await axios.get(`${API_URL}/tareas/${id_tarea}`, {
        headers: { 
          'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
          'Content-Type': 'application/json'
        }
      });
      setTarea(response.data);
    } catch (err) {
      console.error('Error cargando tarea:', err);
      setError('No se pudo cargar la tarea. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTarea(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validar que el id_causa tenga el formato correcto
      if (!/^C-\d{4}-\d{3}$/.test(tarea.id_causa)) {
        throw new Error('El ID de causa no tiene el formato correcto (ej: C-2024-001)');
      }

      // Validar campos requeridos
      if (!tarea.nombre.trim()) {
        throw new Error('El nombre de la tarea es requerido');
      }

      // Preparar datos para enviar
      const tareaData = {
        id_causa: tarea.id_causa,
        nombre: tarea.nombre,
        descripcion: tarea.descripcion || "",
        respuestas: tarea.respuestas || "",
        estado: tarea.estado || "pendiente"
      };

      // Solo incluimos id_tarea si estamos editando
      if (isEditMode && tarea.id_tarea) {
        tareaData.id_tarea = tarea.id_tarea;
      }

      const url = isEditMode 
        ? `${API_URL}/tareas/${id_tarea}/`  // Agregamos la barra al final para consistencia con la API
        : `${API_URL}/tareas/`;
      
      // Usamos PATCH para actualizaciones parciales (solo envía los campos modificados)
      // y POST para crear nuevas tareas
      const method = isEditMode ? 'patch' : 'post';
      
      const response = await axios({
        method,
        url,
        data: tareaData,
        headers: { 
          'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
          'Content-Type': 'application/json'
        }
      });

      if (onSave) {
        onSave(response.data);
      }
    } catch (err) {
      console.error('Error guardando tarea:', err);
      // Manejar diferentes formatos de error
      let errorMessage = 'Error al guardar la tarea';
      
      if (err.response) {
        // Si el servidor devuelve un mensaje de error
        if (err.response.data) {
          // Si el error es un objeto con mensajes de validación
          if (typeof err.response.data === 'object') {
            // Intentar extraer el primer mensaje de error
            const errorObj = err.response.data;
            if (errorObj.detail) {
              errorMessage = errorObj.detail;
            } else if (errorObj.message) {
              errorMessage = errorObj.message;
            } else if (Array.isArray(errorObj)) {
              errorMessage = errorObj.map(e => e.msg || e.message || JSON.stringify(e)).join('\n');
            } else {
              errorMessage = JSON.stringify(errorObj);
            }
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          }
        }
        // Si es un error 404, 500, etc.
        else if (err.response.statusText) {
          errorMessage = `${err.response.status}: ${err.response.statusText}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id_tarea || id_tarea === 'nueva') return;
    
    setLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/tareas/${id_tarea}/`, {
        headers: {
          'api-key-auth': import.meta.env.VITE_API_KEY_AUTH
        }
      });

      // Cerrar el diálogo de confirmación
      setDeleteDialogOpen(false);
      
      // Llamar a onSave con null para indicar que se eliminó la tarea
      onSave(null);
    } catch (err) {
      console.error('Error al eliminar la tarea:', err);
      setError(err.response?.data?.detail || 'Error al eliminar la tarea');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      '@media (min-width: 1200px)': {
        width: '90%',
        maxWidth: '1400px'
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={onCancel} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {isEditMode ? 'Editar Tarea' : 'Nueva Tarea'}
          </Typography>
        </Box>
        {onCancel && (
          <Button 
            variant="outlined" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            '& .MuiAlert-message': {
              whiteSpace: 'pre-line'
            }
          }}
        >
          {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
        </Alert>
      )}

      <Paper 
        component="div"
        sx={{ 
          p: 4,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Fechas de creación y actualización */}
          {id_tarea && id_tarea !== 'nueva' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3, alignItems: 'center' }}>
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
                  Creada: {new Date(tarea.fecha_creacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
              
              {tarea.fecha_ultima_actualizacion && (
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
                    Actualizada: {new Date(tarea.fecha_ultima_actualizacion).toLocaleDateString('es-ES', {
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
          )}
          
          <Grid container spacing={3} sx={{ width: '100%' }}>
            {/* Fila 1: Nombre y Estado en la misma línea */}
            <Grid item xs={12} sx={{ mt: 0 }}>
              <Grid container spacing={2} sx={{ width: '100%', alignItems: 'flex-start' }}>
                <Grid item xs={12} md={9} sx={{ mt: 0 }}>
                  <TextField
                    fullWidth
                    label="Nombre de la tarea"
                    name="nombre"
                    value={tarea.nombre}
                    onChange={handleChange}
                    required
                    disabled={isViewMode}
                    variant="outlined"
                    margin="normal"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.1rem',
                        minHeight: '56px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.23)'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1rem'
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '16.5px 14px'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3} sx={{ mt: 0, ml: 'auto'}}>
                  <FormControl variant="outlined" margin="normal" fullWidth>
                    <InputLabel id="estado-label">Estado</InputLabel>
                    <Select
                      labelId="estado-label"
                      name="estado"
                      value={tarea.estado}
                      onChange={handleChange}
                      label="Estado"
                      disabled={isViewMode}
                      required
                      sx={{
                        '& .MuiSelect-select': {
                          fontSize: '1.1rem',
                          padding: '15.5px 14px',
                          height: '56px',
                          minHeight: '56px',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          width: '100%'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          height: '56px',
                          top: 0
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1rem',
                          transform: tarea.estado ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 20px) scale(1)'
                        }
                      }}
                    >
                      {estadosTarea.map((estado) => (
                        <MenuItem key={estado.value} value={estado.value} sx={{ fontSize: '1rem' }}>
                          {estado.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Fila 2: Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={tarea.descripcion}
                onChange={handleChange}
                multiline
                rows={4}
                disabled={isViewMode}
                variant="outlined"
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.1rem',
                    minHeight: '120px',
                    alignItems: 'flex-start'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Respuestas u observaciones"
                name="respuestas"
                value={tarea.respuestas}
                onChange={handleChange}
                multiline
                rows={4}
                disabled={isViewMode}
                variant="outlined"
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.1rem',
                    minHeight: '120px',
                    alignItems: 'flex-start'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem'
                  }
                }}
              />
            </Grid>

            {!isViewMode && (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                  
                  {id_tarea && id_tarea !== 'nueva' && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={saving || isViewMode}
                      startIcon={<DeleteIcon />}
                    >
                      Eliminar
                    </Button>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="contained"
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TareaForm;
