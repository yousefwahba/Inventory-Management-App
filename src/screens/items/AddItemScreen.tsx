import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ItemStackParamList } from '../../navigation/AppNavigator';
import { databaseService, Category } from '../../database/database';
import { useToast } from '../../components/ToastContext';
import CategoryDropdown from '../../components/CategoryDropdown';
import { AnimatedButton } from '../../components/AnimatedButton';

type AddItemScreenNavigationProp = StackNavigationProp<ItemStackParamList, 'AddItem'>;
type AddItemScreenRouteProp = RouteProp<ItemStackParamList, 'AddItem'>;

interface FormData {
  name: string;
  categoryId: number;
  price: string;
  quantity: string;
  description: string;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  price?: string;
  quantity?: string;
}

const AddItemScreen: React.FC = () => {
  const navigation = useNavigation<AddItemScreenNavigationProp>();
  const route = useRoute<AddItemScreenRouteProp>();
  const { itemId } = route.params || {};
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: 0,
    price: '',
    quantity: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCategories();
    if (itemId) {
      setIsEditing(true);
      loadItem();
    }
  }, [itemId]);

  const loadCategories = async () => {
    try {
      await databaseService.initDatabase();
      const categoriesData = await databaseService.getCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !itemId) {
        setFormData(prev => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showError('Failed to load categories');
    }
  };

  const loadItem = async () => {
    if (!itemId) return;
    
    try {
      const items = await databaseService.getItems();
      const item = items.find(i => i.id === itemId);
      if (item) {
        setFormData({
          name: item.name,
          categoryId: item.category_id,
          price: item.price.toString(),
          quantity: item.quantity.toString(),
          description: item.description || '',
        });
      }
    } catch (error) {
      console.error('Error loading item:', error);
      showError('Failed to load item');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const price = Number(formData.price);
      const quantity = Number(formData.quantity);

      if (isEditing && itemId) {
        await databaseService.updateItem(
          itemId,
          formData.name.trim(),
          formData.categoryId,
          price,
          quantity,
          formData.description.trim()
        );
        showSuccess('Item updated successfully');
      } else {
        await databaseService.addItem(
          formData.name.trim(),
          formData.categoryId,
          price,
          quantity,
          formData.description.trim()
        );
        showSuccess('Item added successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving item:', error);
      showError('Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter item name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <CategoryDropdown
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onCategorySelect={(categoryId: number) => handleInputChange('categoryId', categoryId)}
              placeholder="Select Category"
              error={!!errors.categoryId}
            />
            {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                placeholder="0.00"
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                keyboardType="decimal-pad"
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                placeholder="0"
                value={formData.quantity}
                onChangeText={(value) => handleInputChange('quantity', value)}
                keyboardType="number-pad"
              />
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter item description (optional)"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <AnimatedButton
            title={isEditing ? 'Update Item' : 'Add Item'}
            onPress={handleSave}
            disabled={isLoading}
            loading={isLoading}
            loadingText="Saving..."
            icon={isEditing ? 'checkmark' : 'add'}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddItemScreen;