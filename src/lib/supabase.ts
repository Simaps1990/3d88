import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Realization = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  image_url_2?: string | null;
  image_url_3?: string | null;
  category?: string | null;
  created_at: string;
  published: boolean;
  order_position?: number | null;
};

export type QuoteRequest = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  file_url?: string;
  file_name?: string;
  status: string;
  created_at: string;
};

export type SiteText = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
};
