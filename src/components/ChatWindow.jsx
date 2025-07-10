import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  IconButton, 
  useTheme,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Componente personalizado para los enlaces que se abren en una nueva pestaña
const CustomLink = ({ node, ...props }) => (
  <MuiLink {...props} target="_blank" rel="noopener noreferrer" />
);

// Componente personalizado para el código
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  
  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
  
  // Para bloques de código, usamos un componente separado que no estará dentro de un párrafo
  return (
    <div className="code-block-wrapper" style={{ margin: '16px 0' }}>
      <SyntaxHighlighter
        style={oneDark}
        language={match ? match[1] : 'javascript'}
        customStyle={{
          margin: 0,
          padding: '16px',
          borderRadius: '8px',
          fontSize: '0.9em',
          lineHeight: 1.5
        }}
        codeTagProps={{
          style: {
            fontFamily: 'monospace',
            display: 'block',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }
        }}
        wrapLines={true}
        wrapLongLines={true}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};

const ChatWindow = ({ selectedChat, isConnected, ...props }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLocked, setChatLocked] = useState(selectedChat?.locked ?? false);
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Función para hacer scroll al final
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: 'end',
        inline: 'nearest'
      });
    }
  }, []);

  // Efecto para manejar el scroll al cargar mensajes iniciales
  useEffect(() => {
    if (messages.length > 0) {
      // Usar requestAnimationFrame para asegurar que el DOM se ha actualizado
      const rafId = requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [selectedChat?.phone_number]);
  
  // Efecto para manejar el scroll cuando se agregan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom('smooth');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Generar un ID único para el mensaje
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Manejar nuevos mensajes
  useEffect(() => {
    const handleNewMessage = (event) => {
      const message = event.detail;
      console.log('📩 ChatWindow recibió mensaje:', {
        phone: message.phone_number,
        content: message.data?.content?.substring(0, 50) + '...',
        selectedChat: selectedChat?.phone_number
      });
      
      // Solo procesar si es para el chat actual
      if (selectedChat?.phone_number === message.phone_number) {
        const messageData = message.data || {};
        const messageId = message.message_id || `msg_${Date.now()}`;
        
        setMessages(prevMessages => {
          // Verificar si ya existe un mensaje con el mismo contenido y timestamp
          const messageExists = prevMessages.some(msg => 
            msg.content === messageData.content && 
            msg.timestamp === message.timestamp
          );
          
          if (messageExists) {
            console.log('Mensaje duplicado en ChatWindow, ignorando...');
            return prevMessages;
          }
          
          console.log('➕ Agregando nuevo mensaje al chat:', {
            content: messageData.content?.substring(0, 50) + '...',
            role: messageData.role,
            timestamp: message.timestamp
          });
          
          return [
            ...prevMessages,
            {
              id: messageId,
              content: messageData.content || '',
              role: messageData.role || 'assistant',
              timestamp: message.timestamp || new Date().toISOString(),
              status: 'delivered'
            }
          ];
        });
      }
    };

    console.log('🔔 ChatWindow registrando event listener para newMessage');
    document.addEventListener('newMessage', handleNewMessage);
    
    return () => {
      console.log('🧹 ChatWindow limpiando event listener de newMessage');
      document.removeEventListener('newMessage', handleNewMessage);
    };
  }, [selectedChat?.phone_number]);

  useEffect(() => {
    const handleStatusUpdate = (event) => {
      const { phone_number, locked } = event.detail;
      
      // Solo actualizar si el chat actual coincide con el evento
      if (selectedChat?.phone_number === phone_number) {
        console.log('🔄 ChatWindow: Actualizando estado del chat:', { phone_number, locked });
        
        // Actualizar el estado local
        setChatLocked(locked);
        
        // Notificar al componente padre si es necesario
        if (props.onChatUpdate) {
          props.onChatUpdate({
            ...selectedChat,
            locked: locked
          });
        }
      }
    };
    
    console.log('🔔 ChatWindow: Registrando event listener para chatStatusUpdate');
    document.addEventListener('chatStatusUpdate', handleStatusUpdate);
    
    return () => {
      console.log('🧹 ChatWindow: Limpiando event listener de chatStatusUpdate');
      document.removeEventListener('chatStatusUpdate', handleStatusUpdate);
    };
  }, [selectedChat, props.onChatUpdate]);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (!selectedChat) return;
    
    // Actualizar el estado locked cuando cambia el chat seleccionado
    setChatLocked(selectedChat.locked ?? false);
    
    // Usar requestAnimationFrame para asegurar que el DOM está listo
    const rafId = requestAnimationFrame(() => {
      // Si el chat ya tiene mensajes, usarlos
      if (selectedChat.messages && Array.isArray(selectedChat.messages)) {
        console.log('Usando mensajes existentes del chat:', selectedChat.messages.length);
        setMessages(selectedChat.messages);
      } else if (selectedChat.messages) {
        console.log('Mensajes del chat (raw):', selectedChat.messages);
        const messagesArray = Array.isArray(selectedChat.messages) ? selectedChat.messages : [];
        console.log('Mensajes procesados:', messagesArray);
        console.log('Primer mensaje (si existe):', messagesArray[0]);
        setMessages(messagesArray);
      } else {
        console.log('No hay mensajes en el chat seleccionado');
        setMessages([]);
      }
      
      // Forzar un segundo renderizado para asegurar el scroll correcto
      setTimeout(() => {
        scrollToBottom('auto');
      }, 0);
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [selectedChat]);

  // Desplazarse al final de los mensajes cuando se actualizan
  useEffect(() => {
    // Solo hacer scroll si hay mensajes y el chat está seleccionado
    if (messages.length > 0 && selectedChat) {
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedChat?.phone_number]);
  
  // Efecto separado para manejar scroll cuando llegan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Solo hacer scroll si el último mensaje es nuevo (menos de 5 segundos)
      const isNewMessage = lastMessage.timestamp && 
        (new Date() - new Date(lastMessage.timestamp)) < 5000;
        
      if (isNewMessage) {
        const timer = setTimeout(() => {
          scrollToBottom('smooth');
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length]);

  const handleSendMessage = useCallback(async (e) => {
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
  }, [newMessage, selectedChat]);

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
      <SmartToyIcon sx={{ fontSize: 20 , color: 'success.main', opacity: 0.7}} />:
      role === "human" ?
      <PersonIcon sx={{ fontSize: 20 , color: 'error.main', opacity: 0.6}} />:
      <PersonIcon sx={{ fontSize: 18.5, opacity: 0.7}} />; // como no son los mismos colores la apriencia de tamanho no es la misma
  };

  // Configuración de componentes para ReactMarkdown
  const components = {
    a: CustomLink,
    code: CodeBlock,
    // Evitar que los bloques de código se envuelvan en párrafos
    p: ({ node, ...props }) => {
      // Si el párrafo solo contiene un bloque de código, lo renderizamos sin párrafo
      if (node?.children?.length === 1 && node.children[0].tagName === 'pre') {
        return <>{props.children}</>;
      }
      return <p style={{ margin: '0.5em 0', lineHeight: 1.6 }} {...props} />;
    },
    // Estilos para otros elementos
    ul: ({ node, ...props }) => <ul style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} {...props} />,
    ol: ({ node, ...props }) => <ol style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} {...props} />,
    li: ({ node, ...props }) => <li style={{ margin: '0.25em 0' }} {...props} />,
    h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.8em', margin: '0.8em 0 0.4em' }} {...props} />,
    h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.5em', margin: '0.8em 0 0.4em' }} {...props} />,
    h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.3em', margin: '0.8em 0 0.4em' }} {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote 
        style={{
          margin: '0.5em 0', 
          padding: '0 1em',
          borderLeft: '4px solid #dfe2e5',
          color: '#6a737d'
        }} 
        {...props} 
      />
    ),
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
        backgroundColor: 'transparent',
        position: 'relative',
        '& > *': {
          backgroundColor: 'transparent',
        },
        ...props.sx
      }}
    >
      {selectedChat ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Encabezado del chat */}
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.background.paper,
            flexShrink: 1,
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccountCircleIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 420 }}>
                +{selectedChat.phone_number}
              </Typography>
            </Box>
            
            {/* Botón de cierre */}
            <IconButton 
              aria-label="Cerrar chat"
              onClick={props.onCloseChat}
              size="small"
              sx={{
                color: theme.palette.grey[500],
                '&:hover': {
                  color: theme.palette.grey[800],
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Área de mensajes con scroll */}
          <Box sx={{ 
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'transparent',
            '& > *': {
              backgroundColor: 'transparent',
            }
          }}>
            <Box 
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                backgroundColor: 'transparent',
                '& > *': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }
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
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: 'transparent',
                              color: isFromRight ? '#fff' : 'text.primary',
                              position: 'absolute',
                              top: 0,
                              [isFromRight ? 'right' : 'left']: -6,
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
                              <Box sx={{ 
                                '& p': { 
                                  margin: 0,
                                  marginBottom: '0.5em',
                                  lineHeight: 1.5 
                                },
                                '& h1, & h2, & h3, & h4, & h5, & h6': {
                                  margin: '0.5em 0',
                                  lineHeight: 1.3
                                },
                                '& ul, & ol': {
                                  margin: '0.5em 0',
                                  paddingLeft: '1.5em'
                                },
                                '& code': {
                                  backgroundColor: isFromRight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                  padding: '0.2em 0.4em',
                                  borderRadius: '3px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.9em'
                                },
                                '& pre': {
                                  margin: '0.5em 0',
                                  borderRadius: '4px',
                                  overflow: 'auto'
                                },
                                '& a': {
                                  color: isFromRight ? '#90caf9' : theme.palette.primary.main,
                                  textDecoration: 'none',
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                },
                                '& blockquote': {
                                  borderLeft: `3px solid ${isFromRight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
                                  margin: '0.5em 0',
                                  padding: '0 1em',
                                  color: isFromRight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                                  fontStyle: 'italic'
                                },
                                '& table': {
                                  borderCollapse: 'collapse',
                                  width: '100%',
                                  margin: '0.5em 0',
                                  '& th, & td': {
                                    border: `1px solid ${isFromRight ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                                    padding: '6px 12px',
                                    textAlign: 'left'
                                  },
                                  '& th': {
                                    backgroundColor: isFromRight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                  }
                                },
                                '& img': {
                                  maxWidth: '100%',
                                  borderRadius: '4px',
                                  margin: '0.5em 0'
                                }
                              }}>
                                <div className="markdown-content" style={{ lineHeight: 1.6, wordBreak: 'break-word' }}>
                                  <ReactMarkdown
                                    components={components}
                                    skipHtml={true}
                                    unwrapDisallowed={true}
                                    allowedElements={['p', 'pre', 'code', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'br']}
                                  >
                                    {messageText}
                                  </ReactMarkdown>
                                </div>
                              </Box>
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
            p: 2.5, 
            pt: 1,  // Reducir el padding superior
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            flexShrink: 0,
            position: 'relative',
            bottom: '8px'  // Mover el contenedor hacia arriba
          }}>
            <Box 
              component="form" 
              onSubmit={handleSendMessage} 
              sx={{ 
                display: 'flex', 
                gap: 1, 
                alignItems: 'center',
                width: '100%'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 1 }}>
                {chatLocked === true && (
                  <IconButton 
                    size="small"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const response = await axios.put(
                          `${import.meta.env.VITE_URL_BACKEND}/webhook/whatsapp/unlock`,
                          {
                            phone_number: selectedChat.phone_number
                          },
                          {
                            headers: {
                              'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
                              'Content-Type': 'application/json'
                            }
                          }
                        );
                        
                        if (response.status === 200) {
                          console.log('✅ Chat desbloqueado exitosamente');
                          // Actualizar el estado del chat
                          if (props.onChatUpdate) {
                            props.onChatUpdate({
                              ...selectedChat,
                              locked: false
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error al desbloquear el chat:', error);
                        alert('No se pudo desbloquear el chat. Por favor, intente nuevamente.');
                      }
                    }}
                    sx={{ 
                      color: 'success.main',
                      '&:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      },
                      height: '40px',
                      width: '40px',
                    }}
                    title="Activar bot"
                  >
                    <SmartToyIcon />
                  </IconButton>
                )}
                
                {chatLocked === false && (
                  <IconButton 
                    size="small"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const response = await axios.put(
                          `${import.meta.env.VITE_URL_BACKEND}/webhook/whatsapp/lock`,
                          {
                            phone_number: selectedChat.phone_number
                          },
                          {
                            headers: {
                              'api-key-auth': import.meta.env.VITE_API_KEY_AUTH,
                              'Content-Type': 'application/json'
                            }
                          }
                        );
                        
                        if (response.status === 200) {
                          console.log('✅ Chat bloqueado exitosamente');
                          // Actualizar el estado del chat
                          if (props.onChatUpdate) {
                            props.onChatUpdate({
                              ...selectedChat,
                              locked: true
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error al bloquear el chat:', error);
                        alert('No se pudo bloquear el chat. Por favor, intente nuevamente.');
                      }
                    }}
                    sx={{ 
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                      height: '40px',
                      width: '40px',
                    }}
                    title="Tomar el control del chat"
                  >
                    <PersonIcon />
                  </IconButton>
                )}
              </Box>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                size="small"
                autoComplete="off"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                inputProps={{
                  autoComplete: 'off',
                  'aria-autocomplete': 'none',
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 4,
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
                disabled={!selectedChat || loading}
              />
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton 
                  type="submit" 
                  color="primary" 
                  disabled={!newMessage.trim() || loading}
                  sx={{ 
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                    height: '38px',
                    width: '38px',
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
