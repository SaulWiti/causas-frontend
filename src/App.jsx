import React, { useState, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Tooltip, 
  Badge, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeIcon from '@mui/icons-material/Home';
import AddIcon from '@mui/icons-material/Add';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BalanceIcon from '@mui/icons-material/Balance';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CausasList from './components/CausasList';
import CausaForm from './components/CausaForm';
import ChatsPage from './pages/ChatsPage';
import axios from 'axios';


function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [notificaciones] = useState(0); // Inicialmente sin notificaciones
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
    setDrawerOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { text: 'Nueva Causa', icon: <AddIcon />, path: '/nueva' },
    { text: 'WhatsApp', icon: <WhatsAppIcon />, path: '/chats', badge: notificaciones },
  ];

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open !== undefined ? open : !drawerOpen);
  };

  const drawer = (
    <Box 
      sx={{ 
        width: drawerOpen ? 240 : 72,
        transition: 'width 0.3s ease-in-out',
        flexShrink: 0,
        height: '100vh',
        position: 'fixed',
        bgcolor: 'background.paper',
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        overflowX: 'hidden',
        overflowY: 'auto',
      }} 
      role="presentation" 
    >
      <Toolbar sx={{ minHeight: '80px !important' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          width: '100%',
          px: 1,
          justifyContent: drawerOpen ? 'space-between' : 'center'
        }}>
          {drawerOpen ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BalanceIcon sx={{ 
                  color: 'primary.main',
                  fontSize: 30,
                  mr: 1,
                }} />
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                  Demo Causas
                </Typography>
              </Box>
              <IconButton 
                onClick={toggleDrawer(false)} 
                size="small"
              >
                <ChevronLeftIcon />
              </IconButton>
            </>
          ) : (
            <IconButton 
              onClick={toggleDrawer(true)}
              size="small"
              sx={{ mx: 'auto' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ py: 0, width: '100%' }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              minHeight: 48,
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              px: 2.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: drawerOpen ? 3 : 'auto',
                justifyContent: 'center',
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
              }}
            >
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                opacity: drawerOpen ? 1 : 0,
                transition: 'opacity 0.3s',
                '& .MuiListItemText-primary': {
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'transparent'
    }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          width: { sm: `calc(100% - ${drawerOpen ? 240 : 72}px)` },
          marginLeft: { sm: `${drawerOpen ? 240 : 72}px` },
          transition: 'all 0.3s ease-in-out',
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menú móvil"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: 'block', sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, ml: 1 }}>
            {!drawerOpen && (
              <>
                <BalanceIcon sx={{ 
                  color: 'primary.main',
                  fontSize: 30,
                  mr: 1,
                  display: { xs: 'none', sm: 'block' }
                }} />
                <Typography 
                  variant="h6" 
                  noWrap
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'black',
                    display: { xs: 'none', sm: 'block' },
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Demo Causas
                </Typography>
              </>
            )}
          </Box>

          <Tooltip title="WhatsApp" arrow>
            <IconButton 
              onClick={() => navigate('/chats')}
              sx={{ 
                ml: 1,
                color: 'text.primary',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.75rem'
                }
              }}
            >
              <Badge badgeContent={notificaciones} color="error">
                <WhatsAppIcon fontSize="inherit" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Perfil" arrow>
            <IconButton color="inherit">
              <AccountCircleIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ 
          width: { sm: drawerOpen ? 240 : 72 },
          flexShrink: 0,
          transition: 'width 0.3s ease-in-out',
          position: 'fixed',
          height: '100vh',
          zIndex: 1200,
        }}
        aria-label="menú de navegación"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : drawerOpen}
          onClose={toggleDrawer(false)}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móvil
          }}
          sx={{
            display: { xs: 'block', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box',
              width: { sm: drawerOpen ? 240 : 72 },
              bgcolor: 'background.paper',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'fixed',
              whiteSpace: 'nowrap',
              transition: 'width 0.3s ease-in-out',
              overflowX: 'hidden',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? 240 : 72}px)` },
          paddingTop: '100px',
          maxWidth: '100%',
          overflowX: 'hidden',
          transition: 'all 0.3s ease-in-out',
          marginLeft: { sm: `${drawerOpen ? 240 : 72}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          minHeight: '100vh',
          boxSizing: 'border-box',
          paddingLeft: { xs: '16px', sm: '24px' },
          paddingRight: { xs: '16px', sm: '24px' },
          paddingBottom: '24px',
          borderRadius: '16px 0 0 0',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Routes>
          <Route path="/" element={<CausasList />} />
          <Route path="/nueva" element={<CausaForm />} />
          <Route path="/editar/:id" element={<CausaForm />} />
          <Route path="/ver/:id" element={<CausaForm />} />
          <Route path="/chats" element={<ChatsPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
