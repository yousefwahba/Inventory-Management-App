import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InvoiceStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, Invoice, Customer } from '../../database/database';
import { useToast } from '../../components/ToastContext';

type InvoiceListScreenNavigationProp = StackNavigationProp<InvoiceStackParamList, 'InvoiceList'>;

interface InvoiceWithCustomer extends Invoice {
  customer_name: string;
}

const InvoiceListScreen: React.FC = () => {
  const navigation = useNavigation<InvoiceListScreenNavigationProp>();
  const { showError } = useToast();
  const [invoices, setInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithCustomer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchQuery]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await databaseService.initDatabase();
      
      const [invoicesData, customersData] = await Promise.all([
        databaseService.getInvoices(),
        databaseService.getCustomers(),
      ]);

      // Join invoices with customers
      const invoicesWithCustomers: InvoiceWithCustomer[] = invoicesData.map(invoice => {
        const customer = customersData.find(c => c.id === invoice.customer_id);
        return {
          ...invoice,
          customer_name: customer?.name || 'Unknown Customer',
        };
      });

      setInvoices(invoicesWithCustomers);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInvoices = () => {
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = invoices.filter(
      invoice =>
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.customer_name.toLowerCase().includes(query)
    );
    setFilteredInvoices(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleViewInvoice = (invoice: InvoiceWithCustomer) => {
    navigation.navigate('CreateInvoice', { invoiceId: invoice.id });
  };

  const renderInvoiceItem = ({ item }: { item: InvoiceWithCustomer }) => (
    <TouchableOpacity
      style={styles.invoiceItem}
      onPress={() => handleViewInvoice(item)}
    >
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
          <Text style={styles.customerName}>{item.customer_name}</Text>
        </View>
        <View style={styles.invoiceAmount}>
          <Text style={styles.totalAmount}>{formatCurrency(item.total_amount)}</Text>
          <Text style={styles.invoiceDate}>{formatDate(item.invoice_date)}</Text>
        </View>
      </View>
      
      <View style={styles.invoiceDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Subtotal:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.subtotal)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>VAT:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.vat_amount)}</Text>
        </View>
      </View>
      
      <View style={styles.invoiceFooter}>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No invoices found</Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Create your first invoice to get started'}
      </Text>
    </View>
  );

  const getTotalStats = () => {
    const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalVAT = filteredInvoices.reduce((sum, invoice) => sum + invoice.vat_amount, 0);
    return { totalRevenue, totalVAT, count: filteredInvoices.length };
  };

  const stats = getTotalStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Invoices</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateInvoice', {})}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>New Invoice</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.count}</Text>
          <Text style={styles.statLabel}>
            {searchQuery ? 'Found' : 'Total Invoices'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(stats.totalVAT)}</Text>
          <Text style={styles.statLabel}>Total VAT</Text>
        </View>
      </View>

      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
        showsVerticalScrollIndicator={false}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  invoiceItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 12,
    color: '#666',
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  invoiceFooter: {
    alignItems: 'flex-end',
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

export default InvoiceListScreen;