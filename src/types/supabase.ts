export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          name: string;
          category: string;
          due_date: string;
          description: string;
          status: string;
          user_id: string;
          created_at: string;
          is_admin_task: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          due_date: string;
          description: string;
          status: string;
          user_id: string;
          created_at?: string;
          is_admin_task?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          due_date?: string;
          description?: string;
          status?: string;
          user_id?: string;
          created_at?: string;
          is_admin_task?: boolean;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: string;
          created_at: string;
          last_active: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: string;
          created_at?: string;
          last_active?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: string;
          created_at?: string;
          last_active?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          created_by?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subscription: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription?: any;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      delete_user: {
        Args: { user_id: string };
        Returns: void;
      };
      get_user_stats: {
        Args: Record<string, never>;
        Returns: {
          total_users: number;
          active_today: number;
          new_this_week: number;
        };
      };
    };
  };
}