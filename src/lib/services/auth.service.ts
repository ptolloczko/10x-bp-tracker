// src/lib/services/auth.service.ts
import type { SupabaseClient } from "@/db/supabase.client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthResponse {
  user: User;
  session: Session;
}

/**
 * Service for authentication operations
 * Handles communication with Supabase Auth
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Authenticates a user with email and password
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns User and session data
   * @throws {Error} When authentication fails
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Login failed: No user or session returned");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Registers a new user with email and password
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns User and session data
   * @throws {Error} When registration fails
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Registration failed: No user or session returned");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Signs out the current user
   *
   * @throws {Error} When sign out fails
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Sends a password reset email
   *
   * @param email - User's email address
   * @param redirectTo - URL to redirect after password reset
   * @throws {Error} When sending email fails
   */
  async sendPasswordResetEmail(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Updates the user's password
   * Requires an active session (from password reset link)
   *
   * @param newPassword - New password
   * @throws {Error} When password update fails
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Gets the currently authenticated user
   *
   * @returns User data or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user;
  }
}
