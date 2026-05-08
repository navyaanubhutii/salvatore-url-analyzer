# SALVATORE
### Heuristic URL Risk Assessment Engine

> A fully offline, privacy-first mobile application that detects phishing, typosquatting, redirect abuse, brand impersonation, and other URL-based threats using a multi-layer static heuristic analysis engine — without making any network calls.

---

## Table of Contents

1. [What This App Is (and Is Not)](#what-this-app-is)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Analysis Pipeline](#analysis-pipeline)
5. [Backend: Analysis Engines](#backend-analysis-engines)
6. [Frontend: Screens & Components](#frontend-screens--components)
7. [Constants & Configuration](#constants--configuration)
8. [Types & Utilities](#types--utilities)
9. [Scoring System](#scoring-system)
10. [Threat Encyclopedia](#threat-encyclopedia)
11. [Running the App](#running-the-app)
12. [Test Cases](#test-cases)

---

## What This App Is

**SALVATORE is a Heuristic-based URL Risk Assessment Engine.**

| It IS | It is NOT |
|---|---|
| A static feature extractor | A malware sandbox |
| A weighted suspicion indicator system | A real-time blocklist checker |
| A pattern-matching heuristic analyzer | An AI classifier |
| A privacy-preserving, offline tool | A network-dependent scanner |

The app extracts structural, lexical, semantic, and entropic features from a URL string, weighs them against a calibrated scoring model, and produces a risk assessment with explainable detection results. Every analysis happens entirely on-device — no URL is ever sent to any server.

---

## Architecture Overview

```
User Input (URL String)
        │
        ▼
┌───────────────────┐
│   Normalizer      │  Prepend protocol, trim whitespace
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   URL Parser      │  Extract: protocol, hostname, subdomains,
└────────┬──────────┘  rootDomain, TLD, path, query
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌────────────────────┐             ┌────────────────────────┐
│ Structural         │             │ Brand Impersonation     │
│ Heuristics Engine  │             │ Engine                  │
│ (heuristics.ts)    │             │ (brandImpersonation.ts) │
└────────┬───────────┘             └──────────┬─────────────┘
         │                                    │
         ├──────────────────────────────────┐ │
         │                                  │ │
         ▼                                  ▼ ▼
┌────────────────────┐          ┌───────────────────────┐
│ Entropy Engine     │          │ Path & Query Analyzer  │
│ (entropyEngine.ts) │          │ (pathAnalyzer.ts)      │
└────────┬───────────┘          └──────────┬────────────┘
         │                                 │
         └──────────────┬──────────────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ Suppression Engine  │  Trust calibration: dampens
             │ (suppressionEngine) │  scores for official domains
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ Scoring Engine      │  Risk score + Confidence level
             │ (scoringEngine.ts)  │  + Severity Risk Floor
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │  AnalysisReport     │  Structured output to UI
             └─────────────────────┘
```

---

## Project Structure

```
Salvatore-MAD/
│
├── app/                          # Expo Router pages (file-based routing)
│   ├── _layout.tsx               # Root layout: stack navigator, status bar, splash
│   ├── index.tsx                 # Entry point → HomeScreen
│   ├── result.tsx                # Results page → ResultScreen
│   └── threat-info.tsx           # Threat encyclopedia page → ThreatInfoScreen
│
├── src/
│   ├── screens/                  # Full-page UI screens
│   │   ├── HomeScreen.tsx        # URL input + validation + analysis trigger
│   │   ├── ResultScreen.tsx      # Full risk report display
│   │   └── ThreatInfoScreen.tsx  # Threat Encyclopedia (collapsible, auto-scroll)
│   │
│   ├── components/               # Reusable UI cards
│   │   ├── RiskCard.tsx          # Score dial, risk level, confidence badge
│   │   ├── BreakdownItem.tsx     # Single heuristic finding + ⓘ button
│   │   ├── BrandImpersonationCard.tsx  # Brand impersonation findings + ⓘ buttons
│   │   └── PathAnalysisCard.tsx  # Path/query semantic findings + ⓘ buttons
│   │
│   ├── services/                 # Analysis engines (the "backend")
│   │   ├── urlAnalyzer.ts        # Orchestrator: runs the full pipeline
│   │   ├── heuristics.ts         # Structural heuristics (IP, TLD, length, etc.)
│   │   ├── brandImpersonation.ts # Typosquatting, char-sub, subdomain confusion
│   │   ├── entropyEngine.ts      # Machine-generated domain detection
│   │   ├── pathAnalyzer.ts       # Path/query semantic analysis
│   │   ├── suppressionEngine.ts  # False-positive dampening for trusted domains
│   │   └── scoringEngine.ts      # Weighted accumulation + severity floors
│   │
│   ├── constants/                # Static reference data
│   │   ├── brands.ts             # Trusted domains + brand name registry
│   │   ├── authKeywords.ts       # High-risk auth bait keyword list
│   │   ├── charSubstitutions.ts  # Homoglyph / character substitution map
│   │   ├── shorteners.ts         # Known URL shortener domains
│   │   └── suspiciousTlds.ts     # Abuse-heavy TLD list
│   │
│   ├── data/
│   │   └── threatDatabase.ts     # Encyclopedia: all threats with descriptions,
│   │                             # attack patterns, examples, defense notes
│   │
│   ├── types/
│   │   └── engine.ts             # Shared TypeScript interfaces (HeuristicResult,
│   │                             # SeverityTier, TIER_MULTIPLIERS)
│   │
│   └── utils/
│       ├── parser.ts             # URL decomposition into ParsedUrl
│       ├── normalizer.ts         # Protocol prepending, whitespace cleanup
│       ├── validators.ts         # URL format validation
│       └── levenshtein.ts        # Edit-distance algorithm for typosquatting
│
├── constants/
│   └── theme.ts                  # Global design tokens (colors, spacing)
│
├── assets/images/                # App icons, splash screen assets
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

---

## Analysis Pipeline

The pipeline in `urlAnalyzer.ts` runs **sequentially and in one pass** — no async calls, no network.

### Stage 1 — Normalization (`normalizer.ts`)
Prepends `https://` if no protocol is present, trims whitespace, lowercases. Ensures the built-in `URL` parser can process the input.

### Stage 2 — Structural Parsing (`parser.ts`)
Decomposes the URL using the browser-native `URL` API:
```
https://paypal.login.verify.evil.xyz/account/confirm?next=https://paypal.com

protocol   → https
hostname   → paypal.login.verify.evil.xyz
subdomains → ['paypal', 'login', 'verify']
rootDomain → evil
tld        → xyz
path       → /account/confirm
query      → ?next=https://paypal.com
```

### Stage 3 — Feature Extraction (parallel detection layers)

All four engines run on the same `ParsedUrl` object:

| Engine | What it detects |
|---|---|
| `heuristics.ts` | HTTP, raw IP, suspicious TLD, domain length, hyphen abuse, subdomain depth, @ symbol, URL shorteners |
| `brandImpersonation.ts` | Exact brand keyword, character substitution, Levenshtein typosquatting, auth keyword correlation, subdomain trust confusion |
| `entropyEngine.ts` | Machine-generated domain patterns via digit/vowel ratio and alphanumeric clustering |
| `pathAnalyzer.ts` | Auth bait in path, open redirect parameters, encoded redirect payloads, excessive URL encoding, suspicious file extensions, deep path structure, fragment abuse |

### Stage 4 — Trust Validation (`suppressionEngine.ts`)
Checks if the root domain is in the verified trusted domain registry. If yes, applies a **suppression multiplier (0.3–0.6)** to the accumulated score. This prevents false positives for legitimate auth flows like `accounts.google.com/login`.

### Stage 5 — Scoring (`scoringEngine.ts`)
Applies the calibrated scoring model (see [Scoring System](#scoring-system)).

---

## Backend: Analysis Engines

### `heuristics.ts` — Structural Heuristics Engine

The first-pass detector. Checks basic URL anatomy for immediate red flags.

| Signal ID | Trigger Condition | Base Score | Tier |
|---|---|---|---|
| `https_check` | Protocol is HTTP, not HTTPS | 10 | Weak |
| `ip_detection` | Hostname matches IPv4 regex | 30 | Critical |
| `tld_check` | TLD in SUSPICIOUS_TLDS list | 15 | Strong |
| `length_check` | Domain > 30 chars | 10 | Moderate |
| `hyphen_check` | Domain has > 4 hyphens | 20 | Strong |
| `subdomain_depth` | > 3 subdomain levels | 15 | Strong |
| `at_symbol` | `@` present in URL | 35 | Critical |
| `shortener_check` | Hostname in SHORTENERS list | 15 | Moderate |

### `brandImpersonation.ts` — Brand Impersonation Engine

Five independent detection types, run in priority order:

**Type E (Subdomain Confusion)** — Runs first, highest weight:
`paypal.com.evil.xyz` → "paypal.com" in subdomain, actual root is "evil.xyz"

**Type B (Character Substitution)**:
Deobfuscates the domain using `charSubstitutions.ts` map (`0→o`, `1→l`, `3→e`, etc.), then checks if the result matches a trusted brand root.

**Type C (Typosquatting)**:
Runs Levenshtein edit distance against every trusted brand root. Edit distance 1 on domains ≥ 5 chars = Critical. Edit distance 2 on domains ≥ 7 chars = Strong.

**Type A (Exact Keyword)**:
Checks if any trusted brand root appears anywhere in the hostname but the domain is not the official one.

**Type D (Auth Keyword Correlation)**:
Only runs if a brand was already identified. Checks if the hostname also contains auth bait keywords (login, verify, secure, etc.) — a double-trust manipulation.

### `entropyEngine.ts` — Entropy Analysis Engine

Computes three signals from the full hostname:
- **Digit density**: `digits / totalLength > 0.30`
- **Vowel ratio**: `vowels / letters < 0.20` (only if > 5 letters)
- **Consecutive randomness**: 8+ alphanumeric chars with no clean alphabetic run

Score caps at 18 and tier is always `moderate` — entropy alone never forces a high risk classification.

### `pathAnalyzer.ts` — Path & Query Semantic Analyzer

Tokenizes the full path+query string by splitting on `/ - _ = & ?`. Checks:

| Signal ID | Detection Method |
|---|---|
| `auth_bait` | ≥2 auth keyword tokens from `authKeywords.ts` |
| `redirect_abuse` | Query contains redirect params (`next`, `redirect`, `url`, `return`, `goto`, `redir`) pointing to an external URL containing a trusted brand |
| `encoded_path` | ≥3 percent-encoded sequences (`%XX`) in the path |
| `suspicious_file` | Path ends in `.exe`, `.scr`, `.bat`, `.ps1`, `.cmd`, `.apk` |
| `path_depth` | > 5 path segments |
| `fragment_abuse` | Fragment (`#...`) contains a known brand name |

### `suppressionEngine.ts` — False Positive Suppression

**Why it exists**: Without suppression, `accounts.google.com/login?next=/dashboard` would trigger `auth_bait`, `redirect_abuse`, and `subdomain_depth` — 40+ points — and falsely label Google as high risk.

**How it works**:
1. Checks `rootDomain.tld` against the `TRUSTED_DOMAINS` registry
2. If matched: sets `isTrustedRoot = true` and `suppressionMultiplier = 0.3`
3. Marks specific signals for individual suppression (e.g., `auth_bait` is suppressed for trusted domains)
4. The scoring engine applies the multiplier to the entire accumulated score before classification

### `scoringEngine.ts` — Weighted Accumulation Engine

**Core principle**: Scores are *weighted heuristic suspicion indicators*, not probabilities.

**Risk accumulation**:
```
for each triggered signal:
  effectiveRisk = baseScore × suppressionFactor
  riskAccumulator += effectiveRisk
```

**Severity Risk Floor**:
Only `critical` tier signals establish a guaranteed minimum classification. This prevents a typosquat (+40 base) from landing in "Moderate" because it had no other signals:
```
critical tier → floor score at 76 (forces Critical classification)
strong/moderate/weak → no floor, natural accumulation only
```

**Confidence axis** (independent of risk):
```
critical signal → +25 confidence
strong signal   → +12 confidence
moderate signal → +6 confidence
weak signal     → +3 confidence

HIGH_CONFIDENCE_SIGNALS (@ symbol, typosquatting, etc.) → +10 bonus
```

**Risk classification**:
| Score Range | Level | Color |
|---|---|---|
| 76–100 | Critical | Red |
| 51–75 | High | Orange |
| 26–50 | Moderate | Yellow |
| 0–25 | Low | Green |

---

## Frontend: Screens & Components

### `HomeScreen.tsx`
The entry point. Contains a single URL text input with real-time validation via `validators.ts`. On submit, calls `analyzeUrl()` and pushes the full serialized `AnalysisReport` to the result route as a JSON query param.

### `ResultScreen.tsx`
Deserializes the `AnalysisReport` from route params. Renders four card components in a `ScrollView`. Passes `confidence` from the score object to `RiskCard`.

### `ThreatInfoScreen.tsx`
The Threat Encyclopedia. Features:
- **Collapsible rows** per threat (Animated.timing expand/collapse)
- **Grouped by category** (Protocol, Structural, Lexical, Brand, Entropy, Redirect, Encoding, Payload)
- **Auto-scroll to focused threat**: uses `ScrollView` ref + `measureLayout` API to compute y-position of the target row relative to the content container and scrolls directly to it (triggered when `focusId` param is passed from ⓘ buttons)
- **Score badge** on every row (`+N` in severity color)

### `RiskCard.tsx`
Displays the primary risk summary:
- Circular score percentage in severity color
- Risk level label (Low / Moderate / High / Critical)
- Confidence level badge (Low / Moderate / High) in a color-coded dot + text row

### `BreakdownItem.tsx`
Renders a single triggered heuristic finding. Includes:
- Severity icon + color-coded title
- Tier badge (CRITICAL / STRONG / MODERATE / WEAK)
- Explanation text
- **ⓘ blue info button** → navigates to ThreatInfoScreen with `focusId` set to this signal's ID, auto-expanding and auto-scrolling to it

### `BrandImpersonationCard.tsx`
Renders the brand impersonation report when `detected = true`. Shows target brand, official domain, and lists each triggered signal with label + explanation + **ⓘ button**.

### `PathAnalysisCard.tsx`
Renders path/query semantic findings when any signal triggered. Each signal row has a severity icon, label, explanation, and **ⓘ button**.

---

## Constants & Configuration

### `src/constants/brands.ts`
A `TRUSTED_DOMAINS` record mapping official root domains to brand names (60+ entries). Used by:
- `brandImpersonation.ts` for all 5 detection types
- `suppressionEngine.ts` for trust validation
- `pathAnalyzer.ts` for redirect target brand matching

Also exports `BRAND_NAMES` — a flat array of root tokens for quick substring checks.

### `src/constants/authKeywords.ts`
17 high-risk keywords: `secure`, `verify`, `login`, `signin`, `update`, `auth`, `account`, `support`, `billing`, `password`, `confirm`, `validation`, `security`, `checkpoint`, `recovery`, `service`, `portal`, `alert`.

### `src/constants/charSubstitutions.ts`
Homoglyph map for character substitution detection:
`0→o`, `1→l`, `3→e`, `@→a`, `$→s`, `5→s`, `7→t`, `!→i`, `|→l`

Used by `deobfuscate()` in brand impersonation detection.

### `src/constants/shorteners.ts`
Known URL shortener domains: `bit.ly`, `tinyurl.com`, `t.co`, `ow.ly`, `goo.gl`, etc.

### `src/constants/suspiciousTlds.ts`
Abuse-heavy TLDs: `.xyz`, `.top`, `.click`, `.gq`, `.ml`, `.tk`, `.icu`, `.cam`, `.monster`, `.buzz`, `.club`

---

## Types & Utilities

### `src/types/engine.ts`
```typescript
type SeverityTier = 'critical' | 'strong' | 'moderate' | 'weak';

interface HeuristicResult {
  id: string;            // Unique signal identifier
  triggered: boolean;    // Whether this signal fired
  baseScore: number;     // Raw risk weight
  severityTier: SeverityTier;
  label: string;         // Human-readable name
  explanation: string;   // What triggered it and why it's suspicious
}
```
Every engine produces `HeuristicResult[]` objects, making the pipeline type-safe and the UI rendering uniform.

### `src/utils/parser.ts`
Wraps the native `URL` API. Splits the hostname into `subdomains[]`, `rootDomain`, and `tld` by progressively popping from the dot-split parts array.

### `src/utils/normalizer.ts`
Prepends `https://` when no protocol is detected, trims whitespace. Ensures the parser always receives a valid protocol-prefixed string.

### `src/utils/validators.ts`
Uses `URL` constructor in a try/catch to validate format. Returns `false` for truly malformed inputs that cannot be parsed at all.

### `src/utils/levenshtein.ts`
Classic dynamic-programming Levenshtein edit distance implementation. Used exclusively by `brandImpersonation.ts` to detect typosquatting at edit distance 1 and 2.

---

## Scoring System

### Design Principle
> **Scores are weighted heuristic suspicion indicators — not probabilities of maliciousness.**

This means a score of 60% does not mean "60% chance this is a phishing site." It means "the URL exhibits indicator patterns that collectively score 60 on our suspicion-weighted scale."

### Two Independent Axes

**Axis 1 — Risk Score (0–100)**
Additive accumulation of triggered signal base scores, modulated by suppression.

**Axis 2 — Confidence (Low/Moderate/High)**
Accumulation of confidence contributions from signal severity tiers. Measures how reliably the engine can produce this assessment — a URL with one strong signal has lower confidence than a URL with five corroborating signals.

### Why Severity Floors for Critical Signals Only?
A 1-character typosquat of Google (`gooogle.com`) has a base score of +40. Without a floor, this lands in "Moderate (26–50)". But a 1-character typosquat is **definitively** an attack — there is no innocent explanation. The floor guarantees it is classified as Critical.

By contrast, a domain with many hyphens (`this-is-a-very-long-domain.com`) scores +20 (Strong tier). Many hyphens are suspicious, but there ARE legitimate uses. So no floor is applied — the score stays at 20 (Low), correctly reflecting structural suspicion without false amplification.

---

## Threat Encyclopedia

Located in `src/data/threatDatabase.ts`. Contains **25+ entries** covering 8 attack categories:

| Category | Threats Covered |
|---|---|
| Protocol Analysis | HTTP, Uncommon Port |
| Structural Analysis | Raw IP, @ Symbol, Subdomain Depth, Domain Length, Hyphens, Suspicious TLD, URL Shortener |
| Lexical Analysis | Excessive Hyphens, Auth Bait Keywords, Fragment Abuse |
| Brand Impersonation | Exact Keyword, Character Substitution, Typosquatting (×2), Subdomain Confusion, Auth+Brand Correlation |
| Entropy Analysis | Machine-Generated Pattern (combined), plus detailed breakdowns |
| Redirect Analysis | Open Redirect Abuse, Encoded Redirect |
| Encoding & Obfuscation | Excessive URL Encoding |
| Payload Indicators | Suspicious File Extension, Deep Path |

Each entry contains:
- **Overview**: What it is in plain English
- **How It Works**: Technical mechanism
- **How Attackers Use It**: Real-world attack context
- **Example**: Concrete URL example
- **Defense Note**: What the user should do

---

## Running the App

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (or Android/iOS emulator)

### Install & Run
```bash
git clone https://github.com/navyaanubhutii/salvatore-url-analyzer
cd salvatore-url-analyzer
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Web Preview
```bash
npx expo start --web
```

---

## Test Cases

| URL | Expected Risk | Primary Trigger |
|---|---|---|
| `https://gooogle.com/account/verify` | 🔴 Critical (76%+) | Typosquatting — 1 char from google.com |
| `https://paypal.com.login-update.xyz` | 🔴 Critical (76%+) | Subdomain Trust Confusion |
| `http://185.220.101.45/login` | 🔴 Critical | Raw IP Address |
| `https://google.com@evil.xyz` | 🔴 Critical | @ Symbol Credential Trap |
| `https://paypa1.xyz/account/verify` | 🔴 Critical | Character Substitution |
| `https://malicious.net/login?next=https://paypal.com` | 🔴 Critical | Open Redirect to Trusted Brand |
| `https://bit.ly/3xK8abc` | 🟡 Moderate | URL Shortener |
| `https://this-is-a-very-long-domain-with-many-hyphens.com` | 🟡 Moderate (~30%) | Structural anomalies only |
| `https://accounts.google.com/signin/v2/challenge` | 🟢 Low | Suppressed — trusted root |
| `https://github.com/login` | 🟢 Low | Suppressed — trusted root |

---

## Architecture Decision Records

### Why No Network Calls?
Speed, privacy, and offline reliability. A network-dependent scanner introduces latency, requires internet access, and sends user URLs to third-party servers. Static heuristic analysis is instant and entirely private.

### Why Not Use an ML Model?
ML models require training data, model files (large binary assets), inference infrastructure, and are opaque. This engine is fully explainable — every risk point is traceable to a specific triggered signal with a specific reason.

### Why Expo / React Native?
Cross-platform (iOS + Android + Web) from a single codebase. Expo SDK manages native modules, OTA updates, and build tooling. TypeScript throughout enables strict typing of the analysis pipeline.

---

*Built with Expo SDK 54 · TypeScript · React Native · Expo Router*
