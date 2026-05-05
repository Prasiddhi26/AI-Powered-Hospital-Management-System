import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { authAPI } from "../api";
import { toast } from "react-toastify";

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Reducer ─────────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, loading: true, error: null };
    case "AUTH_SUCCESS":
      return { ...state, loading: false, user: action.payload.user, token: action.payload.token, isAuthenticated: true };
    case "AUTH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "LOGOUT":
      return { ...initialState, loading: false };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // Start true to check persisted session
  error: null,
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem("mediflow_token");
    const storedUser = localStorage.getItem("mediflow_user");

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: "AUTH_SUCCESS", payload: { user, token } });
        // Verify token is still valid with server
        verifyToken();
      } catch {
        localStorage.clear();
        dispatch({ type: "LOGOUT" });
      }
    } else {
      dispatch({ type: "LOGOUT" }); // Stops loading
    }
  }, []); // eslint-disable-line

  const verifyToken = async () => {
    try {
      const { data } = await authAPI.getMe();
      dispatch({ type: "UPDATE_USER", payload: data.user });
    } catch {
      logout();
    }
  };

  const login = async (credentials) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem("mediflow_token", data.token);
      localStorage.setItem("mediflow_user", JSON.stringify(data.user));
      dispatch({ type: "AUTH_SUCCESS", payload: { user: data.user, token: data.token } });
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      return { success: true, role: data.user.role };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      dispatch({ type: "AUTH_FAIL", payload: message });
      toast.error(message);
      return { success: false };
    }
  };

  const register = async (userData) => {
    dispatch({ type: "AUTH_START" });
    try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem("mediflow_token", data.token);
      localStorage.setItem("mediflow_user", JSON.stringify(data.user));
      dispatch({ type: "AUTH_SUCCESS", payload: { user: data.user, token: data.token } });
      toast.success("Account created successfully! 🎉");
      return { success: true, role: data.user.role };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      dispatch({ type: "AUTH_FAIL", payload: message });
      toast.error(message);
      return { success: false };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("mediflow_token");
    localStorage.removeItem("mediflow_user");
    dispatch({ type: "LOGOUT" });
    toast.info("You have been logged out");
  }, []);

  const updateUser = (userData) => {
    const updated = { ...state.user, ...userData };
    localStorage.setItem("mediflow_user", JSON.stringify(updated));
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};