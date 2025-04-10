import React, { ReactNode } from 'react';
import LayoutWithHeader from './LayoutWithHeader';
import LayoutWithFooter from './LayoutWithFooter';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showFooter?: boolean;
  showHeader?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'KSMS',
  description = '',
  showFooter = true,
  showHeader = true,
}) => {
  return (
    <LayoutWithFooter showFooter={showFooter}>
      <LayoutWithHeader title={title} description={description} showHeader={showHeader}>
        {children}
      </LayoutWithHeader>
    </LayoutWithFooter>
  );
};

export default MainLayout; 