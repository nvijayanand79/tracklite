// Re-export auth utilities for easier importing across the app
export { authUtils } from '../pages/Login'
import { authUtils } from '../pages/Login'

// Additional auth-related utilities can be added here
export const useAuth = () => {
  return {
    isAuthenticated: authUtils.isAuthenticated(),
    login: authUtils.setToken,
    logout: authUtils.removeToken,
    getToken: authUtils.getToken,
  }
}
