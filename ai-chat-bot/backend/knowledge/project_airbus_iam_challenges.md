# Airbus IAM AI Assistant UI (<iam-chatbot>) — Engineering Challenges Faced & Solutions

An end-to-end technical retrospective documenting the architectural, build, integration, concurrency, performance, and security challenges encountered while developing and deploying the Airbus IAM AI Assistant UI (iam-ai-assistant-ui) from local prototype to Red Hat OpenShift production.

## Executive Summary Matrix

| Category | Challenge / Symptom | Root Cause | Production Solution |
| --- | --- | --- | --- |
| Micro-Frontend Packaging | Host portal CSS collisions & router conflicts | Global Angular styles & routing clash with parent portals | Packaged as <iam-chatbot> via @angular/elements with ViewEncapsulation.ShadowDom |
| CI/CD & Dependencies | Jenkins ERESOLVE & EBADENGINE build failures | ng2-charts pulled @angular/cdk@21 into Angular 18 on Node 18 | Upgraded build runtime to Node 20 and migrated to zero-CDK echarts + ngx-echarts@18 |
| Single-Bundle Bundling | <app-data-viz> silently rendered blank in production | provideEcharts() lazy-loaded chunks that broke in single-file bundles | Switched main.ts to eager provideEchartsCore({ echarts }) + --max_old_space_size=4000 |
| Cross-Domain Assets | Toolbar & rating PNGs returned 404 on host portals | Relative /assets/... URLs resolved against the host domain | Injected environment.assetBaseUrl via @Input() assetBase across child components |
| Async Concurrency | "Ghost Replies" bled into new or historical chats | Event-loop pauses at await bypassed .unsubscribe(); aborts triggered error UI | 3-layer defense: AbortController, silent AbortError filtering, chatSessionMark stamps & 10s polling |
| Component Lifecycle | "Session has timed out" stuck on historical chats | Angular reused ChatScreenComponent without re-running ngOnInit() | Reset isSessionTimedOut = false and session stamps inside ngOnChanges() |
| Multi-Tab & Multi-User State | Broken @for renders, duplicate popouts & user cache leaks | JSON.parse() broke object refs; shared localStorage persisted across logins | Used track $index, BroadcastChannel, ChatbotWebAppTab lock & 1s access_token watcher |
| Backend Schema Drift | Frequent LLM payload & Markdown shifts broke screens | Multiple components parsed raw API keys & LLM tags directly | Centralized normalizeBackendResponse() Adapter + block-safe Markdown & <a href> parser |
| Directive Data Viz | Blank nested table cells & overflowing 20-page buttons | Flat row[col] failed on dot paths; unbounded page arrays (TS2345) | Built getCellValue() dot-path reducer & strict 5-number ellipsis pagination (pagesArray) |
| Progressive Forms | Recursive call-stack crashes & 10,000-row DOM freezes | Mutating controls inside valueChanges looped; localStorage hit 5MB quota | Used { emitEvent: false }, lazy unlocking, RAM option caching & Virtual Scrolling |
| IAM Security & BFF | Browser CORS blocks, 400 SSO errors & POST/GET drift | Direct internal IAM calls failed CORS; oversized app scopes; FastAPI expected GET | Routed lookups via FastAPI GET /api/lookup (HttpParams + Bearer id_token) & endpoint scopes |

## 1. Micro-Frontend Packaging, Build Tooling & OpenShift CI/CD

### 1.1 Host Portal CSS Collisions & Router Isolation

The Problem: The assistant needed to be embedded across multiple existing internal Airbus web applications without colliding with host stylesheets, global typography, or parent Angular/SPA routers.

Root Cause: Standard Angular builds mount onto <app-root> with global styles and browser URL routing, allowing host CSS rules to bleed into child components and break Airbus Design System layouts.

Final Solution: Architected the application using Angular 18 Standalone Components, wrapped the root ChatbotComponent as a framework-agnostic Custom Web Element (<iam-chatbot>) via @angular/elements (createCustomElement), and enforced ViewEncapsulation.ShadowDom so internal styles remain strictly isolated.

### 1.2 Jenkins CI/CD Peer Dependency Conflicts (ERESOLVE) & Node Engine Drift (EBADENGINE)

The Problem: Integrating initial charting packages (ng2-charts + chart.js) broke automated builds with NPM ERESOLVE peer dependency errors and EBADENGINE engine warnings across local and CI environments.

Root Cause: ng2-charts introduced transitive peer dependencies attempting to pull @angular/cdk@21 into an Angular 18.x workspace, while build environments running Node v18.16.0 fell below Angular 18 devkit engine expectations.

Final Solution: Standardized local development (nvs use 20) and OpenShift build containers (iam-ai-assistant-nodejs) on Node.js 20, completely removed ng2-charts, and migrated to **echarts (5.x) + ngx-echarts@18**, eliminating @angular/cdk peer conflicts across all OpenShift ASPIRE namespaces (<openshift-namespace>, <openshift-namespace>, <openshift-namespace>, <openshift-namespace>).

### 1.3 Silent Runtime Failure of Lazy-Loaded Charts in Single-Bundle Web Elements

The Problem: After building DataVizComponent, text bubbles rendered normally inside <iam-chatbot>, but ECharts canvases silently failed to appear when bundled via build-elements.js and served from iam-ai-assistant-nginx on OpenShift.

Root Cause: Default provideEcharts() relies on dynamic runtime import() chunk loading. Once concatenated into a single Custom Element script mounted on an external host portal URL, relative chunk paths failed to resolve at runtime.

Final Solution: Replaced provideEcharts() in src/main.ts with eager core injection via provideEchartsCore({ echarts }) and configured high-memory production compilation (node --max_old_space_size=4000 node_modules/@angular/cli/bin/ng build --configuration production && node build-elements.js) so ECharts compiles directly into the single self-contained Web Element bundle.

```
// src/main.ts — Eager ECharts bundling for single-file Custom Web Elements

const app = await createApplication({

  providers: [

    provideHttpClient(),

    provideEchartsCore({ echarts })

  ]

});

const chatbotElement = createCustomElement(ChatbotComponent, { injector: app.injector });

customElements.define('iam-chatbot', chatbotElement);

```
### 1.4 Cross-Domain Static Asset 404s & Stale Incremental Compiler Cache (NG8001 / NG8002)

The Problem: Custom toolbar icons (10 active/inactive chart PNGs, chart-download.png, and 1–5 smiley rating PNGs) worked on localhost:4200 but broke when <iam-chatbot> was hosted on external portals; during integration, Angular also threw NG8001 (unknown element <app-data-viz>), NG8002 (can't bind to [assetBase]), and NG5002 (template @else block error).

Root Cause: Relative /assets/images/... paths resolve against the host portal's origin rather than the OpenShift Nginx static host. Meanwhile, standalone components require explicit registration in parent @Component.imports, and Angular's incremental .angular/cache occasionally held stale input metadata after adding new @Input() properties.

Final Solution: Added assetBaseUrl in environment.ts and propagated @Input() assetBase from ChatbotComponent down to ChatScreenComponent and DataVizComponent, registered standalone child modules explicitly, fixed stray brace syntax before @else, eliminated a circular self-import in ChatScreenComponent, and cleared the Angular compiler cache.

## 2. Asynchronous Concurrency, Session Lifecycle & Cross-Tab State

### 2.1 Async Race Conditions & "Ghost Replies" Across Event-Loop Yields

The Problem: If a user sent a slow query and clicked Start New Chat or opened a Past Conversation from History while the typing indicator was spinning, the screen cleared—but seconds later, the old in-flight AI response arrived and injected itself into the newly opened chat or at the bottom of a read-only historical conversation.

Root Cause & Why Initial Fixes Failed:

Attempt 1 — RxJS .unsubscribe(): Failed because sendMessage() executed await firstValueFrom(this.chatbotService.fetchUserRoles()) and await this.chatbotService.chat() before creating an RxJS subscription. Clicking away during an await pause meant no subscription existed yet to cancel; once the promise resolved, execution resumed and pushed data into the wrong session.

Attempt 2 — Service AbortController Alone: Exposed two secondary bugs—clicking historical sessions (handleConversationLoad / onLoadSession) was not invoking clearMemory() to abort the request, and calling .abort() triggered Angular HttpClient's error block, injecting "Error connecting to server." bubbles into the user's new chat.

Final 3-Layer Production Solution:

Physical Network Cancellation: Bound AbortController.signal to ChatbotService.chat() and wired clearMemory() into both new-chat resets and history session loaders.

Silent Abort Filtering: Filtered out err.status === 0, AbortError, and 'abort' messages inside error callbacks so intentional cancellations terminate silently.

Execution Invalidation Stamps (chatSessionMark) + Silent Polling: Stamped every sendMessage() invocation with Date.now() before the first await and verified the stamp after every await, inside subscribe (next and error), and inside setTimeout. Added a silent 10-second setInterval history poller in ChatbotService so abandoned responses saved by the backend still surface automatically in Recent Interactions.

```
// Closing the async/await event-loop yield window in ChatScreenComponent & PopoutComponent

const currentStamp = Date.now();

this.chatSessionMark = currentStamp;

const roles = await firstValueFrom(this.chatbotService.fetchUserRoles());

if (this.chatSessionMark !== currentStamp) return; // Guard after await #1

const obs = await this.chatbotService.chat(userText, roles);

if (this.chatSessionMark !== currentStamp) return; // Guard after await #2

obs.subscribe({

  next: (res) => {

    if (this.chatSessionMark !== currentStamp) return; // Guard on emission

    // Render normalized bot message...

  },

  error: (err) => {

    if (this.chatSessionMark !== currentStamp) return;

    if (err?.name === 'AbortError' || err?.status === 0) return; // Silent abort

  }

});

```
### 2.2 Angular Component Reuse & Stale Inactivity Timeout State

The Problem: Leaving an active chat idle for 5 minutes (300,000 ms) triggered handleTimeout(), setting isReadOnly = true and isSessionTimedOut = true ("Session has timed out."). When the user subsequently selected a past conversation from History, the banner stayed stuck on "Session has timed out." instead of "Viewing past conversation." until a full browser refresh.

Root Cause: Switching sessions updated @Input() messages on the existing ChatScreenComponent instance without destroying it, meaning ngOnInit() never re-ran and isSessionTimedOut remained true in memory.

Final Solution: Added explicit lifecycle cleanup at the top of ngOnChanges() to reset this.isSessionTimedOut = false and rotate this.chatSessionMark whenever @Input() messages changes.

### 2.3 Dual-Mode State Sync, @for Serialization Loss & Duplicate Popout Tabs

The Problem: Transitioning between the compact embedded Widget and full-screen Web-App (?mode=webapp) caused Angular @for rendering glitches on rehydrated charts/messages, desynchronized chart views and smiley ratings across tabs, and risked opening conflicting duplicate Web-App tabs.

Root Cause: Passing state across tabs via localStorage (JSON.stringify / JSON.parse) destroys JavaScript object identity references used by @for (...; track msg).

Final Solution:

Switched template loops to @for (msg of messages; track $index) for serialization-safe rendering.

Used chat_live_state for Widget-to-WebApp state handoff, chatPopoutActive = 'true' + named window target ChatbotWebAppTab to focus the existing Web-App tab rather than spawning duplicates, @HostListener('window:storage') (iam_dataviz_view) for live chart-type sync, and BroadcastChannel('iam-chat-sync') (REFRESH_NOW) for cross-tab history updates.

### 2.4 Multi-User Shared Browser Cache Leakage & Zero-Lookup Identity

The Problem: Persisting active chats in localStorage (iam_chatbot_history) risked exposing User A's IAM conversation if User B logged into the same browser session; additionally, personalizing greetings with real names instead of corporate NGIDs needed to avoid extra profile API round-trips.

Final Solution: Decoded id_token JWT claims and corporate email addresses (user@enterprise-corp.com → Firstname Lastname) client-side, scoped iam_chatbot_history to { userId, messages }, and implemented a 1,000 ms token watcher polling access_token to immediately purge cached state on user mismatch.

## 3. Backend Contract Drift, Markdown Parsing & History Normalization

### 3.1 Unstable Backend Schemas, Strict Union Typing (TS2322) & LLM Reasoning Artifacts

The Problem: Across RAG and MCP pipeline updates, backend response keys shifted repeatedly (ai_message_content, final_response, response, content, text), boolean flags arrived inconsistently (true, 'true', 1), live vs. historical payloads mixed raw_json_output and rawJsonOutput, raw LLM artifacts (<thinking>...</thinking>, 🤖 Agent:, Unknown KB) leaked into chat bubbles, and generic string sender types triggered TypeScript TS2322 errors against 'user' | 'bot'.

Root Cause: Early parsing logic was scattered across Widget, Popout, and History components, coupling UI templates directly to raw backend field names.

Final Solution: Centralized all ingestion inside ChatbotService.normalizeBackendResponse() (Adapter Pattern), checking fallback keys in priority order, normalizing Unix timestamps, enforcing strict 'user' | 'bot' union assertions, stripping <thinking> and agent prefixes, and mapping rawJsonOutput uniformly across live and historical flows.

### 3.2 Evolving Rich Markdown vs. Block-Level HTML Wrapping & <a href> Citation Unwrapping

The Problem: When backend agents began outputting rich Markdown (#/##/### headings, inline code, > blockquotes, --- horizontal rules, and Unicode • bullets), parseMessageData() rendered raw symbols or wrapped block-level tags inside line-by-line <div style="margin-bottom: 6px;"> containers. Furthermore, --- Sources --- footers arrived unpredictably as either raw URLs or HTML <a href="..."> tags alongside repetitive inline "refer to KB article..." text.

Final Solution: Extended ChatbotService.parseMessageData() with Airbus-styled regex transforms, added a block-element guard to skip <div> wrapping on <h1..3>, <hr>, and <blockquote> lines, deduplicated inline KB boilerplate, and applied regex URL unwrapping (/href="([^"]*)"/) so source citation chips always receive clean https:// targets.

### 3.3 Multi-Task Backend Threads & Raw HTML Leaking into Sidebar Titles

The Problem: Backend history logs stored multiple completed IAM tasks inside a single session.messages array, and generating 40-character Recent Interactions titles from user prompts leaked raw <div> and &nbsp; markup into SidebarComponent.

Final Solution: Built sub-session chunking in ChatbotService.transformHistoryData() to split threads into discrete UiSessionItem entries (${session.session_id}-sub${chunkIndex}) whenever task_completion or feedback is encountered, stripping all HTML tags (/ <[^>]*> /g) prior to title truncation.

## 4. Agentic Data Visualization (DataVizComponent) & Layout Ergonomics

### 4.1 Nested Dot-Notation Directives, Key Mismatches & Context-Aware Export

The Problem: Agentic LIST operations required rendering 5 interchangeable views (Bar, Line, Donut, Pie, Table) driven entirely by backend ui_render_directive metadata. Directives referenced deeply nested properties (solution.name, solution.code, directory.domain) where flat row[col] lookups returned undefined, and contained casing mismatches between x_axis_key: "lifecycleStatus" and row keys (lifecycle_status).

Final Solution: Implemented a safe dot-notation reducer (getCellValue), added camelCase-to-snake_case fallback normalization, dynamically aggregated COUNT/numeric metrics mapped to directive hex colors, and built a dual export handler (downloadChart()) outputting 2x high-DPI .png images via echartsInstance.getDataURL() for charts or UTF-8 .csv files for tables.

### 4.2 Large Payload DOM Bloat & Horizontal Pagination Overflow (TS2345)

The Problem: Rendering 600+ IAM account rows froze chat scrolling, while paginating 50–100+ rows at 5 rows per page rendered 20 page buttons (1..20)—and even a delta = 2 window rendered up to 9 buttons—stretching chat bubbles horizontally. Mixing '...' dividers into number[] also failed compilation with TS2345.

Final Solution: Combined client-side slice capping with progressive "Load More" (+3) accordion cards in Widget mode and a strictly bounded (number | string)[] pagesArray getter in Web-App mode that caps visible buttons at 5 page numbers maximum across start (1 2 3 4 ... 20), middle (1 ... 4 5 6 ... 20), and end (1 ... 17 18 19 20) patterns.

```
// Strict 5-number bounded pagination preventing horizontal chat bubble overflow

get pagesArray(): (number | string)[] {

  const total = this.totalPages;

  const current = this.currentPage;

  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 3) return [1, 2, 3, 4, '...', total];

  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];

  return [1, '...', current - 1, current, current + 1, '...', total];

}

```
### 4.3 Floating Rating Overlay Obscuring Charts & Dual-Mode Canvas Sizing

The Problem: A 300px chart canvas overflowed the compact Widget window, while placing .global-rating-container (the 5-smiley end-of-chat rating bar) outside .chat-body / .chat-messages caused it to float rigidly above the input bar and clip the bottom of rendered charts; enterprise compliance also required an AI disclaimer on bot responses across both layouts.

Final Solution: Scoped canvas heights and ECharts grid margins by mode (200px with compact 3-dot switcher in Widget vs. 300px with segmented active/inactive Airbus icon bar in Web-App), moved .global-rating-container inside #chatBody so ratings scroll inline beneath the final message and hide behind the "Conversation closed" divider on follow-up queries, and rendered "AI-generated response. Please review carefully." strictly on msg.type === 'bot' in both templates.

## 5. Metadata-Driven Progressive Forms (FormsComponent), Security & FastAPI BFF

### 5.1 Hardcoded Forms vs. Loop-Safe Progressive Disclosure & Object Retention

The Problem: Maintaining static Angular forms (resourceName, resourceType) for every MySSO/IAM workflow was unscalable. Replacing it with a schema-driven engine (create_connector_json.json / update_connector_json.json) required unlocking steps strictly in order sequence, unifying both "Dropdown" and "List" apilookup types into single-select searchable <ds-combobox> controls, displaying readable display_keys ("<sample-solution-code> - IAM Solution") while preserving hidden object fields (reference_keys) for body_mapping, and resetting downstream steps without triggering Maximum call stack size exceeded loops on myForm.valueChanges.

Final Solution: Sorted ui_interaction_mode.input_parameters by order, enabled only Step 1 on load, lazily fired triggerBFFLookup() only when an apilookup control unlocked, bound formatted strings to [label] while retaining full API objects in [value], and passed { emitEvent: false } on all programmatic .enable(), .disable(), and .setValue('') mutations.

```
// Loop-safe progressive step unlocking & cascading downstream reset in FormsComponent

if (currentControl?.valid) {

  if (nextControl?.disabled) {

    nextControl.enable({ emitEvent: false });

    if (this.formFields[i + 1].input_type === 'apilookup' && !this.dropdownOptions[this.formFields[i + 1].key]) {

      this.triggerBFFLookup(this.formFields[i + 1]);

    }

  }

} else {

  for (let j = i + 1; j < this.formFields.length; j++) {

    this.myForm.get(this.formFields[j].key)?.disable({ emitEvent: false });

    this.myForm.get(this.formFields[j].key)?.setValue('', { emitEvent: false });

  }

  break;

}

```
### 5.2 Browser CORS Blocks, OAuth Scope Limits & FastAPI BFF Contract Alignment

The Problem:

Direct browser calls from localhost:4200 / portal origins to internal <internal-iam-api-gateway> endpoints exposed internal gateway routes and failed browser CORS preflight checks.

Early SSO sandbox configurations using broad application-level OAuth scopes caused HTTP 400 errors and token generation failures due to oversized scope payloads.

During BFF integration, an early frontend POST payload accidentally included targetUrl in the JSON body while the backend team implemented a universal Python FastAPI GET /api/lookup endpoint expecting query parameters and a Bearer header.

Final Solution:

Migrated OAuth authorization to granular endpoint-level scopes (<oauth-scope-solution-read>, <oauth-scope-oauth2-read>) and cached frontend RBAC role verification (AI-ENDUSER, AI-ADMIN, AI-AUDITOR) via ChatbotService.fetchUserRoles() with shareReplay(1).

Aligned FormsComponent.triggerBFFLookup() with FastAPI GET /api/lookup using HttpParams (url, scope) and HttpHeaders (authorization: Bearer <id_token>) audited in Chrome DevTools, queueing server-side scope-to-URL lookup tables for the next hardening phase to eliminate URL query exposure completely.

### 5.3 5,000–10,000+ Lookup Records & Avoiding the localStorage Trap

The Problem: Enterprise IAM solution and scope lookups can return 5,000 to 10,000+ objects. Rendering thousands of DOM nodes freezes the browser, while caching lookup arrays in localStorage triggers QuotaExceededError (~5 MB browser cap), blocks the main UI thread during synchronous JSON.parse(), and serves stale IAM permissions.

Final Solution: Stored active lookup datasets exclusively in component RAM (dropdownOptions) for fast client-side filtering and automatic garbage collection on destroy, paired architecturally with Virtual Scrolling so only ~10–15 visible items mount in the DOM at once.

### 5.4 Imperfect JSON Blueprints & Strict Angular Compiler Errors (NG2, NG5002, TS2307, NG9)

The Problem:

Imperfect Backend Metadata: Order 5 ("Redirect URI's") in create_connector_json.json arrived with an empty "key": "" and "regex": "*" (an invalid quantifier that crashes JavaScript new RegExp('*')).

Strict Template & TS Errors: Dynamic control lookups (myForm.get(field.key)?.invalid) returned boolean | undefined (NG2 on <ds-form-control [error]>), combining + concatenation with | lowercase inside [placeholder] threw NG5002: Parser Error, importing .json files threw TS2307 even after editing tsconfig.json because ng serve watch mode does not hot-reload root TS configs, an unclosed }); in PopoutComponent triggered 30+ cascading false errors, and a full-file paste dropped handleMultiSelectSubmit (NG9).

Final Solution: Added defensive key synthesis (field.label.toLowerCase().replace(/[^a-z0-9]/g, '_')), ignored bare "*" regex wildcards while honoring Validators.maxLength, appended || false on strict boolean inputs, used native string interpolation (placeholder="Search {{ field.label | lowercase }}..."), enabled resolveJsonModule + esModuleInterop with a full ng serve restart, and restored strict Git diff checks before committing refactors.

### 5.5 Unblocking UI & Parser Development When Backend Services Are Offline

The Problem: Waiting on live backend deployments, corporate VPNs, or local FastAPI instances (status: 0 / net::ERR_CONNECTION_REFUSED on port 8080) repeatedly risked stalling frontend development, while adding a strict if (!this.apiResponse) return; guard initially broke offline chart testing with a blank screen.

Final Solution: Built a complete offline development workflow across all modules:

Chat Mock Triggers: Preserved client-side keyword interceptors (data / data-viz, form, lov, lov2, end) in ChatScreenComponent.sendMessage().

Local Dataset & BFF Fallbacks: Wired this.apiResponse || this.defaultSampleData (AccountList_LifecycleStatus.json) in DataVizComponent and populated structured dummy records (TEST01 - Dummy Data 1) inside FormsComponent's BFF HTTP error callback.

Offline Parser Harness: Tested normalizeBackendResponse() directly against captured RAG/MCP payloads (IIVR, SAP password reset, MyAppConnect Scopes) in DevTools Console without requiring a running backend server.

## 6. Key Engineering Takeaways & Production Standards

Normalize at the Service Boundary (Adapter Pattern): Never bind UI templates directly to raw backend keys or unparsed LLM strings; isolating payload translation inside a single service method turns multi-screen breaking changes into a five-minute update.

Guard Every await Boundary in Interactive UIs: An async method pauses execution at every await, giving users time to switch views or reset state. Combine AbortController network cancellation with silent abort handling and execution-stamp checks (chatSessionMark) after every async resumption point.

Design for Component Reuse (ngOnChanges over ngOnInit): In SPA sidebars and history switchers, Angular reuses live component instances when @Input() references change; transient flags like timeouts and session marks must always be reset in ngOnChanges().

Treat External Metadata & Browser Storage Defensively: Sanitize missing keys and invalid regex strings in backend JSON schemas, keep 5,000+ record datasets in RAM rather than localStorage, and pass { emitEvent: false } whenever mutating reactive form controls inside valueChanges streams.

Verify Packaging Constraints Early: Micro-frontends compiled into single-file Shadow DOM Web Elements behave differently from standard SPAs—eagerly bundle libraries like ECharts (provideEchartsCore), parameterize static asset URLs (assetBase), and align HttpParams/HttpHeaders contracts against live DevTools Network traces early.
