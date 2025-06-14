import { Box, Grid, Card, CardContent, Skeleton, Stack } from '@mui/material';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function LoadingSavingsPage() {
  return (
    <DashboardLayout>
      <Box sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Summary Card Skeletons */}
          {[1, 2, 3].map((key) => (
            <Grid size={{ xs: 12, md: 4 }} key={key}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={48} />
                  <Skeleton variant="rectangular" width={120} height={36} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Chart and Transactions Skeleton */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={300} />
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                  {[1, 2, 3].map((key) => (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Skeleton variant="text" width="100%" height={64} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Withdrawal Requests Skeleton */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                {[1, 2, 3].map((key) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="100%" height={48} />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}