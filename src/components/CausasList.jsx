import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  CircularProgress, 
  Alert, 
  Fab, 
  Tooltip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = import.meta.env.VITE_URL_BACKEND;

function CausasList() {
  const [causas, setCausas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async (id_causa) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta causa? Esta acción no se puede deshacer.')) {
      setDeleteLoading(true);
      try {
        await axios.delete(`${API_URL}/causas/${id_causa}/`, { 
          headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } 
        });
        // Actualizar la lista de causas después de eliminar
        const updatedCausas = causas.filter(causa => causa.id_causa !== id_causa);
        setCausas(updatedCausas);
      } catch (error) {
        setError('Error al eliminar la causa');
        console.error('Error al eliminar la causa:', error);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  useEffect(() => {
    axios.get(`${API_URL}/causas/`, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } })
      .then(res => setCausas(res.data))
      .catch(() => setError('No se pudieron cargar las causas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
      <CircularProgress />
    </Box>
  );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: '80%', mx: 'auto', py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Causas</Typography>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Creada</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Actualizada</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {causas.map((causa, idx) => (
              <TableRow key={causa.id_causa} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fafbfc' : '#f5f5f7', transition: 'background 0.2s', borderBottom: '1px solid #e0e0e0' }}>
                <TableCell sx={{ fontWeight: 500 }}>{causa.id_causa}</TableCell>
                <TableCell>{causa.titulo}</TableCell>
                <TableCell>{causa.estado}</TableCell>
                <TableCell>{causa.tipo}</TableCell>
                <TableCell>{causa.fecha_creacion ? new Date(causa.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                <TableCell>{causa.fecha_ultima_actualizacion ? new Date(causa.fecha_ultima_actualizacion).toLocaleDateString('es-ES') : 'N/A'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver">
                      <Button 
                        variant="outlined" 
                        size="small" 
                        color="success"
                        sx={{ minWidth: 'auto', p: 1, borderRadius: 2, '&:hover': { backgroundColor: 'rgba(46, 125, 50, 0.04)' } }}
                        onClick={() => navigate(`/ver/${causa.id_causa}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <Button 
                        variant="outlined" 
                        size="small" 
                        color="primary" 
                        sx={{ minWidth: 'auto', p: 1, borderRadius: 2 }}
                        onClick={() => navigate(`/editar/${causa.id_causa}`)}
                      >
                        <EditIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <Button 
                        variant="outlined" 
                        size="small" 
                        color="error"
                        disabled={deleteLoading}
                        sx={{ minWidth: 'auto', p: 1, borderRadius: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(causa.id_causa);
                        }}
                      >
                        {deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" />}
                      </Button>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Tooltip title="Agregar Causa" placement="left">
        <Fab 
          color="primary" 
          aria-label="add" 
          onClick={() => navigate('/nueva')}
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}

export default CausasList;
