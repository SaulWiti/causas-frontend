import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, IconButton, Tooltip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GavelIcon from '@mui/icons-material/Gavel';
import CausasList from './components/CausasList';
import CausaForm from './components/CausaForm';

function App() {
  const navigate = useNavigate();
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }} onClick={() => navigate('/')}> 
            <GavelIcon sx={{ mr: 1, fontSize: 28 }} /> Demo Causas
          </Typography>

          <Tooltip title="Witi.cl" arrow>
            <IconButton color="inherit" sx={{ ml: 2 }}>
              <AccountCircleIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 10 }}>
        <Routes>
          <Route path="/" element={<CausasList />} />
          <Route path="/nueva" element={<CausaForm />} />
          <Route path="/editar/:id_causa" element={<CausaForm />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
