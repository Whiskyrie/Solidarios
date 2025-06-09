/**
 * Configuração da store Redux
 */
import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import { setDispatchReference } from "./slices/authHelpers";

// Configuração da store com os reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Adicione outros reducers aqui conforme necessário
  },
  // Middleware personalizado pode ser adicionado aqui
});

// Configurar a referência do dispatch
setDispatchReference(store.dispatch);

// Tipos de inferência
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks customizados com tipagem
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
