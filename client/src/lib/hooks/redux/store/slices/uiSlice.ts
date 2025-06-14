import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface UIState {
  isSidebarOpen: boolean;
  isModalOpen: { [key: string]: boolean };
  activeModal: string | null;
  toasts: Toast[];
  isLoading: boolean;
  activeTab: { [key: string]: number };
}

const initialState: UIState = {
  isSidebarOpen: true,
  isModalOpen: {},
  activeModal: null,
  toasts: [],
  isLoading: false,
  activeTab: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.isModalOpen[action.payload] = true;
      state.activeModal = action.payload;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.isModalOpen[action.payload] = false;
      if (state.activeModal === action.payload) {
        state.activeModal = null;
      }
    },
    closeAllModals: (state) => {
      state.isModalOpen = {};
      state.activeModal = null;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({
        id,
        ...action.payload,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<{ key: string; value: number }>) => {
      state.activeTab[action.payload.key] = action.payload.value;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  closeAllModals,
  addToast,
  removeToast,
  setIsLoading,
  setActiveTab,
} = uiSlice.actions;
export default uiSlice.reducer;
