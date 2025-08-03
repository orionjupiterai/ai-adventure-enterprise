export const createAuthSlice = (set, get) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  authToken: null,
  refreshToken: null,
  
  // Actions
  login: async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      set((state) => {
        state.user = data.user;
        state.isAuthenticated = true;
        state.authToken = data.token;
        state.refreshToken = data.refreshToken;
      });
      
      // Store tokens in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    set((state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authToken = null;
      state.refreshToken = null;
    });
    
    // Clear tokens from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },
  
  updateUser: (updates) => {
    set((state) => {
      Object.assign(state.user, updates);
    });
  },
  
  // Initialize auth from localStorage
  initAuth: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token and fetch user data
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          set((state) => {
            state.user = data.user;
            state.isAuthenticated = true;
            state.authToken = token;
          });
        })
        .catch(() => {
          // Token invalid, clear auth
          get().logout();
        });
    }
  },
});