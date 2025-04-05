import React from 'react';
import { DefaultLayout } from './DefaultLayout';

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <DefaultLayout 
      title="KSMS"
      description="User Section"
      showFooter={true}
    >
      {children}
    </DefaultLayout>
  );
}