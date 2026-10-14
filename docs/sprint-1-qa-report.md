# ShopSense — Sprint 1 QA Review Report

**Project:** ShopSense: Personalized Shopping Research Agent (IT314 Group 13)  
**Date:** 14 October 2026  
**QA Engineer:** Palak Patel (`palakpatel-lab` / Student ID: 202401133)  
**Sprint:** Sprint 1 Review Check (Task T-16 / Row 12)  
**Target Codebase:** Backend & Pipeline Core (Commit `dc1187c`)  

---

## 1. Executive Summary

This report documents the comprehensive quality assurance testing performed on the Sprint 1 deliverables of the ShopSense project prior to repository migration. 

Testing encompassed:
1. Automated backend test suites (`pytest` covering unit, contract, golden, and fault injection tests).
2. Code quality, formatting, and linting standards (`ruff check .`).
3. Strict static type analysis (`mypy app`).
4. Stage contract schema validation and exports (`scripts/export_contracts.py`).
5. Sprint 1 requirement verifications (end-to-end CLI search, intent detection, category lexicon rules, product criteria generation, and interview turn logic).
6. Fault tolerance and circuit breaker fallbacks under simulated service outages.

### Overall Results
* **Automated Tests:** 564 executed, **564 PASSED**, 0 failed.
* **Code Coverage:** **97.63%** total coverage (exceeds the required 70.0% threshold and 80.0% target on decision logic).
* **Linting & Formatting:** **PASSED** (0 errors, 120 char limit enforced).
* **Static Type Checking:** **PASSED** (`strict = true`, 60 source files checked, 0 errors).
* **Exit Criteria Status:** **PASSED & CERTIFIED FOR SPRINT 1 REVIEW**.

---

## 2. Test Execution Matrix

| Test ID | Test Category | Scenario / Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | End-to-End CLI | Run `python -m app.cli "best laptop for coding under 70k"` | System detects laptop, parses ₹70k budget, loads fallback criteria, runs stub interview, and outputs ranked shortlist with scores and sources. | Outputs ranked list (Nova Book 14, Kestrel Slim 15, Orion Play 15) with scores, citations, filtered items, and coverage note. | **PASS** |
| **TC-02** | Intent Detection | Parse explicit query `gaming laptop under 80k` | Intent mapped to `category=laptop`, `use_case=gaming`, `budget=80000`, `region=IN`, `detected_by=rules`. | Correctly extracted category, use, ₹80,000 budget, and region. | **PASS** |
| **TC-03** | Clarification (Ambiguity) | Parse ambiguous term `watch` | System identifies ambiguity and prompts follow-up options (Smartwatch, Fitness band, Analog watch) without guessing. | Returned 3 options; refused to start research until category clarified. | **PASS** |
| **TC-04** | Clarification (Missing Type) | Parse request without product `something for my mom` | System prompts user for product category with suggested buttons. | Prompted: `What kind of product are you looking for? 1. Smartphone 2. Laptop 3. Mixer grinder 4. Smartwatch`. | **PASS** |
| **TC-05** | Criteria Generation | Generate criteria for detected laptop category | Returns 7–10 criteria with plain definitions; always includes `Value for money`. | Returned 8 defined criteria tailored to laptops, including `Value for money`. | **PASS** |
| **TC-06** | Interview Turn Logic | Execute initial turn with response `medium` | Turn records qualitative weight as numeric value and transitions state. | Question generated and answered; state stored without crashing. | **PASS** |
| **TC-07** | Stage Contract Validation | Execute `tests/contract/test_contracts.py` | All Pydantic stage input/output models enforce strict frozen schemas and serialization. | All 58 contract test assertions passed. | **PASS** |
| **TC-08** | Stage Stubs | Execute `tests/contract/test_stage_stubs.py` | All 11 pipeline stages implement `Stage` protocol (`run` and `fallback`). | All 26 stub stage tests passed. | **PASS** |
| **TC-09** | Golden LLM Output | Execute `tests/golden/` (intent, criteria, llm output) | Parsers gracefully recover from malformed JSON, markdown fences, truncation, and missing keys. | All 69 golden tests passed cleanly. | **PASS** |
| **TC-10** | Fault: All Providers Down | Execute `test_all_providers_down.py` | Client raises `LLMUnavailable` within 1s, rotates across all configured providers, and logs attempts. | Providers Groq, Gemini, OpenRouter, Cerebras attempted and logged; raised `LLMUnavailable`. | **PASS** |
| **TC-11** | Fault: Intake Stage Failure | Execute `test_intake_fallback.py` | If LLM intake crashes, stage fallback utilizes keyword rules layer to produce valid `Intent`. | `report.status = StageStatus.FALLBACK`; valid `Intent` generated via rules. | **PASS** |
| **TC-12** | Fault: Criteria Failure | Execute `test_criteria_fallback.py` | If criteria generation fails, fallback returns category-specific predefined set. | Category-specific fallback loaded; research proceeds safely. | **PASS** |
| **TC-13** | Fault: Pipeline Fallback | Execute `test_pipeline_fallback.py` | Simulated research failure and database disconnection do not crash the search run. | Research fallback recorded, search finished, store failure marked `saved=False` gracefully. | **PASS** |
| **TC-14** | Code Linter | Run `ruff check .` | Adheres to style rules (E, F, W, I, B, UP, SIM, RUF). | All checks passed (0 warnings, 0 errors). | **PASS** |
| **TC-15** | Static Type Checker | Run `mypy app` | Strict type checking with pydantic plugin. | Success: no issues found in 60 source files. | **PASS** |
| **TC-16** | Contract Schema Export | Run `python -m scripts.export_contracts` | Emits 56 JSON schemas and 12 example payloads in UTF-8 with LF line endings. | Wrote 56 schemas and 12 examples matching Python contracts. | **PASS** |
| **TC-17** | Browser UI Interaction | Interactive UI input, interview dialog, and results rendering in Next.js web application. | Complete visual flow from intake box to ranking card display. | **NOT EXECUTED LOCALLY** (Node.js/npm runtime not installed on host machine). | **UNABLE TO RUN** |

---

## 3. Discovered Observations & Deviations

1. **Starlette Deprecation Warning:**
   - **File:** `.venv\Lib\site-packages\fastapi\testclient.py:1`
   - **Message:** `StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated; install httpx2 instead.`
   - **Severity:** Low (Cosmetic warning during test runs).
   - **Impact:** No functional disruption; tests pass cleanly.

2. **Frontend Test Scope:**
   - The browser interface (Next.js App Router) is isolated on branch `feature/US-01-frontend-foundation`. Frontend dependencies require Node.js, which was not installed on the current evaluation host. Backend APIs (`/api/health`, `/api/search`) and contracts were verified via FastAPI TestClient.

---

## 4. Verification of Sprint 1 Exit Criteria

- [x] **Walking Skeleton End-to-End:** CLI runs query through all 11 stages and outputs ranked products with source citations.
- [x] **Contract Safety:** Every stage has strict Pydantic contracts and contract tests.
- [x] **Intent Detection:** Correctly identifies category, use, budget (supports k, lakh, ₹), region, and constraints; keyword fallback works offline.
- [x] **Clarification:** Ambiguous inputs ("watch", "something for my mom") trigger clarification options instead of guessing.
- [x] **Category Criteria:** Criteria with plain definitions generated for categories; fallback sets available for unseen/offline modes.
- [x] **Fault Tolerance:** Offline execution works without network calls; provider outages trigger graceful fallbacks.
- [x] **Code Quality:** 100% clean `ruff` and `mypy` execution with 97.63% test coverage.

**Conclusion:** The backend core meets all functional and quality requirements for Sprint 1.
