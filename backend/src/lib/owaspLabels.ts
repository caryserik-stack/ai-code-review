// backend/src/lib/owaspLabels.ts
export const OWASP_LABELS: Record<string, { code: string; label: string }> = {
  A01_BROKEN_ACCESS_CONTROL: { code: "A01", label: "Broken Access Control" },
  A02_CRYPTOGRAPHIC_FAILURES: { code: "A02", label: "Cryptographic Failures" },
  A03_INJECTION: { code: "A03", label: "Injection" },
  A04_INSECURE_DESIGN: { code: "A04", label: "Insecure Design" },
  A05_SECURITY_MISCONFIGURATION: { code: "A05", label: "Security Misconfiguration" },
  A06_VULNERABLE_COMPONENTS: { code: "A06", label: "Vulnerable Components" },
  A07_AUTH_FAILURES: { code: "A07", label: "Identification & Auth Failures" },
  A08_SOFTWARE_DATA_INTEGRITY_FAILURES: { code: "A08", label: "Software & Data Integrity Failures" },
  A09_LOGGING_MONITORING_FAILURES: { code: "A09", label: "Logging & Monitoring Failures" },
  A10_SSRF: { code: "A10", label: "Server-Side Request Forgery" },
};