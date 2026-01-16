# SECURE.md  
**Secure-by-Design Guidelines for AI-Enabled Software**

This document defines the security guidelines for this project, with a focus on applications that use AI agents and OpenAI APIs (e.g., Chat Completions, Tools/Functions, Code Generation).

All contributors **must** follow these practices.

## 1. Security Principles
- Least Privilege
- Secure by Default
- Defense in Depth
- Privacy & Data Minimization
- Auditability

## 2. Threat Model
- Prompt Injection & Tool Misuse
- Data Exfiltration
- Code Execution / Supply Chain
- AuthN/AuthZ Failures
- Abuse & Resource Exhaustion

## 3. Secrets & API Keys
- Never hard‑code secrets
- Environment variables or secret managers
- Rotation procedures
- Access control

## 4. Data Protection & Privacy
- Minimize data sent to models
- Avoid sending sensitive data
- Encrypt at rest/in transit
- Redaction and safe logging

## 5. Authentication & Authorization
- Strong authentication
- Server‑side authorization checks
- Secure session handling

## 6. Input Handling & Validation
- Treat all inputs as untrusted
- Validate and sanitize
- Prompt injection protection
- Validate AI-generated actions

## 7. Agent / Tool Security
- Restrict tool scope
- Validate tool arguments
- Sanitize results
- Sandbox or review AI‑generated code

## 8. Dependencies & Supply Chain
- Pin versions
- Vulnerability scanning
- Reproducible builds

## 9. Logging, Monitoring, Incident Response
- Secure logging (no secrets)
- Monitoring & alerts
- Incident response procedures

## 10. Deployment & Environment Security
- Separate dev/test/prod
- HTTPS, no debug in prod
- Access control for deployments
- Secure backups

## 11. Developer Responsibilities
- Follow SECURE.md
- Include security considerations in PRs
- Request security review when needed

## 12. Checklist
- No secrets committed
- Inputs/outputs validated
- Tools permission‑checked
- No unnecessary PII to models
- Dependencies scanned
- AuthN/AuthZ present
- Secure logging
- Security review done
