import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';

interface CustomRefreshControlProps extends RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
  tintColor?: string;
}

/**
 * A custom RefreshControl component with consistent styling across the app
 */
const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  refreshing,
  onRefresh,
  colors = ['#4A90E2', '#FFA500'],
  tintColor = '#4A90E2',
  ...props
}) => {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={colors}
      tintColor={tintColor}
      progressBackgroundColor="#ffffff"
      {...props}
    />
  );
};

export default CustomRefreshControl;
