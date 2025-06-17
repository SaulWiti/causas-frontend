import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Grid, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:8000/causas/';

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

  useEffect(() => {
    if (id_causa) {
      axios.get(`${API_URL}${id_causa}/`, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } })
        .then(res => setCausa(res.data))
        .catch(() => setError('No se pudo cargar la causa'))
        .finally(() => setLoading(false));
    } else {
      // Obtener el próximo id_causa solo en modo creación
      axios.get(`${API_URL}proximo/id/`, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } })
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (id_causa) {
        await axios.put(`${API_URL}${id_causa}/`, causa, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } });
      } else {
        await axios.post(API_URL, causa, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } });
      }
      navigate('/');
    } catch (err) {
      setError('Error al guardar la causa');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}${id_causa}/`, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } });
      setDeleteDialog(false);
      navigate('/');
    } catch {
      setError('Error al eliminar la causa');
    }
  };

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Paper sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>{id_causa ? 'Editar Causa' : 'Nueva Causa'}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="ID Causa" name="id_causa" value={causa.id_causa} onChange={handleChange} fullWidth required disabled={!!id_causa} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Título" name="titulo" value={causa.titulo} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descripción" name="descripcion" value={causa.descripcion} onChange={handleChange} fullWidth required multiline rows={2} />
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
            <TextField label="Nombre" value={causa.partes.demandante.nombre} onChange={e => handlePartChange('demandante', 'nombre', e.target.value)} fullWidth sx={{ mb: 1 }} />
            <TextField label="RUT" value={causa.partes.demandante.rut} onChange={e => handlePartChange('demandante', 'rut', e.target.value)} fullWidth sx={{ mb: 1 }} />
            <TextField label="Abogado" value={causa.partes.demandante.abogado} onChange={e => handlePartChange('demandante', 'abogado', e.target.value)} fullWidth sx={{ mb: 1 }} />
            <TextField label="Contacto" value={causa.partes.demandante.contacto} onChange={e => handlePartChange('demandante', 'contacto', e.target.value)} fullWidth />
          </Grid>

          {/* Demandado */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Demandado</Typography>
            <TextField label="Nombre" value={causa.partes.demandado.nombre} onChange={e => handlePartChange('demandado', 'nombre', e.target.value)} fullWidth sx={{ mb: 1 }} />
            <TextField label="RUT" value={causa.partes.demandado.rut} onChange={e => handlePartChange('demandado', 'rut', e.target.value)} fullWidth sx={{ mb: 1 }} />
            <TextField label="Abogado" value={causa.partes.demandado.abogado} onChange={e => handlePartChange('demandado', 'abogado', e.target.value)} fullWidth sx={{ mb: 1 }} />
            <TextField label="Contacto" value={causa.partes.demandado.contacto} onChange={e => handlePartChange('demandado', 'contacto', e.target.value)} fullWidth />
          </Grid>

          {/* Tribunal */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">Tribunal</Typography>
            <TextField label="Nombre" value={causa.tribunal.nombre} onChange={e => handleTribunalChange('nombre', e.target.value)} fullWidth sx={{ mb: 1 }} />
            <TextField label="Rol Tribunal" value={causa.tribunal.rol_tribunal} onChange={e => handleTribunalChange('rol_tribunal', e.target.value)} fullWidth />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Notas" name="notas" value={causa.notas} onChange={handleChange} fullWidth multiline rows={2} />
            <TextField label="Usuario Responsable" name="usuario_responsable" value={causa.usuario_responsable} onChange={handleChange} fullWidth sx={{ mt: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" sx={{ mt: 2 }}>
              {id_causa ? 'Guardar cambios' : 'Crear causa'}
            </Button>
            {id_causa && (
              <Button variant="outlined" color="error" sx={{ mt: 2, ml: 2 }} onClick={() => setDeleteDialog(true)}>
                Eliminar causa
              </Button>
            )}
          </Grid>
        </Grid>
      </form>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>¿Eliminar causa?</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro que deseas eliminar esta causa? Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default CausaForm;
