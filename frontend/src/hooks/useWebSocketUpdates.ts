import { useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'LISTING_CREATED' | 'LISTING_RESERVED' | 'LISTING_COLLECTED' | string;
  data: any;
}

export const useWebSocketUpdates = (onMessage: (msg: WebSocketMessage) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedCallback = useRef(onMessage);

  useEffect(() => {
    savedCallback.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // Construct WebSocket URL matching current location or dev backend
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || 'localhost:8000';
    const wsUrl = `${protocol}//${host}/ws/updates`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketMessage = JSON.parse(event.data);
          savedCallback.current(parsed);
        } catch (err) {
          console.error('Error parsing WebSocket message', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error encountered:', err);
      };

      ws.onclose = () => {
        console.log('WebSocket closed, attempting reconnect in 3s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (e) {
      console.error('Failed to create WebSocket instance', e);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
};
