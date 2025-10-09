/**
 * SessionManager: Per-connection session isolation for MCP server
 *
 * Ensures each MCP client connection gets its own isolated session context,
 * preventing race conditions and context leakage between concurrent agents.
 */

export type SessionContext = {
  session_id: string;
  user_id: string | null;
  lang: "auto" | "en" | "ar";
  budget_tokens: number;
  tenant: string | null;
  created_at: number;
  last_activity: number;
};

export class SessionManager {
  private sessions: Map<string, SessionContext> = new Map();
  private connectionToSession: Map<string, string> = new Map();
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes

  /**
   * Get or create a session for a given connection ID
   */
  getOrCreate(connectionId: string): SessionContext {
    // Check if connection already has a session
    let sessionId = this.connectionToSession.get(connectionId);

    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.last_activity = Date.now();
      return { ...session };
    }

    // Create new session
    sessionId = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    const session: SessionContext = {
      session_id: sessionId,
      user_id: null,
      lang: "auto",
      budget_tokens: 0,
      tenant: null,
      created_at: Date.now(),
      last_activity: Date.now(),
    };

    this.sessions.set(sessionId, session);
    this.connectionToSession.set(connectionId, sessionId);

    console.info(`[SessionManager] Created new session ${sessionId} for connection ${connectionId}`);

    return { ...session };
  }

  /**
   * Update an existing session context
   */
  update(connectionId: string, updates: Partial<SessionContext>): SessionContext {
    const sessionId = this.connectionToSession.get(connectionId);

    if (!sessionId || !this.sessions.has(sessionId)) {
      throw new Error(`No session found for connection ${connectionId}`);
    }

    const session = this.sessions.get(sessionId)!;
    Object.assign(session, updates);
    session.last_activity = Date.now();

    console.info(`[SessionManager] Updated session ${sessionId}`);

    return { ...session };
  }

  /**
   * Get session for a connection (without creating)
   */
  get(connectionId: string): SessionContext | null {
    const sessionId = this.connectionToSession.get(connectionId);

    if (!sessionId || !this.sessions.has(sessionId)) {
      return null;
    }

    const session = this.sessions.get(sessionId)!;
    session.last_activity = Date.now();

    return { ...session };
  }

  /**
   * Clean up session when connection closes
   */
  cleanup(connectionId: string): void {
    const sessionId = this.connectionToSession.get(connectionId);

    if (sessionId) {
      this.sessions.delete(sessionId);
      this.connectionToSession.delete(connectionId);
      console.info(`[SessionManager] Cleaned up session ${sessionId} for connection ${connectionId}`);
    }
  }

  /**
   * Clean up stale sessions (older than timeout)
   */
  cleanupStale(): void {
    const now = Date.now();
    const staleConnections: string[] = [];

    for (const [connectionId, sessionId] of this.connectionToSession.entries()) {
      const session = this.sessions.get(sessionId);

      if (session && now - session.last_activity > this.sessionTimeout) {
        staleConnections.push(connectionId);
      }
    }

    for (const connectionId of staleConnections) {
      this.cleanup(connectionId);
    }

    if (staleConnections.length > 0) {
      console.info(`[SessionManager] Cleaned up ${staleConnections.length} stale sessions`);
    }
  }

  /**
   * Get statistics about active sessions
   */
  stats(): { total_sessions: number; total_connections: number } {
    return {
      total_sessions: this.sessions.size,
      total_connections: this.connectionToSession.size,
    };
  }
}

// Global singleton instance
export const sessionManager = new SessionManager();

// Run cleanup every 5 minutes
setInterval(() => {
  sessionManager.cleanupStale();
}, 5 * 60 * 1000);
