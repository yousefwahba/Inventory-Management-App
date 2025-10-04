import * as SQLite from 'expo-sqlite';

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Item {
  id: number;
  name: string;
  category_id: number;
  price: number;
  quantity: number;
  description?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  invoice_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  extended_amount: number;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('inventory.db');
      await this.createTables();
      await this.insertDefaultData();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );
    `);

    // Customers table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Invoices table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        invoice_date DATE NOT NULL,
        subtotal REAL NOT NULL,
        vat_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      );
    `);

    // Invoice items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        extended_amount REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id),
        FOREIGN KEY (item_id) REFERENCES items (id)
      );
    `);
  }

  private async insertDefaultData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Insert default categories using INSERT OR IGNORE to prevent duplicates
      await this.db.runAsync('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', ['Electronics', 'Electronic devices and accessories']);
      await this.db.runAsync('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', ['Clothing', 'Apparel and fashion items']);
      await this.db.runAsync('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', ['Books', 'Books and educational materials']);
      await this.db.runAsync('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', ['Home & Garden', 'Home improvement and garden supplies']);
    } catch (error) {
      console.error('Error inserting default data:', error);
      // Don't throw error for default data insertion failures
    }
  }

  // Category CRUD operations
  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name');
  }

  async addCategory(name: string, description?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description || '']);
    return result.lastInsertRowId;
  }

  async updateCategory(id: number, name: string, description?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description || '', id]);
  }

  async deleteCategory(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  }

  // Item CRUD operations
  async getItems(): Promise<Item[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<Item>('SELECT * FROM items ORDER BY name');
  }

  async getItemsByCategory(categoryId: number): Promise<Item[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<Item>('SELECT * FROM items WHERE category_id = ? ORDER BY name', [categoryId]);
  }

  async addItem(name: string, categoryId: number, price: number, quantity: number, description?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      'INSERT INTO items (name, category_id, price, quantity, description) VALUES (?, ?, ?, ?, ?)',
      [name, categoryId, price, quantity, description || '']
    );
    return result.lastInsertRowId;
  }

  async updateItem(id: number, name: string, categoryId: number, price: number, quantity: number, description?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE items SET name = ?, category_id = ?, price = ?, quantity = ?, description = ? WHERE id = ?',
      [name, categoryId, price, quantity, description || '', id]
    );
  }

  async updateItemQuantity(id: number, quantity: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('UPDATE items SET quantity = ? WHERE id = ?', [quantity, id]);
  }

  async deleteItem(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM items WHERE id = ?', [id]);
  }

  // Customer CRUD operations
  async getCustomers(): Promise<Customer[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<Customer>('SELECT * FROM customers ORDER BY name');
  }

  async addCustomer(name: string, phone: string, email?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)', [name, phone, email || '']);
    return result.lastInsertRowId;
  }

  async updateCustomer(id: number, name: string, phone: string, email?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('UPDATE customers SET name = ?, phone = ?, email = ? WHERE id = ?', [name, phone, email || '', id]);
  }

  async deleteCustomer(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
  }

  // Invoice CRUD operations
  async getInvoices(): Promise<Invoice[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<Invoice>('SELECT * FROM invoices ORDER BY created_at DESC');
  }

  async generateInvoiceNumber(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM invoices');
    const count = result?.count || 0;
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  async addInvoice(invoiceNumber: string, customerId: number, invoiceDate: string, subtotal: number, vatAmount: number, totalAmount: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      'INSERT INTO invoices (invoice_number, customer_id, invoice_date, subtotal, vat_amount, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [invoiceNumber, customerId, invoiceDate, subtotal, vatAmount, totalAmount]
    );
    return result.lastInsertRowId;
  }

  async addInvoiceItem(invoiceId: number, itemId: number, quantity: number, unitPrice: number, extendedAmount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT INTO invoice_items (invoice_id, item_id, quantity, unit_price, extended_amount) VALUES (?, ?, ?, ?, ?)',
      [invoiceId, itemId, quantity, unitPrice, extendedAmount]
    );
  }

  async updateInvoice(id: number, customerId: number, invoiceDate: string, subtotal: number, vatAmount: number, totalAmount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE invoices SET customer_id = ?, invoice_date = ?, subtotal = ?, vat_amount = ?, total_amount = ? WHERE id = ?',
      [customerId, invoiceDate, subtotal, vatAmount, totalAmount, id]
    );
  }

  async deleteInvoiceItems(invoiceId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<InvoiceItem>('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{totalItems: number, totalInvoices: number, totalCustomers: number}> {
    if (!this.db) throw new Error('Database not initialized');
    
    const itemCount = await this.db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM items');
    const invoiceCount = await this.db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM invoices');
    const customerCount = await this.db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM customers');
    
    return {
      totalItems: itemCount?.count || 0,
      totalInvoices: invoiceCount?.count || 0,
      totalCustomers: customerCount?.count || 0
    };
  }
}

export const databaseService = new DatabaseService();