import { useTransactionHistory } from '@/lib/hooks/member/usePersonalSavings';
import { TransactionType } from '@/types/personal-savings.types';
import { useState } from 'react';
import { formatCurrency } from '@/utils/formatting/format';
import {
  Card,
  CardHeader,
  CardContent,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface TransactionHistoryProps {
  planId: string;
}

export function TransactionHistory({ planId }: TransactionHistoryProps) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const { data, isLoading } = useTransactionHistory(planId, {
    page: page + 1, // API uses 1-based pagination
    limit: pageSize
  });
  
  const columns: GridColDef[] = [
    {
      field: 'transactionType', 
      headerName: 'Type',
      width: 150,
      renderCell: (params) => (
        <span>
          {params.value === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'Deposit' : 'Withdrawal'}
        </span>
      )
    },
    {
      field: 'amount', 
      headerName: 'Amount', 
      width: 150,
      renderCell: (params) => (
        <span className={params.row.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT 
          ? 'text-green-600' : 'text-red-600'}>
          {params.row.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? '+' : '-'}
          {formatCurrency(params.value)}
        </span>
      )
    },
    { field: 'description', headerName: 'Description', width: 250 },
    { 
      field: 'createdAt', 
      headerName: 'Date', 
      width: 200,
      renderCell: (params) => (
        <span>{new Date(params.value).toLocaleString()}</span>
      )
    },
  ];
  
  return (
    <Card>
      <CardHeader title="Transaction History" />
      <CardContent>
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : (
          <DataGrid
            rows={data?.data || []}
            columns={columns}
            rowCount={data?.meta?.total || 0}
            loading={isLoading}
            pageSizeOptions={[5, 10, 25]}
            paginationModel={{
              pageSize,
              page
            }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            paginationMode="server"
            autoHeight
            disableRowSelectionOnClick
          />
        )}
      </CardContent>
    </Card>
  );
}