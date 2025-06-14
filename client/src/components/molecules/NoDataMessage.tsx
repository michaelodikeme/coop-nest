import { Box, Typography, SvgIcon, useTheme } from '@mui/material';

interface NoDataMessageProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export function NoDataMessage({ title, message, icon }: NoDataMessageProps) {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      p: 4
    }}>
      {icon ? (
        icon
      ) : (
        <SvgIcon 
          sx={{ 
            fontSize: 64, 
            color: theme.palette.text.disabled,
            mb: 2
          }} 
          viewBox="0 0 24 24"
        >
          <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 12.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5zm0-5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
          <path d="M6 11h2V9H6zm10 0h2V9h-2zm0 4h2v-2h-2zm-10 0h2v-2H6z" />
        </SvgIcon>
      )}
      
      <Typography variant="h6" color="text.primary" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}