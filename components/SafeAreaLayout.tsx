import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaLayoutProps {
  children: ReactNode;
  edges?: Edge[];
  style?: any;
}

/**
 * A layout component that wraps content in a SafeAreaView
 * This can be used for screens that don't use the MainLayout system
 */
const SafeAreaLayout: React.FC<SafeAreaLayoutProps> = ({
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  style,
}) => {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default SafeAreaLayout;
