import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ItemStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, Item, Category } from '../../database/database';
import CategoryDropdown from '../../components/CategoryDropdown';

type InventoryScreenNavigationProp = StackNavigationProp<ItemStackParamList, 'Inventory'>;

interface ItemWithCategory extends Item {
  category_name: string;
}

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<InventoryScreenNavigationProp>();
  const [items, setItems] = useState<ItemWithCategory[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, stockFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await databaseService.initDatabase();
      
      const [itemsData, categoriesData] = await Promise.all([
        databaseService.getItems(),
        databaseService.getCategories(),
      ]);

      // Join items with categories
      const itemsWithCategories: ItemWithCategory[] = itemsData.map(item => {
        const category = categoriesData.find(cat => cat.id === item.category_id);
        return {
          ...item,
          category_name: category?.name || 'Unknown',
        };
      });

      setItems(itemsWithCategories);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.category_name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory > 0) {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    // Filter by stock level
    switch (stockFilter) {
      case 'low':
        filtered = filtered.filter(item => item.quantity > 0 && item.quantity <= 10);
        break;
      case 'out':
        filtered = filtered.filter(item => item.quantity === 0);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredItems(filtered);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { status: 'Out of Stock', color: '#f44336', icon: 'alert-circle' };
    } else if (quantity <= 10) {
      return { status: 'Low Stock', color: '#ff9800', icon: 'warning' };
    } else {
      return { status: 'In Stock', color: '#4caf50', icon: 'checkmark-circle' };
    }
  };

  const renderInventoryItem = ({ item }: { item: ItemWithCategory }) => {
    const stockInfo = getStockStatus(item.quantity);

    return (
      <View style={styles.inventoryItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category_name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        
        <View style={styles.stockInfo}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Qty:</Text>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
          </View>
          
          <View style={[styles.statusContainer, { backgroundColor: stockInfo.color + '20' }]}>
            <Ionicons name={stockInfo.icon as any} size={16} color={stockInfo.color} />
            <Text style={[styles.statusText, { color: stockInfo.color }]}>
              {stockInfo.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No items found</Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery || selectedCategory || stockFilter !== 'all'
          ? 'Try adjusting your filters'
          : 'Add items to see inventory'}
      </Text>
    </View>
  );

  const getFilterSummary = () => {
    const total = filteredItems.length;
    const outOfStock = filteredItems.filter(item => item.quantity === 0).length;
    const lowStock = filteredItems.filter(item => item.quantity > 0 && item.quantity <= 10).length;
    const inStock = filteredItems.filter(item => item.quantity > 10).length;

    return { total, outOfStock, lowStock, inStock };
  };

  const summary = getFilterSummary();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4caf50' }]}>{summary.inStock}</Text>
            <Text style={styles.summaryLabel}>In Stock</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#ff9800' }]}>{summary.lowStock}</Text>
            <Text style={styles.summaryLabel}>Low Stock</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#f44336' }]}>{summary.outOfStock}</Text>
            <Text style={styles.summaryLabel}>Out of Stock</Text>
          </View>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          <View style={styles.categoryFilter}>
            <CategoryDropdown
              categories={categories}
              selectedCategoryId={selectedCategory}
              onCategorySelect={(categoryId) => setSelectedCategory(categoryId)}
              placeholder="All Categories"
            />
          </View>

          <View style={styles.stockFilterContainer}>
            <TouchableOpacity
              style={[
                styles.stockFilterButton,
                stockFilter === 'all' && styles.stockFilterButtonActive,
              ]}
              onPress={() => setStockFilter('all')}
            >
              <Text
                style={[
                  styles.stockFilterText,
                  stockFilter === 'all' && styles.stockFilterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.stockFilterButton,
                stockFilter === 'low' && styles.stockFilterButtonActive,
              ]}
              onPress={() => setStockFilter('low')}
            >
              <Text
                style={[
                  styles.stockFilterText,
                  stockFilter === 'low' && styles.stockFilterTextActive,
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.stockFilterButton,
                stockFilter === 'out' && styles.stockFilterButtonActive,
              ]}
              onPress={() => setStockFilter('out')}
            >
              <Text
                style={[
                  styles.stockFilterText,
                  stockFilter === 'out' && styles.stockFilterTextActive,
                ]}
              >
                Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryFilter: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  stockFilterContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  stockFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  stockFilterButtonActive: {
    backgroundColor: '#2196F3',
  },
  stockFilterText: {
    fontSize: 14,
    color: '#666',
  },
  stockFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default InventoryScreen;