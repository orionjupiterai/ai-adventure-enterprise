import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useGameStore, usePlayerStore, useWorldStore } from '@store';
import toast from 'react-hot-toast';

export const useWebSocket = (url = '/ws') => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  
  const { updateGameState, setCurrentScene, addToHistory } = useGameStore();
  const { updatePlayer } = usePlayerStore();
  const { updateWorld } = useWorldStore();

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      setConnected(true);
      reconnectAttemptsRef.current = 0;
      toast.success('Connected to game server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      toast.error('Disconnected from game server');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      reconnectAttemptsRef.current = attemptNumber;
      toast.loading(`Reconnecting... (${attemptNumber}/5)`);
    });

    newSocket.on('reconnect_failed', () => {
      toast.error('Failed to reconnect to game server');
    });

    // Game events
    newSocket.on('game:update', (data) => {
      updateGameState(data);
    });

    newSocket.on('scene:change', (scene) => {
      setCurrentScene(scene);
    });

    newSocket.on('player:update', (playerData) => {
      updatePlayer(playerData);
    });

    newSocket.on('world:update', (worldData) => {
      updateWorld(worldData);
    });

    newSocket.on('narrative:update', (narrative) => {
      addToHistory({
        type: 'narrative',
        data: narrative,
      });
    });

    newSocket.on('combat:start', (combatData) => {
      useGameStore.getState().startCombat(combatData.enemy);
    });

    newSocket.on('combat:update', (combatUpdate) => {
      updateGameState({ combat: combatUpdate });
    });

    newSocket.on('combat:end', (result) => {
      useGameStore.getState().endCombat(result);
    });

    newSocket.on('npc:interaction', (npcData) => {
      useGameStore.getState().startNPCInteraction(npcData);
    });

    newSocket.on('quest:update', (questData) => {
      if (questData.type === 'new') {
        useWorldStore.getState().startQuest(questData.quest);
      } else if (questData.type === 'complete') {
        useWorldStore.getState().completeQuest(questData.questId);
      }
    });

    newSocket.on('error', (error) => {
      toast.error(error.message || 'Game error occurred');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url]);

  // Send message to server
  const sendMessage = useCallback((message) => {
    if (socket && connected) {
      socket.emit('message', message);
    } else {
      toast.error('Not connected to game server');
    }
  }, [socket, connected]);

  // Send typed message
  const sendTypedMessage = useCallback((type, payload) => {
    sendMessage({ type, payload, timestamp: Date.now() });
  }, [sendMessage]);

  // Specific game actions
  const sendPlayerAction = useCallback((action) => {
    sendTypedMessage('player:action', action);
  }, [sendTypedMessage]);

  const sendCombatAction = useCallback((action) => {
    sendTypedMessage('combat:action', action);
  }, [sendTypedMessage]);

  const sendDialogueChoice = useCallback((choice) => {
    sendTypedMessage('dialogue:choice', choice);
  }, [sendTypedMessage]);

  const requestSceneUpdate = useCallback(() => {
    sendTypedMessage('scene:request', {});
  }, [sendTypedMessage]);

  return {
    socket,
    connected,
    sendMessage,
    sendTypedMessage,
    sendPlayerAction,
    sendCombatAction,
    sendDialogueChoice,
    requestSceneUpdate,
  };
};