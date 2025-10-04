import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InvoiceStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, Customer, Category, Item, Invoice, InvoiceItem } from '../../database/database';
import CategoryDropdown from '../../components/CategoryDropdown';
import CustomerDropdown from '../../components/CustomerDropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '../../components/ToastContext';
import { AnimatedButton } from '../../components/AnimatedButton';

type CreateInvoiceScreenNavigationProp = StackNavigationProp<InvoiceStackParamList, 'CreateInvoice'>;
type CreateInvoiceScreenRouteProp = RouteProp<InvoiceStackParamList, 'CreateInvoice'>;

interface InvoiceItemData {
  id?: number;
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  extended_amount: number;
}

interface FormData {
  customer_id: number;
  invoice_date: Date;
  items: InvoiceItemData[];
}

const VAT_RATE = 0.15; // 15% VAT

const CreateInvoiceScreen: React.FC = () => {
  const navigation = useNavigation<CreateInvoiceScreenNavigationProp>();
  const route = useRoute<CreateInvoiceScreenRouteProp>();
  const { invoiceId } = route.params || {};
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [itemQuantity, setItemQuantity] = useState<string>('1');
  const [itemPrice, setItemPrice] = useState<string>('0');
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);

  const [formData, setFormData] = useState<FormData>({
    customer_id: 0,
    invoice_date: new Date(),
    items: [],
  });

  useEffect(() => {
    loadData();
    if (!invoiceId) {
      generateInvoiceNumber();
    }
  }, []);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  useEffect(() => {
    filterItemsByCategory();
  }, [selectedCategory, items]);

  const loadData = async () => {
    try {
      const [customersData, categoriesData, itemsData] = await Promise.all([
        databaseService.getCustomers(),
        databaseService.getCategories(),
        databaseService.getItems(),
      ]);

      setCustomers(customersData);
      setCategories(categoriesData);
      setItems(itemsData);
      
      if (customersData.length > 0 && !invoiceId) {
        setFormData(prev => ({ ...prev, customer_id: customersData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const number = await databaseService.generateInvoiceNumber();
      setInvoiceNumber(number);
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  };

  const loadInvoice = async () => {
    if (!invoiceId) return;
    
    try {
      const invoices = await databaseService.getInvoices();
      const invoice = invoices.find(i => i.id === invoiceId);
      
      if (invoice) {
        setInvoiceNumber(invoice.invoice_number);
        setFormData(prev => ({
          ...prev,
          customer_id: invoice.customer_id,
          invoice_date: new Date(invoice.invoice_date),
        }));
        
        // Load invoice items and ensure we have fresh item data
        const [invoiceItems, allItems] = await Promise.all([
          databaseService.getInvoiceItems(invoiceId),
          databaseService.getItems()
        ]);
        
        const itemsWithNames: InvoiceItemData[] = invoiceItems.map(item => {
          const itemData = allItems.find(i => i.id === item.item_id);
          return {
            id: item.id,
            item_id: item.item_id,
            item_name: itemData?.name || 'Unknown Item',
            quantity: item.quantity,
            unit_price: item.unit_price,
            extended_amount: item.extended_amount,
          };
        });
        
        setFormData(prev => ({ ...prev, items: itemsWithNames }));
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      showError('Failed to load invoice');
    }
  };

  const filterItemsByCategory = () => {
    if (selectedCategory === 0) {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.category_id === selectedCategory));
    }
  };

  const openItemModal = (index: number = -1) => {
    setEditingItemIndex(index);
    
    if (index >= 0) {
      const item = formData.items[index];
      setSelectedItemId(item.item_id);
      setItemQuantity(item.quantity.toString());
      setItemPrice(item.unit_price.toString());
    } else {
      setSelectedItemId(0);
      setItemQuantity('1');
      setItemPrice('0');
    }
    
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItemIndex(-1);
    setSelectedItemId(0);
    setItemQuantity('1');
    setItemPrice('0');
  };

  const selectItem = (itemId: number) => {
    setSelectedItemId(itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setItemPrice(item.price.toString());
    }
  };

  const addOrUpdateItem = () => {
    if (selectedItemId === 0) {
      showError('Please select an item');
      return;
    }
    
    const quantity = Number(itemQuantity);
    const price = Number(itemPrice);
    
    if (isNaN(quantity) || quantity <= 0) {
      showError('Please enter a valid quantity');
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price');
      return;
    }
    
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;
    
    const newItem: InvoiceItemData = {
      item_id: selectedItemId,
      item_name: item.name,
      quantity,
      unit_price: price,
      extended_amount: quantity * price,
    };
    
    setFormData(prev => {
      const newItems = [...prev.items];
      if (editingItemIndex >= 0) {
        newItems[editingItemIndex] = newItem;
      } else {
        newItems.push(newItem);
      }
      return { ...prev, items: newItems };
    });
    
    closeItemModal();
  };

  const handleRemoveItem = (index: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              items: prev.items.filter((_, i) => i !== index),
            }));
          },
        },
      ]
    );
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.extended_amount, 0);
    const vatAmount = subtotal * VAT_RATE;
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total };
  };

  const handleSave = async () => {
    if (formData.customer_id === 0) {
      showError('Please select a customer');
      return;
    }
    
    if (formData.items.length === 0) {
      showError('Please add at least one item');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { subtotal, vatAmount, total } = calculateTotals();
      const invoiceDate = formData.invoice_date.toISOString().split('T')[0];
      
      if (invoiceId) {
        // Update existing invoice
        await databaseService.updateInvoice(
          invoiceId,
          formData.customer_id,
          invoiceDate,
          subtotal,
          vatAmount,
          total
        );
        
        // Delete existing invoice items
        await databaseService.deleteInvoiceItems(invoiceId);
        
        // Add updated invoice items
        for (const item of formData.items) {
          await databaseService.addInvoiceItem(
            invoiceId,
            item.item_id,
            item.quantity,
            item.unit_price,
            item.extended_amount
          );
        }
        
        showSuccess('Invoice updated successfully');
        navigation.goBack();
      } else {
        // Create new invoice
        const newInvoiceId = await databaseService.addInvoice(
          invoiceNumber,
          formData.customer_id,
          invoiceDate,
          subtotal,
          vatAmount,
          total
        );
        
        // Add invoice items
        for (const item of formData.items) {
          await databaseService.addInvoiceItem(
            newInvoiceId,
            item.item_id,
            item.quantity,
            item.unit_price,
            item.extended_amount
          );
          
          // Update item quantity in inventory
          const currentItem = items.find(i => i.id === item.item_id);
          if (currentItem) {
            const newQuantity = Math.max(0, currentItem.quantity - item.quantity);
            await databaseService.updateItemQuantity(item.item_id, newQuantity);
          }
        }
        
        showSuccess('Invoice created successfully');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      showError('Failed to save invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  const renderInvoiceItem = ({ item, index }: { item: InvoiceItemData; index: number }) => (
    <View style={styles.invoiceItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.itemDetails}>
          {item.quantity} × ${item.unit_price.toFixed(2)} = ${item.extended_amount.toFixed(2)}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.itemActionButton}
          onPress={() => openItemModal(index)}
        >
          <Ionicons name="create-outline" size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.itemActionButton}
          onPress={() => handleRemoveItem(index)}
        >
          <Ionicons name="trash-outline" size={16} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItemSelector = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={[
        styles.itemSelectorItem,
        selectedItemId === item.id && styles.itemSelectorItemSelected,
      ]}
      onPress={() => selectItem(item.id)}
    >
      <View style={styles.itemSelectorInfo}>
        <Text style={styles.itemSelectorName}>{item.name}</Text>
        <Text style={styles.itemSelectorPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.itemSelectorStock}>Stock: {item.quantity}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.form}
        >
          {/* Invoice Header */}
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.invoiceStatus}>
              {invoiceId ? 'Edit Invoice' : 'New Invoice'}
            </Text>
          </View>

          {/* Customer Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Customer</Text>
            <CustomerDropdown
              customers={customers}
              selectedCustomerId={formData.customer_id}
              onCustomerSelect={(customerId) =>
                setFormData(prev => ({ ...prev, customer_id: customerId }))
              }
            />
          </View>

          {/* Invoice Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Invoice Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formData.invoice_date.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.invoice_date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData(prev => ({ ...prev, invoice_date: selectedDate }));
                }
              }}
            />
          )}

          {/* Items Section */}
          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Items</Text>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => openItemModal()}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addItemButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {formData.items.length > 0 ? (
              <View>
                {formData.items.map((item, index) => (
                  <View key={index}>
                    {renderInvoiceItem({ item, index })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>No items added yet</Text>
              </View>
            )}
          </View>

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT (15%):</Text>
              <Text style={styles.totalValue}>${vatAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Save Button */}
          <AnimatedButton
            title={invoiceId ? 'Update Invoice' : 'Create Invoice'}
            onPress={handleSave}
            disabled={isLoading}
            loading={isLoading}
            loadingText="Saving..."
            icon="save-outline"
            style={styles.saveButton}
          />
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Item Selection Modal */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItemIndex >= 0 ? 'Edit Item' : 'Add Item'}
            </Text>
            <TouchableOpacity onPress={closeItemModal}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Category Filter */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Filter by Category</Text>
              <CategoryDropdown
                categories={categories}
                selectedCategoryId={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            </View>

            {/* Items List */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Item</Text>
              <ScrollView style={styles.itemsList} nestedScrollEnabled={true}>
                {filteredItems.map((item) => (
                  <View key={item.id.toString()}>
                    {renderItemSelector({ item })}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Quantity and Price */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Unit Price</Text>
                <TextInput
                  style={styles.input}
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="numeric"
                  placeholder="Enter price"
                />
              </View>
            </View>

            {/* Extended Amount */}
            <View style={styles.extendedAmountContainer}>
              <Text style={styles.extendedAmountLabel}>Extended Amount:</Text>
              <Text style={styles.extendedAmountValue}>
                ${(Number(itemQuantity) * Number(itemPrice)).toFixed(2)}
              </Text>
            </View>

            {/* Add/Update Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={addOrUpdateItem}
            >
              <Text style={styles.saveButtonText}>
                {editingItemIndex >= 0 ? 'Update Item' : 'Add Item'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  invoiceHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  invoiceStatus: {
    fontSize: 14,
    color: '#666',
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
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemActionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  emptyItems: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#666',
  },
  totalsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  itemsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  itemSelectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemSelectorItemSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  itemSelectorInfo: {
    flex: 1,
  },
  itemSelectorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemSelectorPrice: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  itemSelectorStock: {
    fontSize: 12,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  extendedAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  extendedAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  extendedAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default CreateInvoiceScreen;