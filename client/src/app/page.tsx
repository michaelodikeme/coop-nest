'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Card, 
  Grid,
  Stack,
  useTheme
} from '@mui/material';
import { 
  Savings as SavingsIcon,
  AccountBalance as AccountBalanceIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon 
} from '@mui/icons-material';

export default function Home() {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main}dd, ${theme.palette.primary.dark})`,
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("/pattern.svg")',
            opacity: 0.1,
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 6,
            alignItems: 'center' 
          }}>
            <Box>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #fff, #f0f0f0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Welcome to Coop Nest
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Your trusted partner in financial growth and community development
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  component={Link}
                  href="/auth/login"
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(4px)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px 0 rgba(0,0,0,0.3)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Login to Account
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large"
                  component={Link}
                  href="/auth/register"
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    borderColor: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(4px)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Join Now
                </Button>
              </Stack>
            </Box>
            <Box 
              sx={{ 
                position: 'relative', 
                height: 400,
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.2))',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-20px)' }
                }
              }}
            >
              <Image
                src="/globe.svg"
                alt="Cooperative Growth"
                fill
                style={{ 
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card 
              sx={{ 
                height: '100%',
                p: 3,
                background: theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <SavingsIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Savings</Typography>
              <Typography variant="body2" color="text.secondary">
                Secure and grow your savings with competitive interest rates
              </Typography>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 3 }}>
            <Card 
              sx={{ 
                height: '100%',
                p: 3,
                background: theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Loans</Typography>
              <Typography variant="body2" color="text.secondary">
                Access flexible loan options tailored to your needs
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card 
              sx={{ 
                height: '100%',
                p: 3,
                background: theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <GroupsIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Community</Typography>
              <Typography variant="body2" color="text.secondary">
                Join a thriving community of members supporting each other
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card 
              sx={{ 
                height: '100%',
                p: 3,
                background: theme.palette.background.paper,
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>Growth</Typography>
              <Typography variant="body2" color="text.secondary">
                Watch your investments grow through share ownership
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
