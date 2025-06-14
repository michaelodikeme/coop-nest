import { useDispatch, useSelector } from '@/lib/hooks/redux/useStore';
import { 
  toggleSidebar, 
  setSidebarOpen, 
  openModal, 
  closeModal, 
  closeAllModals,
  addToast,
  removeToast,
  setActiveTab
} from '@/lib/hooks/redux/store/slices/uiSlice';

interface UseUIReturn {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  // Modals
  isModalOpen: (modalId: string) => boolean;
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  
  // Toasts
  addToast: (toast: { message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number }) => void;
  removeToast: (id: string) => void;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number }>;
  
  // Tabs
  setActiveTab: (key: string, value: number) => void;
  getActiveTab: (key: string) => number;
}

/**
 * Hook for managing UI state and operations
 */
export function useUI(): UseUIReturn {
  const dispatch = useDispatch();
  const ui = useSelector(state => state.ui);
  
  /**
   * Get the active tab for a specific section
   */
  const getActiveTab = (key: string): number => {
    return ui.activeTab[key] || 0;
  };
  
  /**
   * Check if a specific modal is open
   */
  const isModalOpen = (modalId: string): boolean => {
    return !!ui.isModalOpen[modalId];
  };
  
  /**
   * Set active tab for a specific section
   */
  const handleSetActiveTab = (key: string, value: number) => {
    dispatch(setActiveTab({ key, value }));
  };
  
  /**
   * Add a toast notification
   */
  const handleAddToast = (toast: { message: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number }) => {
    dispatch(addToast(toast));
  };
  
  /**
   * Remove a toast notification
   */
  const handleRemoveToast = (id: string) => {
    dispatch(removeToast(id));
  };

  return {
    // Sidebar
    isSidebarOpen: ui.isSidebarOpen,
    toggleSidebar: () => dispatch(toggleSidebar()),
    setSidebarOpen: (isOpen: boolean) => dispatch(setSidebarOpen(isOpen)),
    
    // Modals
    isModalOpen,
    activeModal: ui.activeModal,
    openModal: (modalId: string) => dispatch(openModal(modalId)),
    closeModal: (modalId: string) => dispatch(closeModal(modalId)),
    closeAllModals: () => dispatch(closeAllModals()),
    
    // Toasts
    toasts: ui.toasts,
    addToast: handleAddToast,
    removeToast: handleRemoveToast,
    
    // Tabs
    setActiveTab: handleSetActiveTab,
    getActiveTab,
  };
}
