import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  IconButton, 
  useTheme,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';

const ChatWindow = ({ selectedChat, isConnected, ...props }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Efecto para manejar el scroll al final de los mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Generar un ID único para el mensaje
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Manejar nuevos mensajes
  useEffect(() => {
    const handleNewMessage = (event) => {
      const message = event.detail;
      console.log('💬 Nuevo mensaje recibido en ChatWindow:', message);
      
      // Verificar que el mensaje es para el chat actual
      if (selectedChat?.phone_number === message.phone_number) {
        console.log('Mensaje para el chat actual, procesando...');
        
        setMessages(prevMessages => {
          // Extraer datos del mensaje de manera segura
          const messageData = message.data || {};
          const messageContent = messageData.content || '';
          const messageRole = messageData.role || 'assistant';
          const messageTimestamp = message.timestamp || new Date().toISOString();
          
          // Si es un mensaje de confirmación (del backend)
          if (message.type === 'message_sent' && message.temp_id) {
            console.log('Actualizando mensaje temporal con ID del servidor:', message.temp_id);
            // Si ya existe un mensaje con este ID, actualizarlo
            if (prevMessages.some(msg => msg.id === message.temp_id)) {
              return prevMessages.map(msg => 
                msg.id === message.temp_id 
                  ? { 
                      ...msg, 
                      id: message.message_id || msg.id,
                      status: 'delivered',
                      timestamp: messageTimestamp
                    } 
                  : msg
              );
            }
            // Si no existe, agregar el mensaje del servidor
            return [...prevMessages, {
              id: message.message_id || `msg_${Date.now()}`,
              content: messageContent,
              role: messageRole,
              timestamp: messageTimestamp,
              status: 'delivered'
            }];
          }
          
          // Si es un mensaje del servidor y no es de confirmación
          if (message.type === 'new_message') {
            // Verificar si ya existe un mensaje con el mismo contenido y rol en los últimos 5 segundos
            const isDuplicate = prevMessages.some(msg => 
              msg.content === messageContent && 
              msg.role === messageRole &&
              Math.abs(new Date(msg.timestamp) - new Date(messageTimestamp)) < 5000
            );
            
            if (isDuplicate) {
              console.log('Mensaje duplicado detectado, ignorando...');
              return prevMessages;
            }
            
            // Agregar el nuevo mensaje del servidor
            console.log('Agregando nuevo mensaje del servidor:', messageContent);
            return [...prevMessages, {
              id: message.message_id || `msg_${Date.now()}`,
              content: messageContent,
              role: messageRole,
              timestamp: messageTimestamp,
              status: 'delivered'
            }];
          }
          
          return prevMessages;
        });
      } else {
        console.log('Mensaje no es para el chat actual, ignorando...');
      }
    };

    // Agregar event listener al documento para capturar los eventos de cualquier parte de la aplicación
    document.addEventListener('newMessage', handleNewMessage);

    // Limpiar
    return () => {
      document.removeEventListener('newMessage', handleNewMessage);
    };
  }, [selectedChat?.phone_number]);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (!selectedChat) return;
    
    console.log('💬 Chat seleccionado:', selectedChat);
    
    // Si el chat ya tiene mensajes, usarlos
    if (selectedChat.messages && Array.isArray(selectedChat.messages)) {
      console.log('Usando mensajes existentes del chat:', selectedChat.messages.length);
      setMessages(selectedChat.messages);
      return;
    }
    setLoading(true);
    
    // Usar los mensajes del chat seleccionado
    if (selectedChat.messages) {
      console.log('Mensajes del chat (raw):', selectedChat.messages);
      const messagesArray = Array.isArray(selectedChat.messages) ? selectedChat.messages : [];
      console.log('Mensajes procesados:', messagesArray);
      console.log('Primer mensaje (si existe):', messagesArray[0]);
      setMessages(messagesArray);
    } else {
      console.log('No hay mensajes en el chat seleccionado');
      setMessages([]);
    }
    
    setLoading(false);
  }, [selectedChat]);

  // Desplazarse al final de los mensajes cuando se actualizan
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    // Solo mostrar el mensaje cuando lo confirme el servidor
    // No mostrarlo de forma optimista para evitar duplicados
    
    try {
      // Enviar mensaje al backend
      const response = await axios.post(
        `${import.meta.env.VITE_URL_BACKEND}/webhook/whatsapp/send-message`,
        {
          phone_number: selectedChat.phone_number,
          message: messageToSend,
          // No incluimos temp_id ya que no mostramos el mensaje de forma optimista
        },
        { 
          headers: { 
            'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      // El mensaje se mostrará cuando llegue por el WebSocket
      console.log('Mensaje enviado, esperando confirmación...');
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Mostrar notificación de error sin modificar el estado de mensajes
      alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const date = new Date(timestamp);
    const isToday = now.toDateString() === date.toDateString();
    
    if (isToday) {
      // Solo la hora si es hoy
      return date.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      // Fecha y hora si no es hoy
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ' -');
    }
  };
  
  const getMessageIcon = (role) => {
    return role === 'assistant' ? 
      <SmartToyIcon sx={{ fontSize: 16 }} /> : 
      <PersonIcon sx={{ fontSize: 16 }} />;
  };

  return (
    <Box
      ref={chatWindowRef}
      data-testid="chat-window"
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.palette.grey[100],
        position: 'relative',
      }}
      {...props}
    >
      {selectedChat ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Encabezado del chat */}
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.palette.background.paper,
            flexShrink: 0
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              +{selectedChat.phone_number}
            </Typography>
          </Box>
          
          {/* Área de mensajes con scroll */}
          <Box sx={{ 
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.grey[50]
          }}>
            <Box 
              sx={{
                flex: 1,
                p: 2,
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
              }}
            >
              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%' 
                }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Cargando mensajes...
                  </Typography>
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%', 
                  color: 'text.secondary' 
                }}>
                  <Typography variant="body1">
                    No hay mensajes. Envía un mensaje para comenzar la conversación.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mb: 2 }}>
                  {messages.map((msg, index) => {
                    const messageText = msg.message || msg.body || msg.text || msg.content || '';
                    const isFromRight = ['human', 'assistant'].includes(msg.role);
                    const timestamp = msg.date || msg.timestamp || msg.time || msg.createdAt || new Date().toISOString();
                    const messageId = msg.id || `msg-${index}`;
                    
                    return (
                      <Box key={messageId} sx={{ width: '100%', mb: 2, px: 1, pt: 2 }}>
                        {/* Línea del icono */}
                        <Box 
                          sx={{
                            display: 'flex',
                            justifyContent: isFromRight ? 'flex-end' : 'flex-start',
                            mb: 0.5,
                            pr: isFromRight ? 2 : 0,
                            pl: isFromRight ? 0 : 2,
                            position: 'relative',
                            top: -21
                          }}
                        >
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 23,
                              height: 23,
                              borderRadius: '50%',
                              bgcolor: isFromRight ? 'primary.main' : 'grey.200',
                              color: isFromRight ? '#fff' : 'text.primary',
                              position: 'absolute',
                              top: 0,
                              [isFromRight ? 'right' : 'left']: 0,
                              zIndex: 1
                            }}
                          >
                            {getMessageIcon(msg.role)}
                          </Box>
                        </Box>
                        
                        {/* Tarjeta del mensaje */}
                        <Box 
                          sx={{
                            display: 'flex',
                            justifyContent: isFromRight ? 'flex-end' : 'flex-start',
                            width: '100%'
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '70%',
                              p: 2,
                              borderRadius: 2,
                              bgcolor: isFromRight ? 'primary.main' : 'grey.200',
                              color: isFromRight ? '#fff' : 'text.primary',
                              boxShadow: theme.shadows[1],
                              position: 'relative',
                              wordBreak: 'break-word',
                              borderTopLeftRadius: isFromRight ? 12 : 4,
                              borderTopRightRadius: isFromRight ? 4 : 12,
                            }}
                          >
                            {messageText ? (
                              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {messageText}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                (Mensaje sin texto)
                              </Typography>
                            )}
                            <Typography 
                              variant="caption" 
                              sx={{
                                display: 'block',
                                textAlign: 'right',
                                mt: 1,
                                color: isFromRight ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                                fontSize: '0.7rem',
                                opacity: 0.9
                              }}
                            >
                              {formatDateTime(timestamp)}
                              {msg.status === 'sending' && ' · Enviando...'}
                              {msg.status === 'error' && ' · Error al enviar'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>
              )}
            </Box>
          </Box>
          
          {/* Área de entrada de mensajes */}
          <Box sx={{
            p: 2, 
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            flexShrink: 0
          }}>
            <Box 
              component="form" 
              onSubmit={handleSendMessage} 
              sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center' 
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 4,
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
                disabled={!selectedChat || loading}
              />
              <IconButton 
                type="submit" 
                color="primary" 
                disabled={!newMessage.trim() || loading}
                sx={{ 
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '&:disabled': {
                    backgroundColor: theme.palette.action.disabledBackground,
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          backgroundColor: theme.palette.grey[50]
        }}>
          <Typography variant="body1" color="text.secondary">
            Selecciona un chat para comenzar
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatWindow;
