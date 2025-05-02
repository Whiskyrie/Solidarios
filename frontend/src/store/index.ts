/**
 * Configuração da store Redux
 */
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";

// Configuração da store com os reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Adicione outros reducers aqui conforme necessário
  },
  // Middleware personalizado pode ser adicionado aqui
});

// Tipos de inferência
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks customizados com tipagem
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
