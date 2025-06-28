import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Snackbar, Alert, Typography } from '@mui/material';
import ChatsList from '../components/ChatsList';
import ChatWindow from '../components/ChatWindow';

const ChatsPage = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
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
            
              // Crear un solo evento global que se propagará a través del DOM
            const messageEvent = new CustomEvent('newMessage', { 
              detail: message,
              bubbles: true,
              cancelable: true
            });
            
            // Disparar el evento una sola vez en el documento
            console.log('🚀 Disparando evento newMessage');
            document.dispatchEvent(messageEvent);
            
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
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ Error en la conexión WebSocket:', error);
        setIsConnected(false);
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

  // Efecto para depurar cambios en el estado de conexión
  useEffect(() => {
    console.log('🔌 Estado de conexión actualizado:', isConnected ? 'CONECTADO' : 'DESCONECTADO');
  }, [isConnected]);

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        height: 'calc(100vh - 64px)',
        background: 'transparent',
        '& > *': {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      }}>
        <Box sx={{ 
          width: '30%', 
          height: '100%', 
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: 'transparent !important',
          '& > *': {
            backgroundColor: 'transparent !important',
          }
        }}>
          <ChatsList 
            onSelectChat={handleSelectChat} 
            selectedChat={selectedChat} 
            isConnected={isConnected}
            data-testid="chats-list"
            sx={{ 
              height: '100%',
              backgroundColor: 'transparent !important',
            }}
          />
        </Box>
        <Box sx={{ 
          width: '70%', 
          height: '100%',
          backgroundColor: 'transparent !important',
          '& > *': {
            backgroundColor: 'transparent !important',
          }
        }}>
          <ChatWindow 
            selectedChat={selectedChat} 
            isConnected={isConnected} 
            data-testid="chat-window"
            sx={{ 
              height: '100%',
              backgroundColor: 'transparent !important',
              '& > *': {
                backgroundColor: 'transparent !important',
              }
            }}
          />
        </Box>
      </Box>

    </>
  );
};

export default ChatsPage;
