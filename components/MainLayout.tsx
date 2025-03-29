import React, { ReactNode } from 'react';
import LayoutWithHeader from './LayoutWithHeader';
import LayoutWithFooter from './LayoutWithFooter';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showFooter?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'KSMS',
  description = '',
  showFooter = true,
}) => {
  return (
    <LayoutWithFooter showFooter={showFooter}>
      <LayoutWithHeader title={title} description={description}>
        {children}
      </LayoutWithHeader>
    </LayoutWithFooter>
  );
};

export default MainLayout; 