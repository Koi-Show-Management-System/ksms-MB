import React from 'react';
import { DefaultLayout } from './DefaultLayout';

interface TabsLayoutProps {
  children: React.ReactNode;
}

export function TabsLayout({ children }: TabsLayoutProps) {
  return (
    <DefaultLayout 
      title="KSMS"
      description="Tabs Section"
      showFooter={true}
    >
      {children}
    </DefaultLayout>
  );
}