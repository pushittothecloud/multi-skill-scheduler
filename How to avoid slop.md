# **<mark>Category 1: Deterministic Code-Level Guardrails (TypeScript & JavaScript)</mark>** 

<mark>Deterministic static analysis blocks low-evidence code patterns before they can compile or make it to production. These are the core rules modeled after highly performant rust-based linter plugins (like Oxlint's anti-slop )</mark> : 

- <mark>Ban Chained Type Assertions (no-chained-type-assertions): Reject</mark> 

   - double-casting patterns like <mark>const user = input as unknown as User . This completely discards TypeScript's type evidence, masking critical runtime type-mismatch bugs.</mark> 

- <mark>Validate Boundaries instead of Casting (no-runtime-typeof): AI agents love to blindly cast API JSON responses downstream. Instead of ad-hoc narrowing</mark> using <mark>typeof</mark> or unchecked casting, enforce parsing inputs at your system's <mark>boundaries with schema validators like Zod or Pydantic.</mark> 

- <mark>Require Assertion Safety Invariants (require-safety-comment-for-type-assertion): Require a preceding comment explaining</mark> _<mark>why</mark>_ <mark>an assertion is safe for any</mark> non-const type assertions (e.g., <mark>// SAFETY: parseUserId validated this payload before branding</mark> followed by <mark>const id = val as UserId )</mark> . 

- <mark>Ban Known-Value Widening (no-known-value-widening): Reject broad typing that</mark> discards precise compile-time evidence (such as assigning <mark>{ start: startHandler }</mark> to a wide <mark>Record<string, Handler></mark> type; use the <mark>satisfies</mark> operator instead). 

- <mark>Ban Unsafe Dictionary Contracts (no-unsafe-dictionary-type): Disallow defining</mark> dictionary value contracts based on broad, untrusted types like <mark>unknown , any , object ,</mark> or {} . 

- <mark>Reject Unknown Parameters and Returns (no-unknown-parameters & no-unknown-returns): Prohibit functions from accepting or returning raw unknown</mark> or <mark>Promise<unknown></mark> types except in standardized error-handling scenarios (e.g., an explicit <mark>cause</mark> parameter). 

# **<mark>Category 2: Frontend & Performance Hygiene (Anti-Bloat Rules)</mark>** 

<mark>AI models are notoriously poor at tracking asset size, bundle compilation, and standard web accessibility. Watch out for these four common AI code generation traps:</mark> 

- <mark>Zero DOM Duplication: Strictly reject rendering identical page content twice in the DOM to handle responsive views (such as having separate, duplicated HTML blocks for mobile and desktop). Responsive layouts should be managed through fluid CSS/Tailwind grid controls instead.</mark> 

<mark>● Asset and Package Bloat Control: Watch for massive, uncompressed media assets (like uncompressed multi-megabyte PNGs) or unnecessary third-party packages pulled in to solve trivial problems that native APIs can handle.</mark> 

- <mark>Zero Production Pollution: Prevent the leakage of unit tests, developer configuration scaffolding, or mock datasets into the final production builds and client-side bundles.</mark> 

- <mark>Accessibility Strictness: Enforce basic web accessibility metadata natively (such</mark> as refusing markup that includes images without valid <mark>alt</mark> tags or form inputs <mark>without labels).</mark> 

# **<mark>Category 3: High-Leverage Architecture (Structuring Clean Codebases)</mark>** 

- <mark>"AI slop" isn't just syntax errors; it is also structural confusion. Applying core software engineering design principles stops your repository from degrading into an unmaintainable "ball of mud":</mark> 

   - <mark>Strive for Deep Modules: Avoid shallow modules—which feature complex, bloated public interfaces with very little actual implementation hiding behind them. Design deep modules that expose highly simplified, high-leverage APIs while encapsulating complex state and business rules inside the module boundaries.</mark> 

   - <mark>Maintain High Locality: Avoid splitting related logic or parallel implementations across a dozen isolated files. Group and colocate files that change together</mark> 

      - (locality) into unified domain directories (such as <mark>/features/scheduling/ )</mark> . 

   - <mark>Define Clear Seams and Adapters: Establish distinct architectural seams where module interfaces interact, and shield them behind mockable</mark> " <mark>adapters</mark> " <mark>(e.g., swapping a real live database out for a fast, memory-safe in-memory clock or store during testing).</mark> 

# **<mark>Category 4: Workflow & "Context Hygiene" Rules (How to Prompt Cursor)</mark>** 

<mark>How you interact with your IDE's agent dictates the quality of the code it generates. "Vibe coding"—copying and pasting AI-generated blocks because "it runs" without actually understanding the codebase—is a cognitive trap.</mark> 

- <mark>Plan, Implement, Validate (The PIV Cycle): Agree on database schemas,</mark> interfaces, and screen milestones in a local specification file (like <mark>plan.md )</mark> _<mark>before</mark>_ <mark>letting the AI write any code.</mark> 

- <mark>Constant Context Resets: Shoving giant logs and conversation histories into the LLM context causes "context rot," leading the AI to hallucinate errors. Periodically</mark> clear your chat histories ( <mark>/clear )</mark> or start a fresh session when switching <mark>features to reset the compounding token tax.</mark> 

● Keep PROM / spec files lean: If you use a <mark>.cursorrules</mark> or <mark>claude.md</mark> file, <mark>keep it under 200–300 lines. Bloating it with excessive instructions forces you to pay a massive "invisible context tax" on every single turn.</mark> 

<mark>● Reject O(N²) Operations Early: AI is notoriously lazy about scale, often writing</mark> nested loops (e.g., nested <mark>.map</mark> or <mark>.some</mark> callbacks) that collapse under <mark>enterprise-level database volume. Instruct the AI to choose efficient data structures (Hash Maps/Sets, sorting + early exits) from day one.</mark> 

