import { spawn } from "node:child_process";

export function launchPortal(sessionId: string, auto = true): void {
  if (!sessionId) return;
  const args = ["run", "third_eye.cli", "portal", "--session-id", sessionId];
  if (auto) {
    args.push("--auto");
  } else {
    args.push("--no-auto");
  }
  const command = process.env.UV_PATH ?? "uv";
  try {
    const child = spawn(command, args, {
      stdio: "ignore",
      detached: true,
    });
    child.unref();
    console.info(`[Portal] Launched portal for session ${sessionId} with command: ${command} ${args.join(' ')}`);
  } catch (error) {
    console.warn(`[Portal] Failed to launch portal for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
    console.warn(`[Portal] Command attempted: ${command} ${args.join(' ')}`);
    console.warn(`[Portal] Ensure 'uv' is installed or set UV_PATH environment variable to correct Python runner`);
  }
}
