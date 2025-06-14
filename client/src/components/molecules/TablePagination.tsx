import React from 'react';
import { Box, IconButton, Typography, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import {
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@mui/icons-material';

export interface TablePaginationProps {
  /**
   * The total number of items
   */
  count: number;
  /**
   * The zero-based index of the current page
   */
  page: number;
  /**
   * The number of rows per page
   */
  rowsPerPage: number;
  /**
   * Callback fired when the page is changed
   */
  onPageChange: (page: number) => void;
  /**
   * Callback fired when the number of rows per page is changed
   */
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  /**
   * Options for rows per page selection
   */
  rowsPerPageOptions?: number[];
}

/**
 * Pagination component for tables with page size selection
 */
export const TablePagination: React.FC<TablePaginationProps> = ({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
}) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  
  const handleFirstPageClick = () => {
    onPageChange(0);
  };

  const handlePrevPageClick = () => {
    onPageChange(Math.max(0, page - 1));
  };

  const handleNextPageClick = () => {
    onPageChange(Math.min(totalPages - 1, page + 1));
  };

  const handleLastPageClick = () => {
    onPageChange(Math.max(0, totalPages - 1));
  };
  
  const handleChangeRowsPerPage = (event: SelectChangeEvent<number>) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(Number(event.target.value));
      onPageChange(0); // Reset to first page when changing page size
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {onRowsPerPageChange && (
          <>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Rows per page:
            </Typography>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              size="small"
              sx={{ minWidth: 70 }}
            >
              {rowsPerPageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 2 }}>
          {count === 0
            ? 'No items'
            : `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, count)} of ${count}`}
        </Typography>
        
        <IconButton
          onClick={handleFirstPageClick}
          disabled={page === 0}
          aria-label="first page"
          size="small"
        >
          <FirstPageIcon />
        </IconButton>
        
        <IconButton
          onClick={handlePrevPageClick}
          disabled={page === 0}
          aria-label="previous page"
          size="small"
        >
          <KeyboardArrowLeftIcon />
        </IconButton>
        
        <Typography variant="body2" sx={{ mx: 1 }}>
          {totalPages === 0 ? 0 : page + 1} / {totalPages}
        </Typography>
        
        <IconButton
          onClick={handleNextPageClick}
          disabled={page >= totalPages - 1}
          aria-label="next page"
          size="small"
        >
          <KeyboardArrowRightIcon />
        </IconButton>
        
        <IconButton
          onClick={handleLastPageClick}
          disabled={page >= totalPages - 1}
          aria-label="last page"
          size="small"
        >
          <LastPageIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
