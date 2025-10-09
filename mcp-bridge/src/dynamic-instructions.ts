import { sessionManager } from "./session-manager.js";

function getConnectionId(): string {
  // This should match the getConnectionId function in eyes.ts
  // For now, we'll use a simple implementation
  return "default-connection";
}

export function getDynamicInstructions(): string {
  try {
    const connectionId = getConnectionId();
    const session = sessionManager.get(connectionId);

    if (!session) {
      return `🧿 THIRD EYE OVERSEER - STRICT VALIDATION REQUIRED

Third Eye enforces quality gates and validates work products. Submit complete work via 'third-eye/oversee' tool.

REQUIREMENTS (ALL MANDATORY):
- intent: Clear validation request
- work: Actual content to validate (code/plan/draft/requirements)
- context_info: Project details affecting validation
- reasoning_md: Your justification and design decisions

Third Eye NEVER authors deliverables - it only validates and approves/rejects your work.`;
    }

    // Strict instructions based on session state
    const baseInstructions = "🧿 THIRD EYE VALIDATION OVERSEER: ";

    if (session.budget_tokens === 0) {
      return baseInstructions + "Ready for validation requests. Submit complete work packages via 'third-eye/oversee'. ALL FIELDS REQUIRED - incomplete submissions will be rejected.";
    }

    if (session.lang === "ar") {
      return baseInstructions + "نظام المراقبة الصارم. جميع الحقول مطلوبة للتحقق من صحة العمل. استخدم أداة 'third-eye/oversee' لتقديم العمل المكتمل.";
    }

    return baseInstructions + "Session active. Submit complete work for validation via 'third-eye/oversee'. Third Eye enforces standards - provide intent, work content, context, and reasoning.";

  } catch (error) {
    // Fallback to static instructions emphasizing strict validation
    return "🧿 THIRD EYE OVERSEER: Submit complete work for mandatory validation via 'third-eye/oversee'. Requires intent, work content, context, and reasoning. Incomplete submissions REJECTED.";
  }
}