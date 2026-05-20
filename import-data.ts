import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)');
  process.exit(1);
}

console.log('✓ Loaded Supabase credentials');
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✓ Using service role key (can bypass RLS)');
} else {
  console.log('⚠️  Using public key (may fail due to RLS policies)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(';');
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const obj: Record<string, string> = {};
    const values = line.split(';');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j].trim()] = values[j]?.trim() || '';
    }

    rows.push(obj);
  }

  return rows;
}

async function importData() {
  try {
    console.log('🚀 Starting data import...\n');

    // Get user ID from environment or use provided one
    const currentUserId = process.env.VITE_SUPABASE_USER_ID || '797ad5df-2e57-4282-ba24-e23d66768ab5';
    console.log(`✓ Using user ID: ${currentUserId}\n`);

    // Import budgets
    console.log('📊 Importing budgets...');
    const budgetsPath = path.join(process.cwd(), 'budgets-export-2026-05-17_22-09-33.csv');
    const budgetsContent = fs.readFileSync(budgetsPath, 'utf-8');
    const budgets = parseCSV(budgetsContent);

    if (budgets.length > 0) {
      const { error: budgetsError } = await supabase.from('budgets').insert(
        budgets.map((row: any) => ({
          id: row.id,
          year: parseInt(row.year),
          category: row.category,
          amount: parseInt(row.amount),
          created_at: row.created_at,
          updated_at: row.updated_at,
          user_id: currentUserId,
        }))
      );

      if (budgetsError) {
        console.error('❌ Error importing budgets:', budgetsError);
      } else {
        console.log(`✅ Imported ${budgets.length} budgets\n`);
      }
    }

    // Import expenses
    console.log('💰 Importing expenses...');
    const expensesPath = path.join(process.cwd(), 'expenses-export-2026-05-17_22-09-14.csv');
    const expensesContent = fs.readFileSync(expensesPath, 'utf-8');
    const expenses = parseCSV(expensesContent);

    if (expenses.length > 0) {
      const { error: expensesError } = await supabase.from('expenses').insert(
        expenses.map((row: any) => {
          let items: any = [];
          try {
            // Parse the items JSON array from the CSV
            if (row.items && row.items.trim() !== '[]') {
              items = JSON.parse(row.items);
            }
          } catch (e) {
            console.warn(`⚠️ Could not parse items for ${row.category} in ${row.month}`);
          }

          return {
            id: row.id,
            year: parseInt(row.year),
            month: row.month,
            category: row.category,
            items: items,
            created_at: row.created_at,
            updated_at: row.updated_at,
            user_id: currentUserId,
          };
        })
      );

      if (expensesError) {
        console.error('❌ Error importing expenses:', expensesError);
      } else {
        console.log(`✅ Imported ${expenses.length} expenses\n`);
      }
    }

    console.log('🎉 Data import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

importData();
