# Frontend Documentation - CoopNest Client

## Overview

The CoopNest frontend is a modern Next.js 15 application built with TypeScript, providing a sophisticated user interface for cooperative savings and loan management. It features role-based access control, real-time data synchronization, and a comprehensive component library following atomic design principles.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 18
- **Language**: TypeScript
- **State Management**:
  - Redux Toolkit (global state)
  - TanStack Query / React Query (server state)
- **UI Framework**: Material-UI (MUI) v7
- **Styling**:
  - Tailwind CSS
  - Emotion (CSS-in-JS for MUI)
- **Forms**: React Hook Form + Yup/Zod validation
- **Charts**: Chart.js, Recharts
- **HTTP Client**: Axios
- **Notifications**: Notistack
- **Date Handling**: date-fns
- **Icons**: MUI Icons, Heroicons, Lucide React

## Project Structure

```
client/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard routes
│   │   ├── auth/              # Authentication pages
│   │   ├── member/            # Member dashboard routes
│   │   ├── contact/           # Contact page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   ├── providers.tsx      # Global providers wrapper
│   │   └── globals.css        # Global styles
│   ├── components/            # Component library (Atomic Design)
│   │   ├── atoms/             # Basic building blocks
│   │   ├── molecules/         # Simple component combinations
│   │   ├── organisms/         # Complex component combinations
│   │   ├── templates/         # Page layouts
│   │   ├── features/          # Feature-specific components
│   │   └── auth/              # Auth-specific components
│   ├── lib/                   # Core utilities and services
│   │   ├── api/               # API integration layer
│   │   │   ├── services/      # API service modules
│   │   │   ├── contexts/      # React contexts (Auth, Health)
│   │   │   ├── auth/          # Auth storage utilities
│   │   │   ├── apiService.ts  # Axios instance & interceptors
│   │   │   └── index.ts       # API exports
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── redux/         # Redux store configuration
│   │   ├── theme/             # MUI theme configuration
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   └── constants/         # Application constants
│   ├── types/                 # TypeScript type definitions
│   ├── validations/           # Form validation schemas
│   ├── styles/                # Additional stylesheets
│   └── utils/                 # Shared utilities
├── public/                    # Static assets
└── package.json
```

## Architecture Patterns

### Component Organization (Atomic Design)

**Atoms** (`components/atoms/`):
- Basic UI elements (Button, Input, Badge, Avatar, etc.)
- No business logic
- Highly reusable
- Example: Custom buttons, form inputs, icons

**Molecules** (`components/molecules/`):
- Combinations of atoms
- Simple functionality
- Examples:
  - `FormField.tsx` - Label + Input + Error message
  - `StatCard.tsx` - Card with statistics display
  - `DateRangePicker.tsx` - Date range selection
  - `ApprovalChain.tsx` - Multi-step approval display
  - `ExportDialog.tsx` - Data export modal

**Organisms** (`components/organisms/`):
- Complex components with business logic
- Combine molecules and atoms
- Examples:
  - Data tables with pagination
  - Complex forms
  - Navigation components
  - Dashboard widgets

**Templates** (`components/templates/`):
- Page-level layouts
- Define page structure
- Examples:
  - Dashboard layout
  - Form layout
  - Detail view layout

**Features** (`components/features/`):
- Feature-specific component groups
- Self-contained functionality
- Examples:
  - Loan application flow
  - Savings management
  - User management

### State Management Strategy

#### Redux Toolkit (Global State)
Located in `lib/hooks/redux/store`

**Use cases**:
- User authentication state
- Global UI state (theme, sidebar, modals)
- Shared data across many components
- Complex state logic

**Store Structure**:
```typescript
{
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    loading: boolean
  },
  ui: {
    sidebarOpen: boolean,
    theme: 'light' | 'dark'
  },
  // ... other slices
}
```

#### TanStack Query (Server State)
Configured in `app/providers.tsx`

**Use cases**:
- API data fetching
- Caching server responses
- Automatic refetching
- Optimistic updates
- Pagination and infinite scroll

**Configuration**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
```

**Common patterns**:
```typescript
// In a component
const { data, isLoading, error } = useQuery({
  queryKey: ['loans', userId],
  queryFn: () => loanService.getUserLoans(userId)
});

// Mutations
const mutation = useMutation({
  mutationFn: (data) => loanService.createLoan(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['loans']);
  }
});
```

## API Integration Layer

### API Service Architecture

**Base Service** (`lib/api/apiService.ts`):
- Singleton Axios instance
- Automatic token attachment
- Token refresh logic
- Error handling & retry logic
- Health check polling

```typescript
class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;

  // Automatic token refresh on 401
  // Blacklist handling
  // System health monitoring
}
```

**Service Modules** (`lib/api/services/`):
Each domain has a dedicated service:
- `authService.ts` - Authentication operations
- `userService.ts` - User management
- `biodataService.ts` - Member profiles (implicitly via memberService)
- `accountService.ts` - Bank accounts
- `savingsService.ts` - Savings operations
- `personalSavingsService.ts` - Personal savings plans
- `loanService.ts` - Loan management
- `transactionService.ts` - Transaction history
- `requestService.ts` - Request/approval workflows
- `approvalService.ts` - Approval operations
- `roleService.ts` - Role management
- `settingsService.ts` - System settings
- `notificationsService.ts` - Notifications

**Service Pattern**:
```typescript
export class LoanService {
  async getLoans(params?: QueryParams) {
    return apiService.get('/loan', { params });
  }

  async createLoan(data: CreateLoanDTO) {
    return apiService.post('/loan', data);
  }

  async approveLoan(id: string, data: ApprovalData) {
    return apiService.post(`/loan/${id}/approve`, data);
  }
}

export const loanService = new LoanService();
```

### Authentication Flow

**Storage** (`lib/api/auth/authStorage.ts`):
```typescript
// Token management
setStoredAuthTokens({ accessToken, refreshToken });
getStoredAuthTokens();
clearAuthTokens();
```

**Context** (`lib/api/contexts/AuthContext.tsx`):
```typescript
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async (credentials) => { ... },
  logout: async () => { ... },
  isAuthenticated: boolean,
  loading: boolean
});

// Usage
const { user, login, logout } = useAuth();
```

**Protected Routes**:
```typescript
// In page component or layout
'use client';

import { useAuth } from '@/lib/api/contexts/AuthContext';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) redirect('/auth/login');

  return <PageContent />;
}
```

**Token Refresh**:
Handled automatically by ApiService:
1. Request fails with 401
2. Attempt token refresh with refresh token
3. Retry original request with new token
4. If refresh fails, redirect to login

### Error Handling

**API Error Types** (from `apiService.ts`):
```typescript
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  TOKEN_EXPIRED = 'token_expired',
  SESSION_EXPIRED = 'session_expired',
  PERMISSION_DENIED = 'permission_denied',
  // ... more types
}
```

**Error Handling Pattern**:
```typescript
try {
  const result = await loanService.createLoan(data);
  showSuccess('Loan created successfully');
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || 'Operation failed';
    showError(message);
  }
}
```

## Application Routes

### Public Routes
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/register` - Registration (if applicable)
- `/contact` - Contact page

### Admin Routes (`app/admin/`)
Protected routes for administrative users:
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/members` - Member management
- `/admin/loans` - Loan management
- `/admin/savings` - Savings oversight
- `/admin/transactions` - Transaction history
- `/admin/requests` - Approval queue
- `/admin/settings` - System settings
- `/admin/reports` - Reports and analytics

### Member Routes (`app/member/`)
Protected routes for regular members:
- `/member/dashboard` - Member dashboard
- `/member/profile` - Profile management
- `/member/savings` - Savings overview
- `/member/loans` - Loan applications and status
- `/member/transactions` - Transaction history
- `/member/requests` - Request status

## Form Management

### React Hook Form Pattern

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  amount: yup.number().required().positive(),
  purpose: yup.string().required().min(10)
});

function LoanApplicationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    await loanService.createLoan(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register('amount')}
        error={!!errors.amount}
        helperText={errors.amount?.message}
      />
      <Button type="submit" disabled={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
```

### Validation Schemas (`validations/`)

Centralized validation schemas for reuse:
- Form validation
- Client-side validation
- Type inference

## UI Components

### MUI Theme (`lib/theme/`)

**Theme Configuration**:
- Custom color palette
- Typography settings
- Component overrides
- Dark/light mode support

**Theme Registry**:
```typescript
// lib/theme/ThemeRegistry.tsx
// Provides theme to entire app
// Handles SSR for emotion styles
```

### Common Components

**Data Tables**:
- MUI DataGrid for complex tables
- Built-in pagination, sorting, filtering
- Export functionality
- Custom cell renderers

**Forms**:
- Reusable form fields
- Validation display
- Loading states
- Error handling

**Charts**:
- Chart.js for line/bar charts
- Recharts for specialized visualizations
- Responsive design

**Notifications**:
```typescript
import { useSnackbar } from 'notistack';

const { enqueueSnackbar } = useSnackbar();

enqueueSnackbar('Success message', { variant: 'success' });
enqueueSnackbar('Error message', { variant: 'error' });
```

## Custom Hooks

Common custom hooks (`lib/hooks/`):

```typescript
// useAuth - Authentication state and actions
const { user, login, logout, isAuthenticated } = useAuth();

// usePermissions - Check user permissions
const { hasPermission, can } = usePermissions();
if (can('APPROVE_LOAN')) { ... }

// useDebounce - Debounce values (from use-debounce package)
const debouncedSearch = useDebounce(searchTerm, 500);

// useLocalStorage - Persist state to localStorage
const [value, setValue] = useLocalStorage('key', defaultValue);
```

## TypeScript Types

### Key Type Definitions (`types/`)

**Auth Types**:
```typescript
interface User {
  id: string;
  username: string;
  role: {
    name: string;
    isAdmin: boolean;
  };
  permissions: string[];
  biodataId?: string;
  erpId?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
```

**API Types**:
```typescript
interface ApiResponse<T> {
  success: boolean;
  status: string;
  message: string;
  data?: T;
}

interface ApiErrorResponse {
  success: false;
  status: 'error';
  message: string;
  code: number;
  errors?: ValidationError[];
}
```

**Business Types**:
```typescript
interface Loan {
  id: string;
  memberId: string;
  loanTypeId: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: LoanStatus;
  // ... more fields
}

interface Savings {
  id: string;
  memberId: string;
  balance: number;
  month: number;
  year: number;
  status: AccountStatus;
}
```

## Styling Approach

### Tailwind CSS
Used for:
- Layout (flex, grid)
- Spacing (margins, padding)
- Responsive design
- Utility classes

```tsx
<div className="flex flex-col gap-4 p-6 md:flex-row">
  <Card className="flex-1 rounded-lg shadow-md">
    ...
  </Card>
</div>
```

### MUI Styling
Used for:
- Component theming
- Material Design components
- Complex styled components

```tsx
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));
```

### CSS Modules
For component-specific styles when needed.

## Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />
});
```

### Memoization
```typescript
import { useMemo, useCallback } from 'react';

const expensiveCalculation = useMemo(() => {
  return computeHeavyData(data);
}, [data]);

const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // for above-the-fold images
/>
```

### React Query Optimization
- Stale time configuration
- Cache management
- Selective refetching
- Optimistic updates

## Development Workflow

### Running the Application

```bash
# Install dependencies
npm install

# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

Application runs on `http://localhost:3000` by default.

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NODE_ENV=development
```

Access in code:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

## Testing

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { LoanCard } from './LoanCard';

test('renders loan information', () => {
  render(<LoanCard loan={mockLoan} />);
  expect(screen.getByText(/Principal Amount/i)).toBeInTheDocument();
});
```

### Integration Testing
Testing API integration and user flows.

## Role-Based UI

### Conditional Rendering

```typescript
const { user, hasPermission } = useAuth();

return (
  <>
    {hasPermission('VIEW_LOANS') && (
      <LoansSection />
    )}

    {user?.role.name === 'SUPER_ADMIN' && (
      <AdminControls />
    )}

    {hasPermission('APPROVE_LOAN') && (
      <ApprovalButton />
    )}
  </>
);
```

### Route Protection

```typescript
// In layout.tsx or page.tsx
const REQUIRED_PERMISSIONS = ['VIEW_ADMIN_DASHBOARD'];

export default function AdminLayout({ children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(...REQUIRED_PERMISSIONS)) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
```

## Common Patterns

### Data Fetching Pattern

```typescript
function LoansPage() {
  const { data: loans, isLoading, error } = useQuery({
    queryKey: ['loans'],
    queryFn: loanService.getLoans
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!loans?.length) return <EmptyState />;

  return <LoansList loans={loans} />;
}
```

### Form Submission Pattern

```typescript
function CreateLoanForm() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const mutation = useMutation({
    mutationFn: loanService.createLoan,
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      enqueueSnackbar('Loan created successfully', { variant: 'success' });
      router.push('/member/loans');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create loan';
      enqueueSnackbar(message, { variant: 'error' });
    }
  });

  const onSubmit = (data) => mutation.mutate(data);

  return <FormComponent onSubmit={onSubmit} loading={mutation.isPending} />;
}
```

### Modal/Dialog Pattern

```typescript
function DeleteConfirmDialog({ open, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        Are you sure you want to delete this item?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleConfirm} color="error" disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## System Health Monitoring

**Health Context** (`lib/api/contexts/SystemHealthContext.tsx`):
- Monitors API health status
- Displays connectivity warnings
- Automatic reconnection

```typescript
const { health, isHealthy } = useSystemHealth();

{!isHealthy && (
  <Alert severity="warning">
    System is experiencing issues
  </Alert>
)}
```

## Best Practices

1. **Component Organization**:
   - Keep components small and focused
   - Follow atomic design principles
   - Extract reusable logic to hooks

2. **State Management**:
   - Use React Query for server state
   - Use Redux for complex global state
   - Keep local state local

3. **Type Safety**:
   - Define interfaces for all data structures
   - Use TypeScript strictly, avoid `any`
   - Leverage type inference

4. **Performance**:
   - Memoize expensive calculations
   - Use dynamic imports for code splitting
   - Optimize images with Next.js Image

5. **Error Handling**:
   - Always handle API errors
   - Provide meaningful error messages
   - Show loading and error states

6. **Accessibility**:
   - Use semantic HTML
   - Provide aria labels
   - Keyboard navigation support

7. **Responsive Design**:
   - Mobile-first approach
   - Test on multiple screen sizes
   - Use MUI breakpoints and Tailwind responsive classes

8. **Code Quality**:
   - Use ESLint for code quality
   - Follow naming conventions
   - Write self-documenting code

## Deployment

### Build Process

```bash
# Create production build
npm run build

# Output: .next/ directory
# Contains optimized production build
```

### Environment Configuration

Production environment variables:
```env
NEXT_PUBLIC_API_URL=https://api.production.com/api
NODE_ENV=production
```

### Docker Deployment

The application is containerized and runs alongside the backend in Docker Compose:
- Client runs on port 3000
- Connects to backend at configured API URL

## Troubleshooting

### Common Issues

1. **API Connection Errors**:
   - Check `NEXT_PUBLIC_API_URL` is set correctly
   - Verify backend is running
   - Check CORS configuration

2. **Authentication Issues**:
   - Clear browser localStorage
   - Check token expiration
   - Verify backend JWT configuration

3. **Build Errors**:
   - Clear `.next/` directory
   - Delete `node_modules/` and reinstall
   - Check TypeScript errors

4. **Styling Issues**:
   - Check Tailwind configuration
   - Verify MUI theme setup
   - Clear browser cache

5. **State Synchronization**:
   - Check React Query cache
   - Verify invalidation calls
   - Check Redux DevTools

## Additional Resources

- Next.js Documentation: https://nextjs.org/docs
- React Documentation: https://react.dev
- MUI Documentation: https://mui.com
- TanStack Query: https://tanstack.com/query
- Tailwind CSS: https://tailwindcss.com
