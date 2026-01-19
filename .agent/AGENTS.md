# 🧠 HMCTS Agents Manifest

This handbook defines His Majesty’s Courts and Tribunals Service (HMCTS) standards for developing and operating AI-powered agents, copilots, and automations. It aligns with the HMCTS Responsible Technology Principles, the Ministry of Justice (MoJ) security baseline, and cross-government AI guidance. All contributors must follow this guidance before enabling any agent (e.g., GitHub Copilot, OpenAI assistants, Anthropic Claude, Microsoft Copilot, bespoke GPTs) within HMCTS delivery environments.

---

## 1. Overview
- Ensure every AI capability is operated within approved HMCTS environments and upholds legal, privacy, and security obligations.
- Require full traceability: prompts, outputs, and deployment decisions must be attributable, reviewable, and auditable.
- Embed responsible AI controls into everyday engineering practice, including this Playwright test project.

---

## 2. Agent Categories
| Category | Description | Example Tools | Access Level |
|----------|-------------|---------------|--------------|
| **Code Agents** | Accelerate delivery through code generation, refactoring, tests, and static analysis. | GitHub Copilot, OpenAI Assistants, Cursor AI | Engineering teams |
| **Knowledge Agents** | Summarise policy, surface documentation, and answer procedural queries. | ChatGPT Enterprise, Microsoft Copilot, Custom HMCTS GPTs | HMCTS staff |
| **Operations Agents** | Automate CI/CD, monitoring, incident triage, and infrastructure tasks. | Azure Copilot, GitHub Actions Bots, PagerDuty AI | DevOps / SRE |
| **Domain Agents** | Provide domain-specific reasoning (case management, analytics, accessibility). | Power Platform Copilot, bespoke MoJ GPTs | Business & Functional units |

---

## 3. HMCTS Core Governance Principles

### 3.1 Security
- Agents operate only on HMCTS-managed infrastructure (MoJ Cloud Platform, Azure, or accredited on-prem).
- Never transmit restricted data, client materials, or live case details to public endpoints.
- Secrets stored in Azure Key Vault or MoJ Key Management Service; environment variables redacted in prompts.
- Apply HMCTS data classification, redaction, and prompt sanitisation before model submission.
- All outbound model calls traverse approved Secure API Gateways; direct internet egress for agents is prohibited.

### 3.2 Privacy & Compliance
- Comply with UK GDPR, Data Protection Act 2018, ISO 27001, and MoJ Security Policy.
- Prefer enterprise contracts: Azure OpenAI, MoJ-approved Anthropic tenancy, or MoJ-hosted LLMs.
- Retain logs in accordance with MoJ retention schedules; ensure outputs are auditable.
- Respect regional hosting constraints and client contractual obligations.

### 3.3 Transparency
- Attribute AI assistance in code, documentation, and change logs, e.g.  
  ```bash
  git commit -m "feat: add case filter helper [Generated with HMCTS AI Assistant v1]"
  ```
- Record prompts, responses, and reasoning steps in Azure Monitor / Log Analytics (or approved log stores).
- Maintain agent model cards outlining data sources, fine-tuning history, risk mitigations, and owners.

### 3.4 Human Oversight
- No AI-generated artefact reaches production without human review (code review, test evidence, or SME sign-off).
- CI pipelines must gate AI-originated changes with manual approval steps.
- Agents executing autonomously use scoped service identities following least-privilege and managed identity patterns.

### 3.5 Responsible AI & Ethics
- Adhere to HMCTS Responsible Technology Principles: fairness, accountability, transparency, privacy, and safety.
- Complete an HMCTS AI Risk Assessment before go-live; reassess on major updates.
- Disallow outputs that are discriminatory, misleading, or intended to bypass compliance controls.

---

## 4. Implementation Standards

### 4.1 Configuration Guidelines
- Limit prompt context to the minimum viable data; explicitly scrub PII and restricted materials.
- Scope access via Azure AD / MoJ RBAC groups; rotate secrets and tokens regularly.
- Track model configuration, prompt templates, and evaluation results in Azure DevOps or GitHub Projects.
- Apply existing Data Loss Prevention (DLP) and classification tooling to AI chat and log streams.

### 4.2 Audit & Traceability
- Attach metadata to every AI-generated asset:  
  - `agent_name`, `version`, `prompt_id`, `reviewer`, `timestamp`, `audit_reference`.
- Send logs to Microsoft Sentinel (or designated SIEM) for **minimum 7-year retention** unless policy dictates longer.
- Provide audit trails linking commits, test evidence, and deployment tickets back to originating prompts.

### 4.3 Integration Architecture
- Route all agent traffic through HMCTS-secured gateways; no unmanaged outbound connectivity.
- Authenticate via Azure AD; enforce conditional access and multifactor safeguards.
- Prefer Azure OpenAI, MoJ Anthropic tenancy, or HMCTS-hosted LLMs; justify any alternative via governance review.

---

## 5. HMCTS AI Governance Framework
| Layer | Description | Owner |
|-------|-------------|-------|
| **Policy** | Defines Responsible AI standards, risk appetite, and compliance controls. | HMCTS Digital Governance Board |
| **Platform** | Operates secure infrastructure, networking, and monitoring for AI workloads. | MoJ Cloud Engineering & Cyber Security |
| **Usage** | Oversees departmental adoption, training, and operational guardrails. | HMCTS Product & Delivery Leads |
| **Audit** | Performs independent reviews, red-teaming, and continuous risk assessment. | HMCTS Internal Audit & Assurance |

---

## 6. Developer & Operator Best Practices

### ✅ Do
- Use only HMCTS-approved tools, tenants, and model endpoints.
- Apply structured prompt templates; log prompt IDs and scenarios.
- Annotate AI-generated code and include reviewer sign-off in pull requests.
- Run `yarn lint`, `yarn test:*`, and capture Playwright reports (HTML, Odhín, JUnit) for evidence.
- Complete HMCTS AI Safety & Prompt Engineering training modules annually.

### ❌ Don’t
- Expose client data, credentials, or unreleased legal content to models.
- Use personal AI accounts or unapproved SaaS extensions.
- Allow agents to push directly to `main`/`master` branches or production environments.
- Disable telemetry, redact audit trails, or bypass manual review gates.

---

## 7. HMCTS Agent Metadata Template

```yaml
agent:
  name: "HMCTS-Copilot-Playwright"
  version: "v1.0"
  type: "code"
  owner: "HMCTS Digital Delivery"
  model_provider: "Azure OpenAI"
  data_policy:
    retention_days: 30
    pii_handling: "mask"
    encryption: "AES-256-GCM"
  review_required: true
  audit_reference: "HMCTS-AI-2025-04"
  last_audit: "2025-10-01"
  region: "UK South"
  compliance: ["UK GDPR", "ISO27001", "MoJ Security Policy"]
```

---

## 8. Governance Lifecycle
| Stage | Description | Deliverables |
|-------|-------------|--------------|
| **Plan** | Define objectives, risk profile, data flows, and contractual impacts. | Risk register, DPIA, architecture diagram |
| **Develop** | Build prompts, evaluate safety, and run red-team tests. | Prompt/eval specs, safety test results |
| **Deploy** | Release only after governance approval and security review. | Change request, approval record |
| **Monitor** | Continuously monitor drift, usage, and abuse signals. | Sentinel dashboards, alert runbooks |
| **Retire** | Decommission deprecated agents; revoke access and archive logs. | Retirement plan, access revocation evidence |

---

## 9. Operational Quick Reference (This Repository)
- **Reporter selection:**  
  - `PLAYWRIGHT_DEFAULT_REPORTER` controls the single default reporter (defaults to `list` locally, `dot` in CI).  
  - Override fully via `PLAYWRIGHT_REPORTERS=list,html` or `PLAYWRIGHT_REPORTERS=list,odhin`.
- **HTML report:**  
  ```bash
  PLAYWRIGHT_REPORTERS=list,html yarn playwright test
  open playwright-report/index.html
  ```
- **Odhín report:**  
  ```bash
  PW_ODHIN_START_SERVER=true PLAYWRIGHT_REPORTERS=list,odhin yarn playwright test
  # open test-results/odhin-report/playwright-odhin.html
  ```
  Key env vars: `PW_ODHIN_OUTPUT`, `PW_ODHIN_INDEX`, `PW_ODHIN_TITLE`, `PW_ODHIN_ENV`, `PW_ODHIN_PROJECT`, `PW_ODHIN_RELEASE`, `PW_ODHIN_TEST_FOLDER`, `PW_ODHIN_TEST_OUTPUT`, `PW_ODHIN_API_LOGS`.
- **JUnit XML:**  
  ```bash
  PLAYWRIGHT_REPORTERS=list,junit yarn playwright test
  # artifact: playwright-junit.xml (override with PLAYWRIGHT_JUNIT_OUTPUT)
  ```
- **Core automation commands:**  
  ```bash
  yarn test:chrome        # default UI suite
  yarn test:a11y          # accessibility with axe-core
  yarn test:visual        # visual regression (chromium)
  yarn lint               # tsc + eslint
  yarn setup              # install Playwright browsers
  ```

---

## 10. References
- HMCTS Responsible Technology Principles (internal)  
- MoJ Security Policy Framework & Cloud Operating Model  
- UK Government Algorithmic Transparency Recording Standard (GDS)  
- Information Commissioner’s Office: AI & Data Protection Guidance  
- NIST AI Risk Management Framework  
- OECD AI Principles  
- Microsoft Responsible AI Standard v2 (for Azure OpenAI tenancy)  
- OpenAI Safety Best Practices (enterprise tenancy)
