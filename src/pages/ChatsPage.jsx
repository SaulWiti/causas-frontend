import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import ChatsList from '../components/ChatsList';
import ChatWindow from '../components/ChatWindow';

const ChatsPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef(null);

  const connectWebSocket = useCallback(() => {
    // Limpiar intentos de reconexión si existe uno pendiente
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    // Verificar si ya existe una conexión
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      console.log('🚦 Ya existe una conexión WebSocket activa o en progreso');
      return;
    }

    console.log('🔌 Iniciando conexión WebSocket...');
    
    try {
      const wsUrl = `${import.meta.env.VITE_URL_BACKEND}/ws/`;
      console.log('Conectando a:', wsUrl);
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('✅ Conexión WebSocket establecida');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0; // Reiniciar contador de reconexiones
      };

      // Configurar el manejador de mensajes
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Mensaje WebSocket recibido:', message);
          
          if (message.type === 'new_message') {
            console.log('📩 Procesando nuevo mensaje:', {
              phone: message.phone_number,
              content: message.data?.content?.substring(0, 50) + '...',
              role: message.data?.role
            });
            
            // Crear un evento global que pueda ser capturado por cualquier componente
            const messageEvent = new CustomEvent('newMessage', { 
              detail: message,
              bubbles: true,
              cancelable: true
            });
            
            // Disparar el evento en el documento para que lo capturen los listeners globales
            console.log('🚀 Disparando evento newMessage global');
            document.dispatchEvent(messageEvent);
            
            // También disparar directamente a los componentes específicos por si acaso
            const chatList = document.querySelector('[data-testid="chats-list"]');
            if (chatList) {
              console.log('🎯 Disparando evento a ChatsList');
              chatList.dispatchEvent(new CustomEvent('newMessage', { 
                detail: message,
                bubbles: true 
              }));
            }
            
            const chatWindow = document.querySelector('[data-testid="chat-window"]');
            if (chatWindow) {
              console.log('🎯 Disparando evento a ChatWindow');
              chatWindow.dispatchEvent(new CustomEvent('newMessage', { 
                detail: message,
                bubbles: true 
              }));
            }
            
            // Actualizar el estado local si el chat está seleccionado
            if (selectedChat?.phone_number === message.phone_number) {
              console.log('🔄 Actualizando chat seleccionado con nuevo mensaje');
              setSelectedChat(prev => ({
                ...prev,
                lastMessage: message.data?.content || '',
                timestamp: message.timestamp || new Date().toISOString(),
                messages: [
                  ...(prev.messages || []),
                  {
                    content: message.data?.content || '',
                    role: message.data?.role || 'assistant',
                    timestamp: message.timestamp || new Date().toISOString()
                  }
                ]
              }));
            }
          }
        } catch (err) {
          console.error('Error al procesar mensaje WebSocket:', err);
        }
      };

      ws.current.onclose = (event) => {
        console.log('❌ Conexión WebSocket cerrada', event.code, event.reason);
        setIsConnected(false);
        
        // No intentar reconectar si fue un cierre limpio (código 1000)
        if (event.code === 1000) {
          console.log('Conexión cerrada limpiamente por el servidor');
          return;
        }

        // Intentar reconectar con backoff exponencial
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          
          console.log(`🔄 Intentando reconectar en ${delay/1000} segundos... (Intento ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          setError('No se pudo conectar al servidor. Por favor, recarga la página para intentar nuevamente.');
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ Error en la conexión WebSocket:', error);
        setIsConnected(false);
        setError('Error de conexión con el servidor');
      };
    } catch (err) {
      console.error('❌ Error al crear la conexión WebSocket:', err);
      setIsConnected(false);
      setError('No se pudo conectar al servidor');
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    // Limpiar al desmontar
    return () => {
      console.log('🧹 Limpiando conexión WebSocket');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close(1000, 'Componente desmontado');
      }
    };
  }, [connectWebSocket]);

  const handleSelectChat = (chat) => {
    console.log('Chat seleccionado:', chat);
    setSelectedChat(chat);
  };

  return (
    <>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ width: '30%', height: '100%', borderRight: '1px solid #e0e0e0' }}>
          <ChatsList 
            onSelectChat={handleSelectChat} 
            selectedChat={selectedChat} 
            data-testid="chats-list"
            sx={{ height: '100%' }}
          />
        </Box>
        <Box sx={{ width: '70%', height: '100%' }}>
          <ChatWindow 
            selectedChat={selectedChat} 
            isConnected={isConnected} 
            data-testid="chat-window"
            sx={{ height: '100%' }}
          />
        </Box>
      </Box>

      {/* Notificación de error */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Indicador de conexión */}
      <Box sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 12,
        height: 12,
        borderRadius: '50%',
        bgcolor: isConnected ? '#4caf50' : '#f44336',
        border: '2px solid white',
        boxShadow: '0 0 10px rgba(0,0,0,0.2)',
        zIndex: 9999
      }} />
    </>
  );
};

export default ChatsPage;
