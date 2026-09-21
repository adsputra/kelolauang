export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          amount: string;
          category: string;
          created_at: string;
          date: string;
          id: string;
          idempotency_key: string | null;
          notes: string | null;
          type: 'income' | 'expense';
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          date: string;
          id?: string;
          idempotency_key?: string | null;
          notes?: string | null;
          type: 'income' | 'expense';
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          date?: string;
          idempotency_key?: string | null;
          notes?: string | null;
          type?: 'income' | 'expense';
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          monthly_limit: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          monthly_limit?: number;
          name: string;
          updated_at?: string;
        };
        Update: {
          monthly_limit?: number;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_finance_overview: {
        Args: { p_as_of: string };
        Returns: unknown;
      };
      reset_finance_data: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
