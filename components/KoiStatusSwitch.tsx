import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { updateKoiStatus } from '../services/koiProfileService';

interface KoiStatusSwitchProps {
  koiId: string;
  initialStatus: string; // 'active' hoặc bất kỳ giá trị khác
  onStatusChange?: (newStatus: string) => void;
}

const KoiStatusSwitch: React.FC<KoiStatusSwitchProps> = ({ 
  koiId, 
  initialStatus, 
  onStatusChange 
}) => {
  const [isActive, setIsActive] = useState(initialStatus === 'active');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsActive(initialStatus === 'active');
  }, [initialStatus]);

  const updateStatus = async (newActive: boolean) => {
    setIsLoading(true);
    try {
      const newStatus = newActive ? 'Active' : 'Inactive';
      const response = await updateKoiStatus(koiId, newStatus);
      
      if (response.statusCode === 200) {
        if (onStatusChange) {
          onStatusChange(newActive ? 'active' : 'inactive');
        }
        Alert.alert('Thành công', response.message);
      } else {
        // Nếu có lỗi, đảo ngược lại trạng thái
        setIsActive(!newActive);
        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      // Đảo ngược lại trạng thái khi có lỗi
      setIsActive(!newActive);
      Alert.alert('Lỗi', 'Không thể kết nối với máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const newActive = !isActive;
    setIsActive(newActive); // Cập nhật UI ngay lập tức
    updateStatus(newActive);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Trạng thái:</Text>
      <View style={styles.switchContainer}>
        <Text style={[
          styles.statusText, 
          { color: isActive ? '#4CAF50' : '#F44336' }
        ]}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0066CC" style={styles.loader} />
        ) : (
          <Switch
            trackColor={{ false: '#767577', true: '#baf4c0' }}
            thumbColor={isActive ? '#4CAF50' : '#f4f3f4'}
            ios_backgroundColor="#e9e9e9"
            onValueChange={handleToggle}
            value={isActive}
            style={styles.switch}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#4B5563',
    marginRight: 8,
  },
  switchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginRight: 12,
    fontWeight: '500',
  },
  loader: {
    marginRight: 10,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }]
  }
});

export default KoiStatusSwitch; 