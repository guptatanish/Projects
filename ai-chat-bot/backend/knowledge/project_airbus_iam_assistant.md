# Airbus IAM AI Assistant UI (iam-ai-assistant-ui / <iam-chatbot>)

An enterprise-grade, embeddable Angular 18 conversational AI interface engineered for internal Airbus Identity & Access Management (IAM) web portals. Packaged as a framework-agnostic Custom Web Element (<iam-chatbot>) via @angular/elements with ShadowDom style isolation, the assistant operates across two synchronized layouts—a floating Compact Widget and a full-screen Desktop Web-App (?mode=webapp)—and connects users to both Guidance Mode (citation-backed Knowledge Base RAG Q&A) and Agentic Mode (automated IAM LIST, GET, CREATE, and UPDATE workflows powered by an MCP router and a Python FastAPI Backend-for-Frontend lookup proxy).

## Table of Contents

Executive Overview & Core Capabilities

System Architecture & End-to-End Data Flow

Complete Feature Specification

Technology Stack & Dependencies

Prerequisites, Installation & Local Setup

Configuration, API Contracts & CI/CD Environments

Usage Guide, Payload Schemas & Developer Testing

Key Engineering Decisions & Production Resolutions

Pre-Production Checklist, Known Limitations & Future Roadmap

## 1. Executive Overview & Core Capabilities

### The Problem Solved

Enterprise IAM ecosystems span multiple specialized platforms (MyAccess, MyAccount, MySSO, IAM API, UMS, IAM Software Factory, IAM Endpoint Protection, and IIVR). End users, administrators, and auditors face two recurring bottlenecks:

Fragmented Procedural Knowledge: Finding exact Knowledge Base (KB) articles for password resets, connector scopes, or access requests requires searching across disparate documentation portals.

Rigid Operational UI Maintenance: Building and maintaining static Angular forms, tables, and charts for dozens of IAM lifecycle workflows (LIST, GET, CREATE, UPDATE) creates brittle frontend schemas and exposes browser clients to CORS and token-handling risks if internal <internal-iam-api-gateway> endpoints are called directly.

### How IAM AI Assistant Solves It

Drop-In Portal Portability: Compiles into a single self-contained Custom Element script (<iam-chatbot>) hosted on Red Hat OpenShift Nginx, allowing any internal host application to mount the assistant without CSS bleed or router conflicts.

Dual Conversational Routes:

Guidance Mode (RAG Agent): Delivers formatted procedural guidance, strips internal LLM reasoning tags, and converts KB footers into clickable citation badges.

Agentic Mode (MCP Agent): Interprets declarative backend directives (ui_render_directive and ui_interaction_mode) at runtime to dynamically render 5-format Apache ECharts visualizations, nested-object paginated data tables, List-of-Values (LOV) selectors, and progressive multi-step Airbus Design System forms.

BFF-Secured Lookups & Enterprise RBAC: Enforces OAuth2/JWT Role-Based Access Control (AI-ENDUSER, AI-ADMIN, AI-AUDITOR) before dispatching queries and proxies dynamic form lookups through an authenticated Python FastAPI Backend-for-Frontend (GET /api/lookup) microservice.

## 2. System Architecture & End-to-End Data Flow

### 2.1 High-Level Component & Network Topology

```
+-----------------------------------------------------------------------------------+

| Host Airbus Web Portal (<iam-chatbot>)                                            |

|   └── src/main.ts (provideHttpClient + provideEchartsCore({ echarts }))           |

|         └── ChatbotComponent (ShadowDom Host, JWT/Email Identity, Tab Handoff)    |

|               ├── PopoutComponent (?mode=webapp Full-Screen Workspace)            |

|               ├── SidebarComponent (Collapsible Nav, Sub-Session History List)    |

|               ├── DiscoverComponent (2-Column Guided Capability Cards)            |

|               ├── HistoryComponent (Widget Archived Session Viewer)               |

|               ├── ChatbotService (Adapter Parser, RBAC Cache, AbortController,    |

|               │                   BroadcastChannel & 10s Silent History Poller)   |

|               └── ChatScreenComponent (Dual Widget/WebApp UI, 5-Min Timeout,      |

|                     │                  AI Disclaimer, Session Stamp Guards)       |

|                     ├── DataVizComponent (ui_render_directive -> 5 ECharts/Table) |

|                     ├── MultiselectComponent (Single & Multi-Select LOV Pills)    |

|                     └── FormsComponent (Progressive Schema Form + BFF Client)     |

+-----------------------------------------|-------------------------|---------------+

                                          |                         |

       POST Chat / History / Feedback     |                         | GET /api/lookup?url=...&scope=...

       GET IAM Roles (Bearer JWT)         |                         | Header: Authorization: Bearer <id_token>

                                          v                         v

+-----------------------------------------------+   +-----------------------------------------------+

| AI / MCP Backend Router (RAG & MCP Agents)    |   | Python FastAPI BFF Proxy (Port 8080 / OCP)    |

|  - Guidance RAG + KB Citations                |   |  - Validates query params & Bearer token      |

|  - Agentic LIST / GET / CREATE / UPDATE       |   |  - Server-to-server OAuth2 scope execution    |

+-----------------------------------------------+   +-----------------------|-----------------------+

                                                                            | HTTPS (Internal Corp Net)

                                                                            v

                                                    +-----------------------------------------------+

                                                    | Airbus IAM API Gateway                        |

                                                    | (<internal-iam-api-gateway>) |

                                                    +-----------------------------------------------+

```
### 2.2 Runtime Pipeline: Agentic LIST Visualization Flow

Role Verification & Dispatch: ChatScreenComponent.sendMessage() validates user scopes via ChatbotService.fetchUserRoles() (shareReplay(1)) and sends { query, roles, thread_id } to ApiConfig.ChatUrl.

Centralized Normalization: ChatbotService.normalizeBackendResponse() standardizes response keys, runs parseMessageData() to convert Markdown to Airbus-styled HTML, extracts --- Sources --- chips, and attaches rawJsonOutput.

Directive Rendering: When msg.isChart || msg.rawJsonOutput evaluates to true, <app-data-viz [apiResponse]="msg.rawJsonOutput"> reads ui_render_directive (default_visualization, allowed_charts, table_columns, x_axis_key, y_axis_key, colors, next_suggestions), extracts nested cell paths via getCellValue(), aggregates counts/sums, and renders interactive ECharts canvases or paginated tables/cards.

### 2.3 Runtime Pipeline: Agentic CREATE / UPDATE Dynamic Form Flow

Blueprint Ingestion: FormsComponent loads the workflow JSON schema (ui_interaction_mode.input_parameters and body_mapping), sorts parameters strictly by order, sanitizes missing keys, and constructs a reactive FormGroup where only Step 1 (order: 1) is enabled.

Progressive Unlocking & Lazy BFF Lookups: Listening to myForm.valueChanges, updateDynamicFormSequence() unlocks Step i + 1 only when Step i becomes valid (and cascadingly clears/re-locks downstream fields if an upstream input becomes invalid).

Authenticated Proxy Fetch: The exact moment an apilookup step unlocks, triggerBFFLookup() reads id_token from localStorage and calls FastAPI GET /api/lookup with url and scope query parameters, formatting returned records via display_keys ("{{code}} - {{name}}") while retaining full raw objects in component RAM.

### 2.4 Unified Repository Directory Structure

```
iam-ai-assistant-ui/

├── Jenkinsfile                                           # Declarative OpenShift CI/CD pipeline (<openshift-namespaces>)

├── build-elements.js                                     # Concatenates Angular build output into single Web Element script

├── angular.json                                          # Angular CLI build & asset configuration

├── package.json                                          # Dependencies & npm build/start scripts

├── tsconfig.json                                         # Strict TypeScript + resolveJsonModule & esModuleInterop

├── demo/                                                 # Host portal integration test harness

├── docs/                                                 # Architectural & API documentation

└── src/

    ├── main.ts                                           # <iam-chatbot> registration & provideEchartsCore({ echarts })

    ├── environments/

    │   ├── environment.dev.ts                            # Local dev config (assetBaseUrl: 'http://localhost:4200')

    │   └── environment.prod.ts                           # Production OpenShift static route config

    ├── assets/

    │   └── images/                                       # Toolbar icons, avatars, thumbs SVGs & smiley rating PNGs

    │       ├── chart-bar-active.png / chart-bar-inactive.png

    │       ├── chart-line-active.png / chart-line-inactive.png

    │       ├── chart-donut-active.png / chart-donut-inactive.png

    │       ├── chart-pie-active.png / chart-pie-inactive.png

    │       ├── chart-table-active.png / chart-table-inactive.png

    │       ├── chart-download.png

    │       └── rate-1..5 (active/inactive PNGs)

    └── app/

        └── chatbot/

            ├── chatbot.component.ts                      # Root ShadowDom shell, identity resolver, 1s token watcher

            ├── chatbot.component.html

            ├── chatbot.component.css

            ├── chatbot.service.ts                        # HTTP client, RBAC, Adapter parser, AbortController, sync/polling

            ├── enums/

            │   ├── api.enums.ts                          # ApiConfig (ChatUrl, HISTORY_URL, Feedback_url, IAM_role_url)

            │   └── chatbot.enums.ts                      # ChatScreen enum (Home, Chat, History, Discover)

            ├── models/

            │   ├── chat.model.ts                         # Strict Message interface ('user' | 'bot' union typing)

            │   └── history.model.ts                      # HistoryAPIResponse, UiSessionItem, HistorySession, HistoryMessage

            ├── popout/

            │   ├── popout.component.ts                   # Full-screen Web-App container (?mode=webapp) & stamp guards

            │   ├── popout.component.html

            │   └── popout.component.css

            ├── sidebar/

            │   └── sidebar.component.ts                  # Collapsible Web-App sidebar & HTML-stripped Recent Interactions

            └── features/

                ├── chat-screen/

                │   ├── chat-screen.component.ts          # Message engine, mock interceptors, 5-min timeout, stamp guards

                │   ├── chat-screen.component.html        # Dual Widget/WebApp templates, AI disclaimer, inline #chatBody rating

                │   ├── chat-screen.component.css         # Widget bubble, downward tooltip, toast & input bar styling

                │   └── chat-screen.webapp.css            # Responsive desktop breakpoints (standard, 1400px+, 2000px+ 4K)

                ├── data-viz/

                │   ├── AccountList_LifecycleStatus.json  # Offline IAM dataset fallback (630+ sample account records)

                │   ├── data-viz.component.ts             # ui_render_directive engine, ECharts builder, 5-page pagination, export

                │   ├── data-viz.component.html           # Widget 3-dot switcher/cards vs. WebApp icon bar/scrollable table

                │   ├── data-viz.component.css            # Mode-aware canvas heights (200px vs 300px) & .page-dots styles

                │   └── data-viz.component.spec.ts

                ├── forms/

                │   ├── create_connector_json.json        # Master 5-step Create Connector metadata blueprint

                │   ├── update_connector_json.json        # Update Connector metadata blueprint

                │   ├── forms.component.ts                # Dynamic FormGroup builder, progressive unlocker & BFF lookup client

                │   ├── forms.component.html              # *ngFor + [ngSwitch] Airbus DS controls (<ds-combobox/select/input>)

                │   ├── forms.component.css               # Progressive step transitions & .step-disabled styling

                │   └── forms.component.spec.ts

                ├── multiselect/

                │   └── multiselect.component.ts          # Single-select & multi-select interactive LOV pill component

                ├── history/

                │   └── history.component.ts              # Compact Widget conversation history browser

                └── discover/

                    └── discover.component.ts             # Guided help prompts & 2-column CSS Grid discovery view

```

## 3. Complete Feature Specification

### 3.1 Micro-Frontend Packaging & Dual-Mode Responsive UX

Shadow DOM Custom Element (<iam-chatbot>): Wraps ChatbotComponent with ViewEncapsulation.ShadowDom so host application stylesheets cannot override internal Airbus Design System components or layouts.

Compact Widget Mode (Default): Floating launcher and condensed chat window featuring 200px chart canvases, a space-saving 3-dot (ds-icon-more_vert) Open in chart switcher, mobile-friendly expandable accordion cards for table rows (Load More +3 rows per click), and compact action controls.

Full-Screen Web-App Mode (?mode=webapp): Dedicated desktop workspace (PopoutComponent, scaled cleanly up to 1400px+ and 2000px+ 4K monitors) featuring a collapsible SidebarComponent (Home, Messages, Recent Interactions, Discover), a 5-button segmented Airbus icon bar with active/inactive state assets, 300px chart canvases with Y-axis titles, and horizontally scrollable data tables.

Seamless Multi-Tab Synchronization:

Clicking Open in New Window serializes live session state into localStorage (chat_live_state), flags chatPopoutActive = 'true', closes the embedded widget, and launches/focuses a named browser tab (ChatbotWebAppTab).

Real-time state updates propagate across open tabs via @HostListener('window:storage') (syncing iam_dataviz_view chart preferences) and BroadcastChannel('iam-chat-sync') (REFRESH_NOW history broadcasts).

### 3.2 Conversational UX, Rich Markdown, Citations & AI Compliance

Defensive Schema Adapter & Markdown Engine (ChatbotService):

Normalizes varied backend response envelopes, strips internal LLM reasoning tags (<thinking>...</thinking>, 🤖 Agent:), and deduplicates inline "refer to KB article..." boilerplate.

Renders #, ##, and ### headings, **bold** emphasis, inline code badges, > blockquotes, --- horizontal rules, clickable URLs, ordered lists (1.), and unordered lists (-, *, •) without double-wrapping block-level HTML elements.

Extracts --- Sources --- footers, safely unwrapping HTML <a href="..."> tags via regex when present, and displays clickable KB reference badges.

Enterprise AI Compliance Disclaimer: Renders "AI-generated response. Please review carefully." strictly on bot messages (@if (msg.type === 'bot')) directly above the timestamp and feedback bar in both Widget and Web-App modes.

Rich Message & Input Controls:

HTML-Stripped Clipboard Copy: Copies clean plain text to the clipboard while displaying an Airbus green checkmark (ds-icon-check) and "Copied!" toast confirmation for 2 seconds.

One-Click Prompt Regeneration (reloadMessage): Finds the user's most recent query and resubmits it automatically.

Quick Starters & Input Enhancements: Supports programmatic prompt auto-submission (@Input() autoMsg), Suggested Topic chips (Context, Solution, Group, Account, Scope), emoji picker, file attachment tagging, and read receipts.

Inline End-of-Task Rating & Sub-Session Chunking:

Detects task_completion flags to render an inline 5-level interactive smiley rating bar inside the scrollable #chatBody container (ApiConfig.Feedback_url) and inserts a "Conversation closed / New chat with IAM Assistant" divider when a new follow-up begins.

Splits multi-task backend logs into discrete sidebar history entries (${session_id}-sub${chunkIndex}) with HTML-stripped 40-character titles.

### 3.3 Directive-Driven 5-Format Data Visualization (DataVizComponent)

Zero-Hardcoding ui_render_directive Engine: Dynamically builds Bar Chart, Line Chart (smooth area curve), Donut Chart, Pie Chart, and HTML Data Table views from backend metadata (render_type, default_visualization, allowed_charts, table_columns, x_axis_key, y_axis_key, title, colors, next_suggestions).

Deep Object Path Resolution & Aggregation: Extracts nested properties (solution.name, solution.code, directory.domain) via dot-notation reduction (getCellValue), normalizes camelCase/snake_case axis keys (lifecycleStatus → lifecycle_status), aggregates COUNT or numeric totals, and maps status hex colors (ENABLED, DISABLED, EXPIRED) alongside the Airbus corporate palette (#063B9E, #00B0F0, #1a8f59, #F0A300, #D9381E).

Smart Bounded 5-Number Pagination: Caps visible page buttons at 5 numbers plus non-clickable ... dividers (1 2 3 4 ... 20, 1 ... 4 5 6 ... 20, 1 ... 17 18 19 20) with configurable page sizes (5, 10, 20, 50), preventing wide tables from stretching chat bubbles.

Context-Aware High-DPI Export: Downloads 2x pixel-ratio white-background .png chart snapshots via echartsInstance.getDataURL() when viewing graphical charts, or UTF-8 .csv files when viewing the Data Table.

### 3.4 Metadata-Driven Progressive Form Engine (FormsComponent & MultiselectComponent)

Declarative Control Generation: Maps ui_interaction_mode.input_parameters to official @airbus/components-angular primitives (<ds-combobox>, <ds-select>, <ds-input>) sorted by order, attaching Validators.required and Validators.maxLength(n) from JSON "data validations" rules.

Strict Chronological Step Unlocking: Enables only Step 1 on initialization; Step k + 1 unlocks only after Step k passes validation, automatically resetting and disabling all subsequent steps (k + 1 ... N) if an earlier step is cleared or invalidated.

Lazy FastAPI BFF Lookups & Object Retention: Defers GET /api/lookup HTTP calls until an apilookup step unlocks, composes human-readable labels from details.display_keys, retains complete raw API objects in [value] for downstream reference_keys extraction, and caches options in component RAM (dropdownOptions).

Interactive LOV Selector (MultiselectComponent): Handles standalone single-select and multi-select List-of-Values prompts directly inside the chat stream (handleMultiSelectSubmit).

### 3.5 Enterprise Security, Identity, RBAC & Resilience

Zero-Roundtrip Identity & 1-Second Token Watcher: Extracts formatted user display names (Firstname Lastname) from localStorage profiles, JWT id_token claims, or corporate emails (user@enterprise-corp.com), while polling access_token every 1,000 ms to purge local caches immediately if a different user logs in.

Cached Role-Based Access Control (RBAC): Verifies user membership in AI-ENDUSER, AI-ADMIN, or AI-AUDITOR via ApiConfig.IAM_role_url (shareReplay(1)) prior to chat execution.

5-Minute Inactivity Timeout: Transitions idle active threads (300,000 ms) into read-only timeout state ("Session has timed out.") and clears backend currentThreadId memory while accurately preserving "Viewing past conversation." labels on historical sessions.

3-Layer Async "Ghost Reply" Protection: Eliminates cross-session message bleed when switching chats mid-stream via physical AbortController cancellation, silent AbortError suppression, chatSessionMark execution stamps across await boundaries, and 10-second background history polling.

## 4. Technology Stack & Dependencies

| Layer | Technology / Package | Version / Target | Purpose |
| --- | --- | --- | --- |
| Core Framework | @angular/core, @angular/common, @angular/platform-browser | Angular 18.x | Standalone component architecture, control flow (@if, @for, [ngSwitch]) & DI |
| Web Element Packaging | @angular/elements | Angular 18.x | Wraps ChatbotComponent into portable <iam-chatbot> Custom Element |
| Reactive Forms | @angular/forms (ReactiveFormsModule, FormsModule) | Angular 18.x | Dynamic FormGroup/FormControl generation, validators & valueChanges streams |
| Design System | @airbus/components-angular + ds-icon | Airbus Internal | Official enterprise UI (Badge, Tooltip, Avatar, Button, Popover, Form, Input, Select, ComboBox, Checkbox, Textarea, Inline, Stack) |
| Data Visualization | echarts + ngx-echarts | 5.x / ^18.0.0 | Zero-CDK canvas charting & provideEchartsCore eager single-bundle injection |
| Reactive & HTTP | rxjs + @angular/common/http | ~7.8.x / 18.x | Async streams, shareReplay(1), firstValueFrom, Fetch AbortSignal, HttpParams |
| BFF Lookup Proxy | Python + FastAPI + Uvicorn | Python 3.9+ | Server-side /api/lookup proxy handling internal Airbus IAM OAuth2 scopes & CORS |
| Build Runtime | Node.js + npm + TypeScript | Node 20.x / TS 5.4+ | Required engine for Angular 18 CLI, strict typing & high-memory production bundling |
| Hosting & Runtime | Red Hat OpenShift + Nginx | OCP 4 (<openshift-namespace>) | iam-ai-assistant-nodejs builder & iam-ai-assistant-nginx static bundle serving |
| CI/CD Pipeline | Jenkins (CloudBees Kubernetes Agent) | Declarative Pipeline | Automated OpenShift builds, rollouts, manual prod promotion gate & email alerts |

## 5. Prerequisites, Installation & Local Setup

### 5.1 System Prerequisites

Node.js 20.x LTS (nvs or nvm recommended; Node 18.16.x triggers EBADENGINE warnings with Angular 18 devkits) and **npm 10.x**.

Airbus Internal Artifactory Access: ~/.npmrc authenticated to pull @airbus/components-angular and ds-icon assets.

Python 3.9+ with fastapi and uvicorn: Required locally only when testing live BFF API lookups on port 8080 (offline fallback dummy data works automatically if Python/BFF is not running).

OpenShift CLI (oc): Optional, for inspecting pod rollouts across <openshift-namespace> namespaces.

### 5.2 Step-by-Step Local Development & Production Build

Clone the repository and activate Node 20:

```
git clone <repository-url>/iam-ai-assistant-ui.git

cd iam-ai-assistant-ui

nvs use 20

# Or: nvm use 20

node -v   # Confirm v20.x.x

```

Install frontend dependencies:

```
npm ci

# Or on a fresh setup/branch:

npm install

npm install echarts ngx-echarts@18

```

Verify tsconfig.json compiler flags (required for importing AccountList_LifecycleStatus.json, create_connector_json.json, and update_connector_json.json without TS2307 errors):

```
{

  "compilerOptions": {

    "strict": true,

    "resolveJsonModule": true,

    "esModuleInterop": true

  }

}

```

Important: Always stop (Ctrl + C) and restart ng serve after editing tsconfig.json; Angular's incremental file watcher does not hot-reload root TypeScript config changes.

(Optional) Start the FastAPI BFF Lookup Microservice on Port 8080:

```
uvicorn main:app --host 0.0.0.0 --port 8080 --reload

```

Start the Angular Development Server:

```
ng serve

# Or: npm start

```

Compact Widget Mode: http://localhost:4200/

Full-Screen Web-App Mode: http://localhost:4200/?mode=webapp

Compile Production Bundle & Custom Web Element:

```
node --max_old_space_size=4000 node_modules/@angular/cli/bin/ng build --configuration production

node build-elements.js

```
### 5.3 Required Static Image Assets (src/assets/images/)

Verify the following image assets exist in src/assets/images/ so mode-aware toolbars and rating bars render properly across external host domains:

Chart Toolbar Active Icons (white on transparent): chart-bar-active.png, chart-line-active.png, chart-donut-active.png, chart-pie-active.png, chart-table-active.png

Chart Toolbar Inactive Icons (#063B9E dark blue on transparent): chart-bar-inactive.png, chart-line-inactive.png, chart-donut-inactive.png, chart-pie-inactive.png, chart-table-inactive.png

Export & Feedback Assets: chart-download.png, thumbs-up/thumbs-down SVGs, and rate-1 through rate-5 active/inactive smiley PNGs.

## 6. Configuration, API Contracts & CI/CD Environments

### 6.1 Environment Files (src/environments/)

Configure assetBaseUrl so images, avatars, and toolbar icons resolve cleanly when <iam-chatbot> is mounted on third-party corporate domains:

```
// src/environments/environment.dev.ts

export const environment = {

  production: false,

  assetBaseUrl: 'http://localhost:4200' // Set to OpenShift Nginx route URL in environment.prod.ts

};

```
### 6.2 Component Inputs & Outputs Reference

| Component | Decorator & Property | Type / Default | Purpose |
| --- | --- | --- | --- |
| ChatbotComponent | @Input() userEmail / user-id | string | Corporate email (user@enterprise-corp.com) or fallback guest identifier parsed into display name |
| ChatbotComponent → DataViz | @Input() assetBase | string ('') | Base URL prepended to /assets/images/... across Widget and Web-App templates |
| ChatScreen / DataViz | @Input() isWebApp | boolean (false) | Toggles compact Widget layout (false) vs. expanded desktop Web-App layout (true) |
| ChatScreenComponent | @Input() autoMsg | string | Setter input that populates userInput and triggers sendMessage() after 100ms |
| ChatScreenComponent | @Input() isReadOnly | boolean (false) | Locks chat input when viewing archived history or timed-out threads |
| DataVizComponent | @Input() apiResponse | any | Receives msg.rawJsonOutput (data + ui_render_directive); falls back to local JSON when undefined |
| FormsComponent | @Output() formSubmitted | EventEmitter<any> | Emits validated reactive form payload up to the parent chat container upon submission |

### 6.3 Backend & BFF API Endpoints (src/app/chatbot/enums/api.enums.ts)

| Endpoint Constant / Route | Method | Auth Header | Purpose |
| --- | --- | --- | --- |
| ApiConfig.ChatUrl | POST | Bearer <id_token> | Conversational RAG & Agentic MCP execution ({ query, roles, thread_id }) |
| ApiConfig.HISTORY_URL | POST | Bearer <id_token> | Fetches user conversation sessions for sidebar & history views |
| ApiConfig.Feedback_url | POST | Bearer <id_token> | Persists per-message thumbs (boolean) & end-of-chat 1–5 smiley ratings (number) |
| ApiConfig.IAM_role_url | GET | Bearer <access_token> | Resolves user RBAC scopes (AI-ENDUSER, AI-ADMIN, AI-AUDITOR) |
| BFF_MICROSERVICE_URL (/api/lookup) | GET | Bearer <id_token> | FastAPI BFF lookup proxy accepting HttpParams url, scope, and optional search |

### 6.4 Browser localStorage & Cross-Tab Channels

| Storage / Channel Key | Mechanism | Purpose |
| --- | --- | --- |
| id_token | localStorage | OIDC Bearer JWT sent to Chat, History, Feedback, and FastAPI /api/lookup endpoints |

| | access_token | localStorage | OAuth2 Bearer token sent to IAM_role_url; polled every 1s to detect user account switches | | user | localStorage | Optional host JSON profile ({ first_name }) used for personalized greetings | | iam_chatbot_history | localStorage | User-scoped active message cache ({ userId, messages }); auto-purged on user mismatch | | chat_live_state | localStorage | Cross-tab handoff payload (activeScreen, messages, isReadOnlyMode, openMessagesMenu) | | chatPopoutActive | localStorage | Boolean flag ('true') preventing duplicate popouts and focusing ChatbotWebAppTab | | iam_dataviz_view | localStorage + StorageEvent | Live-synchronizes active chart view (Pie, Donut, Line, Bar, Table) across tabs | | iam-chat-sync | BroadcastChannel | Broadcasts REFRESH_NOW events across tabs to keep Recent Interactions lists in sync |

### 6.5 Red Hat OpenShift CI/CD Mapping (Jenkinsfile)

The UI is built and served inside the internal Airbus network on Red Hat OpenShift ([<internal-openshift-cluster>](<internal-openshift-cluster>)) under ASPIRE application code <app-code>:

| Git Branch | OpenShift Namespace | OpenShift BuildConfigs & Deployments | Rollout Gate |
| --- | --- | --- | --- |
| dev | <openshift-namespace> | iam-ai-assistant-nodejs, iam-ai-assistant-nginx | Automatic on push |
| val | <openshift-namespace> | iam-ai-assistant-nodejs, iam-ai-assistant-nginx | Automatic on push |
| preprod | <openshift-namespace> | iam-ai-assistant-nodejs, iam-ai-assistant-nginx | Automatic on push |
| prod | <openshift-namespace> | iam-ai-assistant-nodejs, iam-ai-assistant-nginx | Manual Promote input (20-min timeout + email notifications) |

## 7. Usage Guide, Payload Schemas & Developer Testing

### 7.1 Embedding <iam-chatbot> & Eager ECharts Bootstrap

Include the single compiled bundle hosted by iam-ai-assistant-nginx on any host portal HTML page:

```
<script src="https://<openshift-nginx-route>/iam-chatbot.js" defer></script>

<iam-chatbot user-id="Guest"></iam-chatbot>

```

Inside src/main.ts, provideEchartsCore({ echarts }) compiles ECharts directly into the Custom Element bundle so host portals never suffer broken lazy-chunk URLs:

```
import { createApplication } from '@angular/platform-browser';

import { createCustomElement } from '@angular/elements';

import { provideHttpClient } from '@angular/common/http';

import * as echarts from 'echarts';

import { provideEchartsCore } from 'ngx-echarts';

import { ChatbotComponent } from './app/chatbot/chatbot.component';

(async () => {

  const app = await createApplication({

    providers: [

      provideHttpClient(),

      provideEchartsCore({ echarts })

    ]

  });

  const chatbotElement = createCustomElement(ChatbotComponent, {

    injector: app.injector

  });

  customElements.define('iam-chatbot', chatbotElement);

})();

```
### 7.2 Built-In Developer Mock Commands & Offline Testing

Developers can verify every interactive UI module on http://localhost:4200 without an active backend or VPN connection:

| Chat Input Keyword | Offline UI Behavior |
| --- | --- |
| data or data-viz | Skips HTTP call, simulates typing indicator, and mounts <app-data-viz> using the local AccountList_LifecycleStatus.json dataset |
| form | Mounts <app-forms> using create_connector_json.json; if FastAPI on port 8080 is offline (ERR_CONNECTION_REFUSED), populates fallback dummy options (TEST01 - Dummy Data 1) |

| | lov | Mounts <app-multiselect> in multi-select mode (isMultiSelect: true) | | lov2 | Mounts <app-multiselect> in single-select mode (isMultiSelect: true, isSingleSelect: true) | | end | Simulates taskCompletion: true (msgId: 'test-msg-123') and renders the inline 5-smiley rating bar inside #chatBody |

Injecting a JWT Token for Live Local BFF Testing:

```
// Run in Chrome DevTools Console (F12) before unlocking an apilookup step:

localStorage.setItem('id_token', '<YOUR_VALID_JWT_ID_TOKEN>');

```

Offline Backend Parser Test Harness: To validate new RAG/MCP payload structures offline, call ChatbotService.normalizeBackendResponse(samplePayload) inside initialization and inspect the normalized { text, sources, rawJsonOutput, taskCompletion } object in DevTools Console.

### 7.3 Agentic LIST Payload Contract (raw_json_output)

```
{

  "agent_log": ["[ROUTER]: Routing to mcp_agent", "[OUTPUT_TRANSLATOR]: 81 Accounts found"],

  "ai_message_content": "81 Accounts found",

  "thread_id": "e849222e-e2be-4d17-aada-3614366d8d28",

  "ai_message_id": "0a650386-6eb5-48c6-9d9e-6aca8446c16b",

  "task_completion": true,

  "application": "MyAccount",

  "raw_json_output": {

    "data": [

      {

        "id": 100001,

        "name": "<sample-account-name>",

        "lifecycle_status": "disabled",

        "directory": { "domain": "EU-V", "project_phase": "VAL", "type": "AD" },

        "solution": { "id": 200001, "code": "<sample-solution-code>", "name": "IAM AI Testing" }

      }

    ],

    "ui_render_directive": {

      "render_type": "CHART",

      "default_visualization": "TABLE",

      "allowed_charts": ["DONUT", "PIE", "BAR", "LINE", "TABLE"],

      "table_columns": ["name", "solution.code", "lifecycle_status", "directory.domain"],

      "x_axis_key": "lifecycle_status",

      "y_axis_key": "COUNT",

      "title": "Accounts List by Lifecycle Status",

      "colors": { "ENABLED": "#36A2EB", "DISABLED": "#C9CBCF", "EXPIRED": "#FF6384" },

      "next_suggestions": [

        "Do you want to Reset Password of any Specific Account to make it Compliant?",

        "Do you want me to help disabling an Account which is not used?",

        "Do you want to Create a new account?"

      ]

    }

  }

}

```
### 7.4 Dynamic Form Engine Mapping & FastAPI BFF Contract

Metadata-to-Component Mapping Matrix (FormsComponent):

| JSON input_type | JSON data_type | Airbus DS Component | Runtime Behavior |
| --- | --- | --- | --- |
| "apilookup" | "Dropdown" or "List" | <ds-combobox> + <ds-combobox-item> | Single-select searchable combobox lazily populated via BFF GET /api/lookup |
| "enum" | "Dropdown" | <ds-select> + <option> | Single-select static dropdown populated immediately from field.data |
| "text" | "Object" | <ds-input type="text"> | Free-text input bound to Validators.required and Validators.maxLength |

5-Step "Create Connector" Execution Sequence (create_connector_json.json):

Step 1 — Solution (order: 1, apilookup / Dropdown): Fires GET /api/lookup on load with scope <oauth-scope-solution-read>; formats labels as "{{code}} - {{name}}".

Step 2 — Business Environment (order: 2, enum / Dropdown): Unlocks after Step 1; static options (PRODUCTION, PRE-PREPRODUCTION, TRAINING, INTEGRATION, VALIDATION, DEVELOPMENT).

Step 3 — Connector Lable (order: 3, text / Object): Unlocks after Step 2; enforces Validators.maxLength(10).

Step 4 — Scopes (order: 4, apilookup / List): Unlocks after Step 3; lazily calls GET /api/lookup with scope <oauth-scope-oauth2-read>, displaying scope id.

Step 5 — Redirect URI's (order: 5, text / Object): Unlocks after Step 4 (key sanitized from "" to redirect_uri_s); enforces Validators.maxLength(10).

FastAPI BFF Endpoint Signature (GET /api/lookup):

```
@app.get("/api/lookup")

async def universal_lookup(

    url: str = Query(..., description="Target URL from UI JSON"),

    scope: str = Query(..., description="Scope from UI JSON"),

    search: Optional[str] = Query(None),

    authorization: str = Header(None)

):

```
### 7.5 OpenShift Verification Commands

```
oc login <internal-openshift-cluster> --token=<YOUR_OCP_TOKEN>

oc project <openshift-namespace>

oc get pods | grep nginx

oc rollout status deployments/iam-ai-assistant-nginx -n <openshift-namespace>

```

## 8. Key Engineering Decisions & Production Resolutions

### 8.1 Eager ECharts Injection vs. Lazy Chunk Loading

Standard provideEcharts() dynamically lazy-loads ECharts chunks at runtime. When packaged into a single Web Element bundle via build-elements.js and mounted on external host portals, relative chunk paths fail to resolve—causing <app-data-viz> to silently render blank while text bubbles still appear. Bootstrapping src/main.ts with provideEchartsCore({ echarts }) compiles ECharts eagerly into the single bundle.

### 8.2 Node 20 + ngx-echarts@18 Over ng2-charts

Adopting ng2-charts triggered transitive NPM ERESOLVE peer conflicts (pulling @angular/cdk@21 into an Angular 18 workspace) alongside EBADENGINE warnings on Node v18.16.0. Standardizing on Node 20 and **echarts + ngx-echarts@18** eliminated CDK peer dependencies and stabilized Jenkins builds.

### 8.3 Watertight 3-Layer Defense Against Async "Ghost Subscriptions"

When a user clicks Start New Chat or loads a Past Conversation while an LLM response is mid-flight, standard RxJS .unsubscribe() cleanup fails because sendMessage() yields to the JavaScript event loop at await firstValueFrom(this.chatbotService.fetchUserRoles()) before ChatbotService.chat() creates an inner HTTP subscription. This race condition was closed using three coordinated layers:

Physical Network Termination: ChatbotService.clearMemory() calls this.chatAbortController.abort() (bound via HttpClient fetchOptions.signal) on every new-chat reset and history load (handleConversationLoad() / onLoadSession()).

Silent Abort Filtering: Error handlers ignore err.status === 0, AbortError, and 'abort' messages so intentional cancellations never push "Error connecting to server." bubbles into the newly opened chat.

Execution Invalidation Stamps (chatSessionMark): Every sendMessage() stamps const currentStamp = Date.now(); this.chatSessionMark = currentStamp; prior to the first await and asserts if (this.chatSessionMark !== currentStamp) return; after every await, inside subscribe (next and error), and inside setTimeout. Simultaneously, a 10-second setInterval background poller refreshes history so backend-persisted replies from aborted threads still surface in Recent Interactions.

### 8.4 Safe Nested Dot-Path Extraction & Strict 5-Number Pagination

Backend table_columns directives reference nested paths ("solution.code", "directory.domain") that return undefined with flat bracket notation (row[col]), while unbounded page arrays stretched chat bubbles horizontally and caused TS2345 errors when mixing numbers with '...'. Both were resolved cleanly in DataVizComponent:

```
getCellValue(obj: any, path: string): any {

  if (!obj || !path) return '';

  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';

}

get pagesArray(): (number | string)[] {

  const total = this.totalPages;

  const current = this.currentPage;

  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 3) return [1, 2, 3, 4, '...', total];

  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];

  return [1, '...', current - 1, current, current + 1, '...', total];

}

```
### 8.5 Loop-Safe Progressive Forms, Schema Sanitization & RAM Caching

Preventing Call-Stack Loops ({ emitEvent: false }): Mutating controls (.enable(), .disable(), .setValue('')) inside a myForm.valueChanges subscriber triggers recursive emissions and Maximum call stack size exceeded crashes unless { emitEvent: false } is passed on every programmatic state change.

Defensive Metadata Sanitization & Strict Compiler Fixes: Real backend blueprints shipped Order 5 ("Redirect URI's") with "key": "" and "regex": "*" (an invalid JS RegExp quantifier). FormsComponent synthesizes safe fallback keys (field.label.toLowerCase().replace(/[^a-z0-9]/g, '_')), skips bare "*" regex patterns, resolves Angular strict boolean NG2 errors via || false, and avoids NG5002 pipe-precedence parser errors using standard attribute interpolation (placeholder="Search {{ field.label | lowercase }}...").

RAM Caching Over localStorage: Because IAM endpoints can return 5,000–10,000+ records, caching lookup responses in localStorage triggers QuotaExceededError (~5 MB limit), blocks the main thread during JSON.parse(), and retains stale IAM permissions. Keeping active options in component memory (dropdownOptions) ensures fast access and automatic garbage collection.

### 8.6 Component Reuse Lifecycle (ngOnChanges), Serialization-Safe @for & Inline Rating UX

Resetting Stale Timeout Flags (ngOnChanges): Angular reuses ChatScreenComponent instances when switching between active and historical chats without re-running ngOnInit(). Resetting this.isSessionTimedOut = false and updating chatSessionMark inside ngOnChanges() prevents historical threads from falsely displaying "Session has timed out." instead of "Viewing past conversation."

Serialization-Safe @for Loops: Rehydrating messages across Widget and Web-App tabs via JSON.parse() breaks object identity references; tracking @for (msg of messages; track $index) ensures embedded charts and controls re-render reliably.

Scrollable Rating Container: Placing .global-rating-container inside #chatBody rather than floating it above the input bar prevents the 5-smiley rating card from clipping ECharts canvases.

## 9. Pre-Production Checklist, Known Limitations & Future Roadmap

### 9.1 Pre-Production Security & Hardening Checklist

Remove Static Dev Token in fetchUserRoles(): Ensure the temporary validation JWT string used during local testing inside ChatbotService.fetchUserRoles() is removed and const access_token = localStorage.getItem('access_token'); is active prior to production builds.

HTML Sanitization Pass (DOMPurify / DomSanitizer): ChatbotService.parseMessageData() transforms Markdown into HTML bound via [innerHTML]. Adding an explicit allowlist sanitization pass will harden protection against malformed upstream HTML in RAG KB articles.

Zero-URL BFF Scope Mapping: Refactor the FastAPI /api/lookup proxy to map logical scope identifiers to internal <internal-iam-api-gateway> URLs server-side so raw internal gateway URLs no longer travel in browser query parameters.

### 9.2 Dynamic Form Engine Roadmap (Phases 4 & 5 + Scale Optimizations)

Phase 4 — reference_keys Background Extraction: Attach combobox selection listeners so selecting a lookup object (e.g., Solution) automatically extracts secondary fields defined in details.reference_keys (solution_code, solution_name, solution_owner_email) into a background dictionary.

Phase 5 — body_mapping Template Compiler: Implement recursive placeholder interpolation inside onSubmit() to compile {{variable}} tokens inside body_mapping (e.g., "name": "CLI_{{solution_code}}_{{label}}-V"), reconciling sanitized empty keys (redirect_uri_s vs. {{redirect_uris}}).

Debounced Server-Side Combobox Search & CDK Virtual Scrolling: Wire <ds-combobox> search events (debounceTime + distinctUntilChanged) to FastAPI's search: Optional[str] query parameter and pair with Angular CDK Virtual Scrolling for 10,000+ record lookups, plus wire <app-forms> and single-record GET detail cards directly into ChatScreenComponent's live backend directive switch.

### 9.3 Data Visualization & UX Enhancements

Full-Dataset Chart Aggregation & Full-Row CSV Export: DataVizComponent.processDataAndRender() currently slices incoming arrays to .slice(0, 100) for client rendering, and downloadChart() in Table view exports summarized { label, value } pairs. Computing chart COUNT aggregations across the full payload.data array before slicing and exporting all rawTableColumns rows in CSV mode will ensure exact enterprise reporting.

Interactive next_suggestions & Widget Expand Actions: Wire DataVizComponent's Recommended Actions chips (@Output() suggestionClicked) to auto-submit prompts in ChatScreenComponent, and connect the Widget chart header's ds-icon-fullscreen icon to trigger switchToWebApp() or a modal view.

Modernize Clipboard API, Inline SVGs & Visibility-Aware Polling: Migrate copyText() from document.execCommand('copy') to navigator.clipboard.writeText() (retaining execCommand fallback for restricted iframes), replace the 10 active/inactive PNG toolbar icons with currentColor inline SVGs, deduplicate remaining inline --- Sources --- regex blocks in PopoutComponent/ChatbotComponent, and pause the 10-second HISTORY_URL poller via document.hidden when browser tabs are backgrounded.
