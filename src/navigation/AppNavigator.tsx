import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ItemListScreen from '../screens/items/ItemListScreen';
import AddItemScreen from '../screens/items/AddItemScreen';
import CategoryListScreen from '../screens/items/CategoryListScreen';
import InventoryScreen from '../screens/items/InventoryScreen';
import CustomerListScreen from '../screens/customers/CustomerListScreen';
import AddCustomerScreen from '../screens/customers/AddCustomerScreen';
import InvoiceListScreen from '../screens/invoices/InvoiceListScreen';
import CreateInvoiceScreen from '../screens/invoices/CreateInvoiceScreen';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  AddItem: { itemId?: number };
  AddCustomer: { customerId?: number };
  CreateInvoice: { invoiceId?: number };
};

export type MainTabParamList = {
  Home: undefined;
  Items: undefined;
  Customers: undefined;
  Invoices: undefined;
};

export type ItemStackParamList = {
  ItemList: undefined;
  AddItem: { itemId?: number };
  CategoryList: undefined;
  Inventory: undefined;
};

export type CustomerStackParamList = {
  CustomerList: undefined;
  AddCustomer: { customerId?: number };
};

export type InvoiceStackParamList = {
  InvoiceList: undefined;
  CreateInvoice: { invoiceId?: number };
};

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ItemStack = createStackNavigator<ItemStackParamList>();
const CustomerStack = createStackNavigator<CustomerStackParamList>();
const InvoiceStack = createStackNavigator<InvoiceStackParamList>();

function ItemStackNavigator() {
  return (
    <ItemStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ItemStack.Screen 
        name="ItemList" 
        component={ItemListScreen} 
        options={{ title: 'Items' }}
      />
      <ItemStack.Screen 
        name="AddItem" 
        component={AddItemScreen} 
        options={{ title: 'Add Item' }}
      />
      <ItemStack.Screen 
        name="CategoryList" 
        component={CategoryListScreen} 
        options={{ title: 'Categories' }}
      />
      <ItemStack.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{ title: 'Inventory' }}
      />
    </ItemStack.Navigator>
  );
}

function CustomerStackNavigator() {
  return (
    <CustomerStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <CustomerStack.Screen 
        name="CustomerList" 
        component={CustomerListScreen} 
        options={{ title: 'Customers' }}
      />
      <CustomerStack.Screen 
        name="AddCustomer" 
        component={AddCustomerScreen} 
        options={{ title: 'Add Customer' }}
      />
    </CustomerStack.Navigator>
  );
}

function InvoiceStackNavigator() {
  return (
    <InvoiceStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <InvoiceStack.Screen 
        name="InvoiceList" 
        component={InvoiceListScreen} 
        options={{ title: 'Invoices' }}
      />
      <InvoiceStack.Screen 
        name="CreateInvoice" 
        component={CreateInvoiceScreen} 
        options={{ title: 'Create Invoice' }}
      />
    </InvoiceStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Items') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Invoices') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Items" component={ItemStackNavigator} />
      <MainTab.Screen name="Customers" component={CustomerStackNavigator} />
      <MainTab.Screen name="Invoices" component={InvoiceStackNavigator} />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        <RootStack.Screen 
          name="AddItem" 
          component={AddItemScreen}
          options={{
            headerShown: true,
            title: 'Add Item',
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerBackTitle: '',
          }}
        />
        <RootStack.Screen 
          name="AddCustomer" 
          component={AddCustomerScreen}
          options={{
            headerShown: true,
            title: 'Add Customer',
            headerBackTitle: '',
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <RootStack.Screen 
          name="CreateInvoice" 
          component={CreateInvoiceScreen}
          options={{
            headerShown: true,
            title: 'Create Invoice',
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerBackTitle: '',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}