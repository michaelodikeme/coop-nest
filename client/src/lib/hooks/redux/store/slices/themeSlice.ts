import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
}

const initialState: ThemeState = {
  mode: 'system',
  isDarkMode: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (
      state,
      action: PayloadAction<'light' | 'dark' | 'system'>
    ) => {
      state.mode = action.payload;
    },
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
  },
});

export const { setThemeMode, setIsDarkMode } = themeSlice.actions;
export default themeSlice.reducer;
