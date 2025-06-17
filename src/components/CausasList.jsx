import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Fab, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const API_URL = 'http://localhost:8000/causas/';

function CausasList() {
  const [causas, setCausas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(API_URL, { headers: { 'api-key-auth': import.meta.env.VITE_API_KEY_AUTH } })
      .then(res => setCausas(res.data))
      .catch(() => setError('No se pudieron cargar las causas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <Typography variant="h4" gutterBottom>Listado de Causas</Typography>
      <TableContainer component={Paper} sx={{ mt: 4, borderRadius: 2, boxShadow: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#222' }}>Tipo</TableCell>
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
                <TableCell>
                  <Button variant="outlined" size="small" color="primary" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 500 }} onClick={() => navigate(`/editar/${causa.id_causa}`)}>
                    Ver / Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Tooltip title="Nueva Causa" placement="left">
        <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }} onClick={() => navigate('/nueva')}>
          <AddIcon />
        </Fab>
      </Tooltip>
    </>
  );
}

export default CausasList;
