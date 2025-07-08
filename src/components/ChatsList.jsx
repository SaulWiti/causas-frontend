import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar,
  Avatar,
  Typography, 
  Container, 
  Paper, 
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
  useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import axios from 'axios';

const ChatsList = ({ onSelectChat, selectedChat, ...props }) => {
  const theme = useTheme();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'bot', 'human'
  const chatListRef = useRef(null);

  // Manejar actualización de estado de chat (locked)
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      const { phone_number, locked } = event.detail;
      console.log('🔄 Actualizando estado de chat en ChatsList:', { phone_number, locked });
      
      setChats(prevChats => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(chat => chat.phone_number === phone_number);
        
        if (chatIndex >= 0) {
          // Actualizar el estado locked del chat
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            locked: locked
          };
          
          console.log('✅ Estado de chat actualizado:', updatedChats[chatIndex]);
          return [...updatedChats]; // Retornar un nuevo array para forzar la actualización
        }
        
        return prevChats;
      });
    };
    
    // Registrar el manejador de eventos
    console.log('🔔 Registrando event listener para chatStatusUpdate en ChatsList');
    document.addEventListener('chatStatusUpdate', handleStatusUpdate);
    
    return () => {
      console.log('🧹 Limpiando event listener de chatStatusUpdate en ChatsList');
      document.removeEventListener('chatStatusUpdate', handleStatusUpdate);
    };
  }, []);

  // Manejar nuevos mensajes
  useEffect(() => {
    const handleNewMessage = (event) => {
      const message = event.detail;
      console.log('📩 Nuevo mensaje recibido en ChatsList:', message);
      
      // Verificar que el mensaje tenga los datos necesarios
      if (!message.phone_number || !message.data?.content) {
        console.warn('Mensaje recibido sin datos necesarios:', message);
        return;
      }
      
      // Verificar si es un mensaje de usuario en un chat bloqueado
      if (message.data?.role === 'user') {
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(chat => chat.phone_number === message.phone_number);
          
          if (chatIndex >= 0) {
            const chat = prevChats[chatIndex];
            
            // Si el chat está bloqueado
            if (chat.locked) {
              const isChatOpen = selectedChat?.phone_number === message.phone_number;
              
              // Si el chat está abierto, marcar como visto
              if (isChatOpen) {
                markMessagesAsViewed(chat.phone_number).catch(console.error);
              } 
              // Si el chat no está abierto, incrementar el contador
              else if (chat.self_count_not_viewed !== undefined) {
                const updatedChats = [...prevChats];
                updatedChats[chatIndex] = {
                  ...chat,
                  self_count_not_viewed: (chat.self_count_not_viewed || 0) + 1
                };
                return updatedChats;
              }
            }
          }
          return prevChats;
        });
      }
      
      setChats(prevChats => {
        // Crear una copia del array de chats para no mutar el estado directamente
        const updatedChats = [...prevChats];
        
        // Buscar el índice del chat existente
        const chatIndex = updatedChats.findIndex(chat => chat.phone_number === message.phone_number);
        
        // Crear el objeto de mensaje
        const now = new Date().toISOString();
        const newMessage = {
          content: message.data.content,
          role: message.data.role || 'assistant',
          timestamp: message.timestamp || now,
          date: message.timestamp || now // Asegurar que el campo date esté presente
        };
        
        if (chatIndex >= 0) {
          // Si el chat existe, actualizarlo
          const existingChat = updatedChats[chatIndex];
          
          // Verificar si el mensaje ya existe para evitar duplicados
          const messageExists = existingChat.messages?.some(
            msg => msg.content === newMessage.content && 
                   msg.timestamp === newMessage.timestamp
          );
          
          if (messageExists) {
            console.log('Mensaje duplicado, ignorando...');
            return prevChats;
          }
          
          // Actualizar el chat existente
          updatedChats[chatIndex] = {
            ...existingChat,
            lastMessage: newMessage.content,
            lastMessageTime: newMessage.timestamp,
            timestamp: newMessage.timestamp,
            messages: [...(existingChat.messages || []), newMessage],
            unreadCount: selectedChat?.phone_number === message.phone_number 
              ? 0 
              : (existingChat.unreadCount || 0) + 1
          };
          
          // Mover el chat actualizado al principio del array
          const [movedChat] = updatedChats.splice(chatIndex, 1);
          return [movedChat, ...updatedChats];
        } else {
          // Crear un nuevo chat si no existe
          const newChat = {
            id: `chat_${message.phone_number}`,
            phone_number: message.phone_number,
            name: `+${message.phone_number}`,
            lastMessage: newMessage.content,
            lastMessageTime: newMessage.timestamp,
            timestamp: newMessage.timestamp,
            messages: [newMessage],
            unreadCount: 1
          };
          
          return [newChat, ...updatedChats];
        }
      });
    };

    // Agregar event listener al documento para capturar eventos de mensajes
    console.log('🔔 Registrando event listener para newMessage en ChatsList');
    document.addEventListener('newMessage', handleNewMessage);
    
    // Limpiar el event listener al desmontar
    return () => {
      console.log('🧹 Limpiando event listener de newMessage en ChatsList');
      document.removeEventListener('newMessage', handleNewMessage);
    };
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_URL_BACKEND}/bot-whatsapp/chats/`,
          { 
            headers: { 
              'api-key-auth': import.meta.env.VITE_API_KEY_AUTH 
            } 
          }
        );
        setChats(response.data.chats);
      } catch (err) {
        console.error('Error al cargar los chats:', err);
        setError('No se pudieron cargar los chats. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    
    // Verificar si es hoy
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      // Mostrar solo la hora
      return date.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // Mostrar fecha completa si no es hoy
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para marcar los mensajes como vistos
  const markMessagesAsViewed = async (phoneNumber) => {
    try {
      // Actualizar el estado local primero para una mejor experiencia de usuario
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.phone_number === phoneNumber 
            ? { ...chat, self_count_not_viewed: 0 } 
            : chat
        )
      );

      // Hacer la llamada al backend
      await axios.put(
        `${import.meta.env.VITE_URL_BACKEND}/bot-whatsapp/update-chat/${phoneNumber}`,
        {},
        { 
          headers: { 
            'api-key-auth': import.meta.env.VITE_API_KEY_AUTH 
          } 
        }
      );
      
      console.log(`Mensajes marcados como vistos para ${phoneNumber}`);
    } catch (error) {
      console.error('Error al marcar mensajes como vistos:', error);
      // Revertir el cambio en caso de error
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.phone_number === phoneNumber && chat.self_count_not_viewed === 0
            ? { ...chat, self_count_not_viewed: chat.self_count_not_viewed }
            : chat
        )
      );
    }
  };

  // Manejador para seleccionar un chat
  const handleSelectChat = async (chat) => {
    // Si hay mensajes no vistos, marcarlos como vistos
    if (chat.self_count_not_viewed > 0) {
      await markMessagesAsViewed(chat.phone_number);
    }
    // Llamar al manejador original para seleccionar el chat
    onSelectChat(chat);
  };

  // Filtrar chats según el término de búsqueda y el filtro seleccionado
  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         chat.phone_number.includes(searchTerm.replace(/\D/g, ''));
    
    if (filter === 'bot') return matchesSearch && chat.locked === false;
    if (filter === 'human') return matchesSearch && chat.locked === true;
    return matchesSearch; // 'all' o cualquier otro valor
  });

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        overflow: 'hidden' // Evita scroll en el contenedor principal
      }}
      ref={chatListRef}
      {...props}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`, 
        flexShrink: 0, // Evita que el encabezado se encoja
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1 // Reducido para dar espacio a los botones de filtro
        }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Chats
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            pr: 0.5
          }}>
            <Typography variant="caption" color="text.secondary">
              {props.isConnected ? 'Conectado' : 'Desconectado'}
            </Typography>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: props.isConnected ? '#4caf50' : '#f44336',
              border: '1px solid white'
            }} />
          </Box>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar o empezar un chat"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* Contenedor principal */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Filtros - Siempre visibles */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mb: 2,
          px: 1,
          pt: 1
        }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            aria-label="filtro de chats"
            fullWidth
            size="small"
          >
            <ToggleButton 
              value="all" 
              aria-label="todos"
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#2196f3',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1976d2',
                  }
                },
                flex: 1,
                textTransform: 'none',
                gap: 0.5
              }}
            >
              <GroupsIcon fontSize="small" />
              <span>Todos</span>
            </ToggleButton>
            <ToggleButton 
              value="bot" 
              aria-label="bot"
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#4caf50',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#388e3c',
                  }
                },
                flex: 1,
                textTransform: 'none',
                gap: 0.5
              }}
            >
              <SmartToyIcon fontSize="small" />
              <span>Bot</span>
            </ToggleButton>
            <ToggleButton 
              value="human" 
              aria-label="humano"
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#f44336',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#d32f2f',
                  }
                },
                flex: 1,
                textTransform: 'none',
                gap: 0.5
              }}
            >
              <PersonIcon fontSize="small" />
              <span>Humano</span>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Contenido condicional */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box p={3}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : filteredChats.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="textSecondary">
              {searchTerm ? 'No se encontraron chats' : 'No hay chats disponibles'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ 
            flex: 1, 
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: theme.palette.grey[100],
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.grey[400],
              borderRadius: '3px',
            }
          }}>
            {filteredChats.map((chat) => {
              const lastMessage = chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null;
              // Usar la fecha del último mensaje o la fecha del chat
              const messageDate = lastMessage?.date || chat.date || chat.timestamp;
              const isSelected = selectedChat?.phone_number === chat.phone_number;
              
              return (
                <ListItem 
                  button 
                  key={chat.phone_number}
                  onClick={() => handleSelectChat(chat)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    py: 1.5,
                    pl: 1,
                    backgroundColor: isSelected ? theme.palette.action.selected : 'transparent',
                    '&:hover': {
                      backgroundColor: isSelected 
                        ? theme.palette.action.selected 
                        : theme.palette.action.hover
                    }
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {chat.locked && chat.self_count_not_viewed > 0 && !isSelected && (
                          <Box
                            sx={{
                              backgroundColor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {chat.self_count_not_viewed > 9 ? '9+' : chat.self_count_not_viewed}
                          </Box>
                        )}
                        {chat.locked ? (
                          <PersonIcon 
                            fontSize="medium"
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              color: 'error.main' // Rojo para humano
                            }}
                          />
                        ) : (
                          <SmartToyIcon 
                            fontSize="medium"
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              color: 'success.main' // Verde para bot
                            }}
                          />
                        )}
                      </Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          whiteSpace: 'nowrap',
                          alignSelf: 'flex-end',
                          lineHeight: 1.3
                        }}
                      >
                        {messageDate ? formatDateTime(messageDate) : ''}
                      </Typography>
                    </Box>
                  }
                >
                <ListItemAvatar sx={{ minWidth: 48, mr: 2, my: 0, alignSelf: 'flex-start' }}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.main', 
                    width: 44, 
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PersonIcon fontSize="medium" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography 
                      component="span"
                      variant="subtitle1"
                      sx={{ 
                        fontWeight: 600,
                        lineHeight: 1.3,
                        mb: 0.75,
                        color: 'text.primary',
                        display: 'block',
                        letterSpacing: 0.15
                      }}
                    >
                      +{chat.phone_number}
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        maxWidth: 'calc(100% - 140px)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                        fontWeight: 400,
                        mt: 0.5
                      }}
                    >
                      {lastMessage 
                        ? <>
                            <span style={{ fontWeight: 500, color: 'rgba(0, 0, 0, 0.8)' }}>
                              {lastMessage.role === 'human' ? 'Tú' : lastMessage.role === "assistant" ? "Bot" : "User"}:
                            </span>
                            {' '}{lastMessage.content.substring(0, 40)}{lastMessage.content.length > 40 ? '...' : ''}
                          </>
                        : 'Sin mensajes'}
                    </Typography>
                  }
                  sx={{ my: 0, overflow: 'hidden' }}
                />
              </ListItem>
            );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ChatsList;
