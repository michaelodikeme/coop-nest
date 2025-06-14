import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Chip,
  Typography,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { visuallyHidden } from '@mui/utils';

export interface DataTableColumn<T extends object> {
  id: string;
  label: string;
  accessor: keyof T | ((row: T) => any);
  Cell?: (props: { value: any; row: { original: T } }) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  width?: number;
  filterable?: boolean;
  sortable?: boolean;
  disablePadding?: boolean;
  renderHeader?: (column: DataTableColumn<T>) => React.ReactNode;
  format?: (value: any) => string;
}

// Update the DataTableProps type to accept a function or string for headerBackgroundColor
interface DataTableProps<T extends object> {
  columns: DataTableColumn<T>[];
  data: T[];
  pagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    totalRecords?: number;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  loading?: boolean;
  error?: string;
  headerBackgroundColor?: string | ((theme: any) => string);
  enableFiltering?: boolean;
  onRowClick?: (row: T) => void;
  selectedRowId?: string | number;
  getRowId?: (row: T) => string | number;
  noDataMessage?: string;
  highlightedRowIds?: (string | number)[];
}

export const DataTable = <T extends object>({
  columns,
  data,
  pagination,
  onPageChange,
  onPageSizeChange,
  loading = false,
  error,
  headerBackgroundColor = '#f5f7fa',
  enableFiltering = true,
  onRowClick,
  selectedRowId,
  getRowId = (row: any) => row.id,
  noDataMessage = "No data available",
  highlightedRowIds = []
}: DataTableProps<T>) => {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [filters, setFilters] = useState<{[key: string]: string}>({});
  const [showFilters, setShowFilters] = useState(false);
  const theme = useTheme();

  // Add this helper function
  const resolveColor = (color: string | ((theme: any) => string)): string => {
    return typeof color === 'function' ? color(theme) : color;
  };

  // Update the resolveHeaderBackgroundColor function to use the component's theme
  const resolveHeaderBackgroundColor = (
    color: string | ((theme: any) => string)
  ): string => {
    if (typeof color === 'function') {
      // Pass the theme from the component
      return color(theme);
    }
    return color;
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }));
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
    if (showFilters) {
      setFilters({});
    }
  };

  // Placeholder rows for loading state
  const loadingRows = Array.from({ length: pagination?.pageSize || 5 }).map((_, index) => (
    <TableRow key={`loading-row-${index}`}>
      {columns.map((column, colIndex) => (
        <TableCell 
          key={`loading-cell-${colIndex}`} 
          align={column.align || 'left'}
          sx={{ 
            minWidth: column.minWidth, 
            width: column.width,
            padding: column.disablePadding ? '4px 8px' : undefined
          }}
        >
          <Skeleton animation="wave" height={24} width="80%" />
        </TableCell>
      ))}
    </TableRow>
  ));

  // If there's an error, show error message
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, bgcolor: alpha('#ff0000', 0.05), borderLeft: '4px solid #ff0000' }}>
        <Typography variant="subtitle1" color="error" gutterBottom>
          Error loading data
        </Typography>
        <Typography variant="body2">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 1, boxShadow: 2 }}>
      {/* Filter toggle */}
      {enableFiltering && (
        <Box sx={{ 
          px: 2, 
          py: 1.5, 
          display: 'flex', 
          justifyContent: 'flex-end',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(resolveColor(headerBackgroundColor), 0.6)
        }}>
          <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
            <IconButton 
              size="small" 
              onClick={toggleFilters}
              color={showFilters ? "primary" : "default"}
              sx={{ 
                border: 1, 
                borderColor: showFilters ? 'primary.main' : 'divider',
                '&:hover': { bgcolor: alpha('#000', 0.05) }
              }}
            >
              {showFilters ? <FilterAltOffIcon /> : <FilterAltIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="sticky table" size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    minWidth: column.minWidth,
                    width: column.width,
                    padding: column.disablePadding ? '8px' : undefined,
                    backgroundColor: resolveColor(headerBackgroundColor),
                    fontWeight: 600,
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    color: 'text.primary',
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.renderHeader ? column.renderHeader(column) : column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.renderHeader ? column.renderHeader(column) : column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
            
            {/* Filter row - shown conditionally */}
            {showFilters && (
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={`filter-${column.id}`}
                    align={column.align || 'left'}
                    sx={{
                      padding: '8px',
                      backgroundColor: alpha(resolveColor(headerBackgroundColor), 0.8),
                    }}
                  >
                    {column.filterable !== false && (
                      <TextField
                        size="small"
                        placeholder={`Filter ${column.label.toLowerCase()}...`}
                        value={filters[column.id] || ''}
                        onChange={(e) => handleFilterChange(column.id, e.target.value)}
                        variant="outlined"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1 }
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableHead>
          
          <TableBody>
            {loading ? (
              loadingRows
            ) : data.length > 0 ? (
              data.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = selectedRowId === rowId;
                const isHighlighted = highlightedRowIds.includes(rowId);
                
                return (
                  <TableRow
                    hover
                    key={`row-${rowId || index}`}
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      bgcolor: isSelected 
                        ? alpha('#1976d2', 0.08)
                        : isHighlighted 
                          ? alpha('#1976d2', 0.04) 
                          : 'inherit',
                      '&:hover': {
                        bgcolor: isSelected 
                          ? alpha('#1976d2', 0.12) 
                          : alpha('#000', 0.04)
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {columns.map((column, colIndex) => {
                      const value = typeof column.accessor === 'function' 
                        ? column.accessor(row) 
                        : (row as any)[column.accessor];
                      
                      return (
                        <TableCell 
                          key={`cell-${colIndex}-${rowId || index}`} 
                          align={column.align || 'left'}
                          sx={{ 
                            minWidth: column.minWidth,
                            width: column.width,
                            padding: column.disablePadding ? '6px 8px' : undefined,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {column.Cell 
                            ? column.Cell({ value, row: { original: row } }) 
                            : column.format 
                              ? column.format(value)
                              : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  align="center" 
                  sx={{ py: 6, borderBottom: 0 }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon color="disabled" sx={{ fontSize: 48 }} />
                    <Typography variant="body1" color="text.secondary">
                      {noDataMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={pagination.totalRecords || pagination.pageCount * pagination.pageSize}
          rowsPerPage={pagination.pageSize}
          page={pagination.pageIndex}
          onPageChange={(_, page) => onPageChange?.(page)}
          onRowsPerPageChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiTablePagination-toolbar': {
              pl: 2,
              pr: 2,
            },
          }}
        />
      )}
    </Paper>
  );
};
