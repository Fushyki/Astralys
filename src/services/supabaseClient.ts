import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ukzjqqrenmduebvxtxhy.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrempxcXJlbm1kdWVidnh0eGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTQxMTMsImV4cCI6MjA5ODA5MDExM30.CnbNZ7BolHhEYqWo-JuYIozAXwvXZZClsxXh1yY7r7s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
