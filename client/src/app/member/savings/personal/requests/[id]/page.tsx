"use client";

import { PendingSavingsRequestDetails } from '@/components/features/member/savings/personal/PendingSavingsRequestDetails';
import { useParams } from 'next/navigation';
import React from 'react';

export default function PersonalSavingsPendingRequestPage() {
  const params = useParams();
  const requestId = (params as { id: string }).id;
  
  return <PendingSavingsRequestDetails requestId={requestId} />;
}