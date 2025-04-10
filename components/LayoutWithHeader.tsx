import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Header from './Header';

interface LayoutWithHeaderProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
}

const LayoutWithHeader: React.FC<LayoutWithHeaderProps> = ({
  children,
  title = 'KSMS',
  description = '',
  showHeader = true,
}) => {
  return (
    <View style={styles.container}>
      {showHeader && <Header title={title} />}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});

export default LayoutWithHeader; 