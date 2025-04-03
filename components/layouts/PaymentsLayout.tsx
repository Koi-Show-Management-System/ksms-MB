import React from 'react';
import { DefaultLayout } from './DefaultLayout';

interface PaymentsLayoutProps {
  children: React.ReactNode;
}

export function PaymentsLayout({ children }: PaymentsLayoutProps) {
  return (
    <DefaultLayout 
      title="KSMS"
      description="Payments"
      showFooter={true}
    >
      {children}
    </DefaultLayout>
  );
}