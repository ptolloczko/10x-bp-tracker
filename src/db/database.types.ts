export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      interpretation_logs: {
        Row: {
          created_at: string;
          dia: number;
          id: string;
          level: Database["public"]["Enums"]["bp_level"];
          measurement_id: string;
          notes: string | null;
          pulse: number;
          sys: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dia: number;
          id?: string;
          level: Database["public"]["Enums"]["bp_level"];
          measurement_id: string;
          notes?: string | null;
          pulse: number;
          sys: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dia?: number;
          id?: string;
          level?: Database["public"]["Enums"]["bp_level"];
          measurement_id?: string;
          notes?: string | null;
          pulse?: number;
          sys?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interpretation_logs_measurement_id_fkey";
            columns: ["measurement_id"];
            isOneToOne: false;
            referencedRelation: "measurements";
            referencedColumns: ["id"];
          },
        ];
      };
      measurements: {
        Row: {
          created_at: string;
          deleted: boolean;
          dia: number;
          id: string;
          level: Database["public"]["Enums"]["bp_level"];
          measured_at: string;
          notes: string | null;
          pulse: number;
          sys: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted?: boolean;
          dia: number;
          id?: string;
          level: Database["public"]["Enums"]["bp_level"];
          measured_at: string;
          notes?: string | null;
          pulse: number;
          sys: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted?: boolean;
          dia?: number;
          id?: string;
          level?: Database["public"]["Enums"]["bp_level"];
          measured_at?: string;
          notes?: string | null;
          pulse?: number;
          sys?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          dob: string | null;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          reminder_enabled: boolean;
          sex: string | null;
          timezone: string;
          updated_at: string;
          user_id: string;
          weight: number | null;
        };
        Insert: {
          created_at?: string;
          dob?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          reminder_enabled?: boolean;
          sex?: string | null;
          timezone?: string;
          updated_at?: string;
          user_id: string;
          weight?: number | null;
        };
        Update: {
          created_at?: string;
          dob?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          reminder_enabled?: boolean;
          sex?: string | null;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
          weight?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      bp_level: "optimal" | "normal" | "high_normal" | "grade1" | "grade2" | "grade3" | "hypertensive_crisis";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bp_level: ["optimal", "normal", "high_normal", "grade1", "grade2", "grade3", "hypertensive_crisis"],
    },
  },
} as const;
