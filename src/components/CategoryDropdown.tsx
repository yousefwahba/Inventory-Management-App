import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../database/database';

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategoryId: number;
  onCategorySelect: (categoryId: number) => void;
  placeholder?: string;
  error?: boolean;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  placeholder = 'Select Category',
  error = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const displayText = selectedCategory?.name || placeholder;

  const handleCategorySelect = (categoryId: number) => {
    onCategorySelect(categoryId);
    setIsModalVisible(false);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        item.id === selectedCategoryId && styles.selectedCategoryItem,
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text
        style={[
          styles.categoryItemText,
          item.id === selectedCategoryId && styles.selectedCategoryItemText,
        ]}
      >
        {item.name}
      </Text>
      {item.id === selectedCategoryId && (
        <Ionicons name="checkmark" size={20} color="#2196F3" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          error && styles.dropdownButtonError,
          !selectedCategory && styles.dropdownButtonPlaceholder,
        ]}
        onPress={() => setIsModalVisible(true)}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            !selectedCategory && styles.dropdownButtonPlaceholderText,
          ]}
        >
          {displayText}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={!selectedCategory ? '#999' : '#666'}
        />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCategoryItem}
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  dropdownButtonError: {
    borderColor: '#f44336',
  },
  dropdownButtonPlaceholder: {
    borderColor: '#ddd',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownButtonPlaceholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: screenWidth * 0.85,
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedCategoryItem: {
    backgroundColor: '#f0f8ff',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedCategoryItemText: {
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default CategoryDropdown;