import { Box, Container, Grid, Skeleton } from '@mui/material';

export default function DashboardSkeleton() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="text" width={400} height={24} />
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Skeleton variant="rectangular" height={160} />
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Skeleton variant="rectangular" height={400} />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Skeleton variant="rectangular" height={400} />
        </Grid>
      </Grid>
    </Container>
  );
}