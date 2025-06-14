Based on the comprehensive documentation provided, I'll create a detailed frontend development guide for the CoopNest application using Next.js App Router architecture. Here's the structured approach:

# CoopNest Frontend Development Guide

## 1. Project Structure
```
coopnest-client/
├── .env.local                  # Environment variables
├── app/                        # Next.js App Router directory
│   ├── (auth)/                # Authentication routes group
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (admin)/           # Protected admin route
│   │   ├── layout.tsx
│   │   ├── page.tsx
|   |   ├── dashboard/
|   |   ├── financial/
│   │   └── members/
|   |   |   ├── [id]/
|   |   |   ├── accounts/
|   |   |   └── register/
│   │   ├── loans/
│   │   ├── savings/
│   │   ├── approvals/
|   |   ├── profile/
│   │   └── settings/
├── components/                 # Shared components
├── lib/                       # Shared utilities
│   ├── api/                   # API client setup
│   ├── hooks/                 # Custom hooks
│   ├── store/                # Redux store
│   ├── schemas/              # Zod schemas
│   └── utils/                # Helper functions
├── styles/                    # Global styles
└── types/                     # TypeScript definitions
```

## 2. Core Technical Setup

### 2.1 Project Initialization
```bash
npx create-next-app@latest coopnest-client --typescript --tailwind --app
```

### 2.2 Essential Dependencies
```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.0.1",
    "@tanstack/react-query": "^5.0.0",
    "@hookform/resolvers": "^3.3.2",
    "axios": "^1.6.2",
    "next-auth": "^4.24.5",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0"
  }
}
```

## 3. Authentication Implementation

### 3.1 Auth Context Setup
```typescript
// lib/context/auth-context.tsx
import { createContext, useContext, useReducer } from 'react';
import { User, AuthState, AuthAction } from '@/types/auth';

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
} | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3.2 Protected Route Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## 4. Core Components Structure

### 4.1 Layout Components
```typescript
// components/templates/DashboardLayout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8">
        <TopBar />
        <main>{children}</main>
      </div>
    </div>
  );
};
```

### 4.2 Permission Guard Component
```typescript
// components/atoms/PermissionGuard.tsx
interface PermissionGuardProps {
  permissions: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard = ({
  permissions,
  children,
  fallback
}: PermissionGuardProps) => {
  const { hasPermission } = usePermissions();
  
  if (!permissions.every(p => hasPermission(p))) {
    return fallback || null;
  }
  
  return <>{children}</>;
};
```

## 5. State Management

### 5.1 Redux Store Setup
```typescript
// lib/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 5.2 React Query Setup
```typescript
// lib/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

## 6. Form Handling

### 6.1 Form Schema Example
```typescript
// lib/schemas/member-schema.ts
import { z } from 'zod';

export const memberSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\+234[0-9]{10}$/),
  department: z.string(),
  staffNo: z.string(),
});

export type MemberFormData = z.infer<typeof memberSchema>;
```

### 6.2 Form Component Example
```typescript
// components/organisms/MemberForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberSchema, MemberFormData } from '@/lib/schemas/member-schema';

export const MemberForm = () => {
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });
  
  const onSubmit = async (data: MemberFormData) => {
    // Handle form submission
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## 7. API Integration

### 7.1 API Client Setup
```typescript
// lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 7.2 API Hooks Example
```typescript
// lib/hooks/use-members.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export const useMembers = (params: MemberQueryParams) => {
  return useQuery({
    queryKey: ['members', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/biodata', { params });
      return data;
    },
  });
};
```

## 8. Error Handling

### 8.1 Global Error Boundary
```typescript
// components/providers/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

## 9. Styling System

### 9.1 Tailwind Configuration
```typescript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          // ... other shades
          900: '#0c4a6e',
        },
      },
      spacing: {
        // 4px grid
        px: '1px',
        0.5: '0.125rem',
        1: '0.25rem',
        // ... other spacing values
      },
    },
  },
  plugins: [],
};
```

This guide provides a solid foundation for building the CoopNest frontend. The structure is modular, scalable, and follows Next.js best practices while incorporating all the requirements from the backend API. Would you like me to expand on any particular section or provide more specific implementation details?

Similar code found with 2 license types