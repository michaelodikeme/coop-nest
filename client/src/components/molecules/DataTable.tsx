import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Skeleton,
  TableSortLabel,
  Alert,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { TablePagination } from './TablePagination';

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  header: string;
  field: keyof T | string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  /**
   * Column definitions
   */
  columns: TableColumn<T>[];
  /**
   * Data array to display in the table
   */
  data: T[];
  /**
   * Unique identifier field in the data
   */
  keyField?: keyof T;
  /**
   * Loading state
   */
  isLoading?: boolean;
  /**
   * Error state
   */
  error?: Error | null;
  /**
   * Enable pagination
   */
  pagination?: boolean;
  /**
   * Current page (0-based)
   */
  page?: number;
  /**
   * Current page size (rows per page)
   */
  pageSize?: number;
  /**
   * Total number of rows
   */
  totalCount?: number;
  /**
   * Current page number (1-based)
   */
  currentPage?: number;
  /**
   * Callback for page change
   */
  onPageChange?: (page: number) => void;
  /**
   * Callback for page size change
   */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Enable sorting
   */
  sortable?: boolean;
  /**
   * Default sort field
   */
  defaultSortField?: string;
  /**
   * Default sort direction
   */
  defaultSortDirection?: SortDirection;
  /**
   * Callback for sort change (for server-side sorting)
   */
  onSortChange?: (field: string, direction: SortDirection) => void;
  /**
   * Enable filtering
   */
  filterable?: boolean;
  /**
   * Callback for filter change (for server-side filtering)
   */
  onFilterChange?: (filters: Record<string, any>) => void;
  /**
   * Callback when a row is clicked
   */
  onRowClick?: (item: T) => void;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Additional toolbar content
   */
  toolbarContent?: React.ReactNode;
}

/**
 * A reusable data table component with sorting, filtering, and pagination
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField = 'id' as keyof T,
  isLoading = false,
  error = null,
  pagination = false,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  onPageSizeChange,
  sortable = false,
  defaultSortField,
  defaultSortDirection = 'asc',
  onSortChange,
  filterable = false,
  onFilterChange,
  onRowClick,
  emptyMessage = 'No data available',
  toolbarContent,
}: DataTableProps<T>) {
  const theme = useTheme();
  
  // Local state for client-side features if server callbacks not provided
  const [localPage, setLocalPage] = useState(0);
  const [localPageSize, setLocalPageSize] = useState(10);
  const [sortField, setSortField] = useState<string | undefined>(defaultSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [filter, setFilter] = useState('');
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    } else {
      setLocalPageSize(newPageSize);
      setLocalPage(0);
    }
  };
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    
    if (onSortChange) {
      onSortChange(field, newDirection);
    }
    
    setSortField(field);
    setSortDirection(newDirection);
  };
  
  // Handle filter change
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilter(value);
    
    if (onFilterChange) {
      onFilterChange({ search: value });
    }
  };
  
  // Processed data with client-side features
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply client-side filtering if server-side filtering is not enabled
    if (filterable && !onFilterChange && filter) {
      const lowercasedFilter = filter.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowercasedFilter);
        });
      });
    }
    
    // Apply client-side sorting if server-side sorting is not enabled
    if (sortable && !onSortChange && sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField as keyof T];
        const bValue = b[sortField as keyof T];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply client-side pagination if server-side pagination is not enabled
    if (pagination && !onPageChange) {
      const startIndex = localPage * localPageSize;
      result = result.slice(startIndex, startIndex + localPageSize);
    }
    
    return result;
  }, [data, filter, sortField, sortDirection, localPage, localPageSize, filterable, sortable, pagination, onFilterChange, onSortChange, onPageChange]);
  
  // Determine total row count for pagination
  const effectiveTotalRows = totalCount !== undefined ? totalCount : data.length;
  const effectivePage = onPageChange ? page : localPage;
  const effectivePageSize = onPageSizeChange ? pageSize : localPageSize;
  
  // Loading state
  if (isLoading) {
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        {filterable && (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton variant="rectangular" width={300} height={40} />
            {toolbarContent && <Skeleton variant="rectangular" width={200} height={40} />}
          </Box>
        )}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell key={index} width={column.width} align={column.align || 'left'}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(new Array(5)).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} align={column.align || 'left'}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {pagination && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton variant="rectangular" width={400} height={40} />
          </Box>
        )}
      </Paper>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error.message || 'An error occurred while loading data'}
      </Alert>
    );
  }
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Toolbar with search and custom content */}
      {(filterable || toolbarContent) && (
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {filterable && (
            <TextField
              placeholder="Search..."
              value={filter}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          )}
          
          {toolbarContent && (
            <Box>{toolbarContent}</Box>
          )}
        </Box>
      )}
      
      {/* Table content */}
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
              {columns.map((column, index) => (
                <TableCell 
                  key={index} 
                  width={column.width} 
                  align={column.align || 'left'}
                  sortDirection={sortField === column.field ? sortDirection : false}
                  sx={{ 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap' 
                  }}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={sortField === column.field}
                      direction={sortField === column.field ? sortDirection : 'asc'}
                      onClick={() => handleSortChange(column.field as string)}
                      IconComponent={sortDirection === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedData.length > 0 ? (
              processedData.map((item, rowIndex) => (
                <TableRow
                  key={item[keyField] || rowIndex}
                  hover={!!onRowClick}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  sx={{ 
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} align={column.align || 'left'}>
                      {column.render 
                        ? column.render(item)
                        : item[column.field as keyof T] !== undefined
                          ? String(item[column.field as keyof T])
                          : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {pagination && (
        <TablePagination
          count={effectiveTotalRows}
          page={effectivePage}
          rowsPerPage={effectivePageSize}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handlePageSizeChange}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      )}
    </Paper>
  );
}
