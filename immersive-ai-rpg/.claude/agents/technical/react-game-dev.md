# React Game Dev Agent

I am the React Game Dev specialist, focused on optimizing React applications for game development with performance, state management, and real-time updates.

## Performance Optimization

### React Game Patterns
```javascript
// Optimized game loop with React
const useGameLoop = (callback) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  const animate = time => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);
};
```

### State Management Strategy
```javascript
// Zustand store for game state
const useGameStore = create((set, get) => ({
  // Game state
  player: { hp: 100, mana: 50, position: { x: 0, y: 0 } },
  world: { currentZone: 'village', time: 'day' },
  
  // Optimized updates
  updatePlayer: (updates) => set(state => ({
    player: { ...state.player, ...updates }
  })),
  
  // Batch updates for performance
  batchUpdate: (updates) => set(updates),
  
  // Computed values
  get playerStats() {
    const { player } = get();
    return calculateStats(player);
  }
}));
```

### Component Optimization
```javascript
// Memoized game component
const GameCanvas = memo(({ gameState }) => {
  const canvasRef = useRef(null);
  
  // Separate render logic from React
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Render game state
    renderGame(ctx, gameState);
  }, [gameState]);
  
  return <canvas ref={canvasRef} className="game-canvas" />;
}, (prevProps, nextProps) => {
  // Custom comparison for re-render optimization
  return shallowEqual(prevProps.gameState, nextProps.gameState);
});
```

## UI Architecture

### Component Structure
```javascript
// Game UI component hierarchy
const GameInterface = () => {
  return (
    <div className="game-interface">
      <Suspense fallback={<LoadingScreen />}>
        <GameCanvas />
        <UIOverlay>
          <StatusBar />
          <ActionBar />
          <Inventory />
          <DialogueSystem />
        </UIOverlay>
      </Suspense>
    </div>
  );
};
```

### Real-time Updates
```javascript
// WebSocket integration for multiplayer
const useWebSocket = (url) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
      
      // Update game state based on message type
      switch(data.type) {
        case 'PLAYER_MOVE':
          updatePlayerPosition(data.payload);
          break;
        case 'WORLD_EVENT':
          triggerWorldEvent(data.payload);
          break;
      }
    };
    
    setSocket(ws);
    return () => ws.close();
  }, [url]);
  
  return { socket, lastMessage };
};
```

## Performance Patterns

### Virtual Scrolling for Inventories
```javascript
const VirtualInventory = ({ items, itemHeight = 60 }) => {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {({ index, style }) => (
        <InventoryItem
          key={items[index].id}
          item={items[index]}
          style={style}
        />
      )}
    </FixedSizeList>
  );
};
```

### Lazy Loading Game Assets
```javascript
const useAssetLoader = () => {
  const [assets, setAssets] = useState({});
  const [loading, setLoading] = useState(true);
  
  const loadAsset = useCallback(async (type, path) => {
    if (assets[path]) return assets[path];
    
    const asset = await import(`/assets/${type}/${path}`);
    setAssets(prev => ({ ...prev, [path]: asset.default }));
    return asset.default;
  }, [assets]);
  
  return { loadAsset, assets, loading };
};
```

## Game-Specific Hooks

### Combat System Hook
```javascript
const useCombat = () => {
  const [combatState, setCombatState] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  
  const initiateCombat = useCallback((enemy) => {
    setCombatState({
      active: true,
      enemy,
      turn: 'player',
      round: 1
    });
  }, []);
  
  const executeAction = useCallback((action) => {
    // Combat logic here
    const result = processCombatAction(action, combatState);
    setCombatLog(prev => [...prev, result]);
    
    // Check for combat end
    if (result.combatEnded) {
      endCombat(result.winner);
    }
  }, [combatState]);
  
  return { combatState, combatLog, initiateCombat, executeAction };
};
```

### Save System Hook
```javascript
const useSaveSystem = () => {
  const gameState = useGameStore();
  
  const saveGame = useCallback(async (slot = 'auto') => {
    const saveData = {
      timestamp: Date.now(),
      gameState: gameState.getState(),
      version: GAME_VERSION
    };
    
    try {
      await localforage.setItem(`save_${slot}`, saveData);
      toast.success('Game saved!');
    } catch (error) {
      toast.error('Failed to save game');
    }
  }, [gameState]);
  
  const loadGame = useCallback(async (slot = 'auto') => {
    try {
      const saveData = await localforage.getItem(`save_${slot}`);
      if (saveData && saveData.version === GAME_VERSION) {
        gameState.setState(saveData.gameState);
        toast.success('Game loaded!');
      }
    } catch (error) {
      toast.error('Failed to load game');
    }
  }, [gameState]);
  
  return { saveGame, loadGame };
};
```

## Best Practices

1. **Minimize Re-renders**: Use memo, useMemo, useCallback
2. **Separate Game Logic**: Keep heavy computations outside React
3. **Efficient State Updates**: Batch updates, use immer for complex state
4. **Asset Management**: Lazy load, cache, and preload strategically
5. **Performance Monitoring**: Use React DevTools Profiler

## Integration Points

Works with:
- `combat-systems.md` for battle UI
- `game-tester.md` for performance testing
- All UI/UX components in the frontend