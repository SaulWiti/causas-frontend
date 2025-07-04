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
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

const ChatsList = ({ onSelectChat, selectedChat, ...props }) => {
  const theme = useTheme();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
      
      setChats(prevChats => {
        // Crear una copia del array de chats para no mutar el estado directamente
        const updatedChats = [...prevChats];
        
        // Buscar el índice del chat existente
        const chatIndex = updatedChats.findIndex(chat => chat.phone_number === message.phone_number);
        
        // Crear el objeto de mensaje
        const newMessage = {
          content: message.data.content,
          role: message.data.role || 'assistant',
          timestamp: message.timestamp || new Date().toISOString()
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
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredChats = chats.filter(chat => 
    chat.phone_number.includes(searchTerm.replace(/\D/g, ''))
  );

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
          mb: 2 // Espacio debajo del encabezado
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
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
            const messageDate = lastMessage?.date || chat.date;
            const isSelected = selectedChat?.phone_number === chat.phone_number;
            
            return (
              <ListItem 
                button 
                key={chat.phone_number}
                onClick={() => onSelectChat(chat)}
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
                    {chat.locked ? (
                      <PersonOutlineIcon 
                        fontSize="medium"
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          mb: 0.5,
                          color: 'error.main' // Rojo para humano
                        }}
                      />
                    ) : (
                      <SmartToyIcon 
                        fontSize="medium"
                        sx={{ 
                          width: 20, 
                          height: 20, 
                          mb: 0.5,
                          color: 'success.main' // Verde para bot
                        }}
                      />
                    )}
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
        </Box>
      )}
    </Box>
  );
};

export default ChatsList;
