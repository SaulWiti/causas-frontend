import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box,
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL_BACKEND;

function emptyCausa() {
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
  };
}

const estados = ['ingresada', 'en_tramite', 'resuelta', 'archivada'];
const tipos = ['civil', 'penal', 'laboral', 'familia'];

function CausaForm() {
  const { id_causa } = useParams();
  const navigate = useNavigate();
  const [causa, setCausa] = useState(emptyCausa());
  const [loading, setLoading] = useState(Boolean(id_causa));
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const isViewMode = new URLSearchParams(window.location.search).get('mode') === 'view';

  useEffect(() => {
    if (id_causa) {
      axios.get(`${API_URL}/causas/${id_causa}/`, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } })
        .then(res => setCausa(res.data))
        .catch(() => setError('No se pudo cargar la causa'))
        .finally(() => setLoading(false));
    } else {
      // Obtener el próximo id_causa solo en modo creación
      axios.get(`${API_URL}/causas/proximo/id/`, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } })
        .then(res => {
          setCausa(prev => ({ ...prev, id_causa: res.data.proximo_id }));
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
      navigate('/causas');
      return;
    }
    
    setLoading(true);
    
    const method = id_causa ? 'put' : 'post';
    const url = id_causa ? `${API_URL}/causas/${id_causa}` : `${API_URL}/causas/`;
    
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
      headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH }
    })
    .then(() => navigate('/causas'))
    .catch(err => {
      setError(err.response?.data?.detail || 'Error al guardar la causa');
      console.error(err);
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
    <Box sx={{ width: '80%', mx: 'auto', py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">
            {id_causa ? (isViewMode ? 'Ver Causa' : 'Editar Causa') : 'Nueva Causa'}
          </Typography>
          {isViewMode && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/editar/${id_causa}`)}
            >
              Editar
            </Button>
          )}
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': { mb: 2 } }}>
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

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
              <Button 
                variant="contained" 
                color="primary" 
                type="submit" 
                disabled={loading || isViewMode}
              >
                {loading ? <CircularProgress size={24} /> : (id_causa ? 'Guardar cambios' : 'Crear causa')}
              </Button>
              {id_causa && !isViewMode && (
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setDeleteDialog(true)}
                  disabled={loading}
                >
                  Eliminar
                </Button>
              )}
            </Grid>
          </Grid>
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
  );
}

export default CausaForm;
