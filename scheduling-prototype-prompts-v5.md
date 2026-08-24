# Prompt Engineering & App-Building Guide: Multi-Skill Scheduling Prototype (v5)

This guide translates the **Broccoli Multi-Skill Scheduling technical assessment** into a production-grade prompt sequence. By synthesizing the research and best practices from your notebook, we establish a strict division between **How to Write** (the prompt-engineering guidelines for the developer) and **How to Code** (the architectural, coding, and UI/UX rules the AI must implement). This separation guarantees a high-leverage, clean, and bug-free implementation in AI application-building tools such as **Lovable**, **v0**, **Bolt.new**, or **Cursor** [180].

---

# Part I: The Developer's Writing Guide (How to Write Prompts for AI)

*This guide focuses on the human element of prompt engineering—specifically how you, the developer, should write, structure, and manage your textual prompts to maximize the model's instruction-following accuracy, eliminate misinterpretation, and minimize token overhead.*

## 1.1 Structural Prose & Reader Expectations (Lingard's Principles)
Grounded in Reader-Expectation Theory, these guidelines ensure your prompts are syntactically and semantically optimized for the AI's parser, avoiding common instruction drift [121, 159, 160]:
*   **State the Topic Early**: Place the main subject at the very beginning of the sentence to open an immediate "cognitive folder" in the AI's context [121, 161]. Avoid long, introductory "wind-ups" (e.g., instead of *"Before doing X, and while keeping Y in mind, you should write Z,"* write: *"Write Z. Ensure Y is maintained. Do not start X until..."*).
*   **Keep Subjects and Verbs Close**: Position the action verb immediately after its subject to provide immediate "syntactic resolution" and prevent important interrupting details from being glossed over or forgotten by the model [121, 165].
*   **Utilize the "Stress Position"**: Put critical constraints, outcomes, or new requirements at the very end of sentences (or directly after colons/semicolons), where the AI's attention mechanism expects extra rhetorical weight [121, 167].
*   **Apply the Given-New Chain**: Connect consecutive instructions by beginning each new sentence with familiar context ("given" info) before introducing a new instruction ("new" info). This creates a seamless semantic path for the model to follow [121, 174].

## 1.2 Prompt Optimization & Assertive Specifications (ICPC Guidelines)
These rules govern how to frame logical scenarios, preconditions, and formatting expectations to remove all semantic ambiguity [81]:
*   **Rigorous Input/Output Frameworks**: Declare exact data schemas, input variables, and output interfaces (such as TypeScript boundaries or JSON schemas) first, before writing functional requests [81].
*   **Preconditions and Postconditions**: Explicitly state the exact state of the system *before* an action runs (preconditions) and the absolute logical guarantees that must be true *after* it runs (postconditions) [81, 88].
*   **Unambiguous Multi-Branch Conditions**: Avoid lazy "otherwise" checks. Specify mutually exclusive, explicit conditional rules so the AI has zero room to guess edge-case behaviors [83, 85].
*   **Assertive Imperative Directives**: Rely on strict, unambiguous keywords like **"must"**, **"is required to"**, and **"ensure that"** instead of weak helpers like "should", "may", or "please" [83, 87].

## 1.3 Token Economy, Chat Habits, and Context Hygiene
How you manage your prompting sessions directly controls "context rot" and invisible, compounding token cost spikes [107, 108]:
*   **The Context Reset Habit (`/clear`)**: Giant chat histories cause the AI to hallucinate and lose sight of early instructions. Wipe the chat history clean (`/clear` or `/cle` in your IDE) whenever you complete a major screen or component milestone [107, 108].
*   **The Handoff Summary Protocol**: To preserve work across a `/clear` command, ask the AI to generate a clean "architectural handoff" summary of its active state, completed database structures, and styling decisions. Copy this summary, reset the chat, and paste it into the next prompt as your baseline context, saving thousands of tokens [107].
*   **Direct Prompt Editing**: If the AI writes bug-ridden code, do not reply with corrections like *"No, that is wrong, fix it."* Follow-up messages stack onto the active context, multiplying your costs. Instead, edit your original prompt directly, add the missing constraint, and regenerate the response [107].
*   **Surgical File Referencing**: Direct the AI's attention explicitly using `@filename` tags or exact relative paths to prevent it from scanning unnecessary files in your repository, which wastes precious context tokens [108].

---

# Part II: The AI's Coding & UI/UX Standards (Rules for the AI's Output)

*This section defines the precise operational, architectural, and visual rules that the AI must implement in your application code. These standards are baked into the Global System Prompt and individual phases so the AI never outputs low-quality, generic "slop."*

## 2.1 Software Architecture & Modularity
Ensures the generated codebase remains robust, maintains high locality, and avoids tight coupling [101]:
*   **High File Locality**: Colocate all domain files (state stores, hooks, adapters, configurations) under a single logical directory (`/src/features/scheduling/`) to keep code change vectors tight [101].
-   **Deep Modules & Custom Hook APIs**: Hide complex database state transformations, calendar math, and slot intersection calculations behind a simple, high-leverage custom hook API (e.g., `useScheduler`). UI screens must remain thin and focused strictly on rendering [101].
*   **Clean Interface Seams**: Abstract your data layer behind a mockable adapter interface (e.g., `SchedulingAdapter`). This allows swapping a live database with a fast, memory-safe in-memory store representing database state without breaking UI layers [101].
*   **The Stepdown Rule & Single Responsibility**: Code layout must flow hierarchically (high-level orchestration functions first, helper details below) [118]. Every function must do exactly one thing and do it exceptionally well [118].
*   **Intent-Based Comments**: Comments must explain *intent* or *why* a specific approach was taken, rather than just translating self-explanatory code blocks. Explicitly ban leaving "zombie code" (commented-out blocks) in the final output [119].

## 2.2 TypeScript Strictness & Anti-Slop Guardrails
Enforces rigorous compile-time type safety and prevents common AI-generated casting escapes [99]:
*   **Ban Chained Type Assertions**: Prohibit double-casting patterns like `const user = input as unknown as User`, which completely discard TypeScript's type evidence and mask critical runtime bugs [99].
*   **Boundary Validation vs. Casting**: Require parsing all external inputs (such as API payloads or form variables) using runtime schema validators like **Zod** rather than trusting downstream data blindly [99].
*   **Assertion Safety Invariants**: Any non-const type assertions must be preceded by a comment explaining *why* the assertion is safe (e.g., `// SAFETY: input validated via Zod parse before branding`) [99].
*   **Prevent Type Widening**: Use the **`satisfies`** operator instead of broad, wide typing that discards precise compile-time evidence (such as assigning inline event handlers to wide dictionaries) [99].
*   **Unsafe Unknowns & Dictionary Contracts**: Prohibit functions from accepting or returning raw `unknown` or `Promise<unknown>` types except in explicit catch blocks [99]. Disallow defining generic dictionary contracts with broad, untrusted types like `unknown` or `any` [99].
*   **Meaningful Naming Rules**: Ban terse abbreviations or encoded data types (suffixes/prefixes) in variable names (e.g., no `nameString` or `ShiftBlockArray`). Use descriptive, full-word identifier names [115].
*   **Reject O(N²) Operations**: Never write nested loops (such as nested .map, .filter, or .some) to calculate technician availability. Pre-index technician shifts and existing bookings using Map or Set data structures for O(1) lookups [102].

## 2.3 Anti-Frankenstein Visual Design (DesignMD)
Prevents the AI from styling pages with random, incohesive paddings, colors, and margins [203]:
*   **Design Token Enforcement**: Require unified palettes, specific font scales, standardized layout paddings (e.g., spacing multiples of 8px/16px/24px), and uniform rounded corners across all screens [94].
*   **The Four-Level Hierarchy**: Organize design prompts and output components across a strict four-level visual hierarchy:
    1.  *Product*: Brand values, tone of voice, target audience [65].
    2.  *Design System*: Shared layout structures, colors, margins, borders, typography [71].
    3.  *Feature*: Screen-specific information architecture, content priority [80].
    4.  *Component*: State boundaries, access patterns, component properties [80].

## 2.4 Progressive Disclosure & Layout Interaction
Guarantees clean, intuitive, and accessible screen interfaces that scale seamlessly [218]:
*   **Cognitive Load Reduction**: Hide complex forms and list views until requested. Present high-priority operational summaries above the fold and load auxiliary details progressively [119, 218].
*   **Persistent Drawers & Bottom Sheets**: Use off-canvas side drawers or Material Design 3-style bottom sheets (with 28dp top corner radiuses and 48dp hit target drag handles) to house secondary editing forms and technician detail configs [93, 94, 216].
*   **Strict Tooltip vs. Popover UX Boundaries**: 
    *   *Tooltips* must remain passive, text-only, short labels under 1 sentence, triggered strictly on hover or keyboard-focus of interactive icon-only buttons [163, 206].
    *   *Modals and Drawers* must handle all active user interactions, links, forms, inputs, and multi-sentence descriptions [213, 216]. Placing interactive elements inside tooltips is strictly prohibited [168].
*   **Functional Color-Coding**: Colors on dispatch boards must serve as functional infrastructure (status/priority mapping) rather than cosmetic decoration [115, 116]. To ensure accessibility, every colored block must pair with secondary visual markers (high-contrast text labels, service icons, or distinctive patterns) [118].
*   **Accessibility Strictness**: Every form input must have a visible or screen-reader-accessible label; all icons/SVGs must contain alt text or `aria-hidden` attributes [100].

## 2.5 Explainable AI (XAI) & Interactive Verification
Builds system trust by making algorithmic scheduling decisions transparent and reversible [126]:
*   **Situated Microcopy**: Use card-level or inline descriptions in plain human language directly below blocked calendar slots to explain *exactly* why they are unavailable (e.g., identifying the booked technician or scheduled break block) [70, 130].
*   **Explain-Back Loops**: Natural language parsing bars must trigger a **Mutual Verification Card** showing a rephrased intent and an expandable reasoning path rather than mutating database state silently [131, 140].
*   **One-Click Reversibility**: Render highly visible "Undo" buttons to instantly revert automated state modifications [2, 140].

---

# Part III: Global System Prompt (`.lovablerules` / `.cursorrules` / `claude.md`)

*Save this lean file (< 135 lines to avoid token tax and context rot [102, 108]) in your project root to enforce architectural, coding, and UI/UX patterns globally.*

```markdown
# Broccoli Multi-Skill Scheduling System Rules

You are an elite Frontend Architect and Product Engineer specializing in high-performance React, TypeScript, and Tailwind CSS. Your focus is building deep, modular architectures while maintaining absolute performance, visual coherence, and code cleanliness [101, 115].

## 1. High-Leverage Architecture & Clean Code Rules (How to Code)
- **High Locality**: Colocate all domain files under `/src/features/scheduling/` [101].
- **Deep Modules**: Keep components and hooks focused, hiding complex slot calculations and state transformations behind a custom hook API (`useScheduler`) [101].
- **Clear Seams**: Abstract the data layer behind a swappable `SchedulingAdapter` interface. Initially, implement a fast, memory-safe in-memory store representing database state [101].
- **Stepdown Rule**: Organize code-level hierarchy. High-level orchestrations first, detail helpers below [118].
- **Modularity (SRP & DRY)**: Functions must do exactly one thing and do it well [118]. Avoid code duplication [118].
- **Strategic Documentation**: Comments must explain intent and "why" rather than "how" [119]. Do not leave "zombie code" (commented-out blocks) in the codebase [119].

## 2. Anti-Frankenstein UI/UX Rules (DesignMD & Progressive Disclosure)
- **Visual Token Rules**: Maintain 100% theme consistency across all views [10]. Use a unified palette, standardized paddings (e.g., spacing of 8px, 16px, 24px), font-sizes, and rounded corners [94].
- **Progressive Disclosure**: Keep interfaces clean [119]. Present critical summaries above the fold and hide complex details/forms inside tabbed pages, accordions, side drawers, or Material-style bottom sheets [93, 218, 224, 225].
- **Strict Tooltip Restraints**: Tooltips must be text-only, passive descriptions under 1 sentence, triggered strictly on hover/focus of interactive elements [165, 206]. NEVER place links, buttons, multi-sentence explanations, or inputs inside a tooltip [168, 212, 213].
- **Rich Interaction Popups**: Use persistent modal dialogs, drawers, or side sheets (28dp top corner radius) for any interactions requiring inputs, links, or multi-step selections [93, 94, 213, 216].
- **Functional Color over Decoration**: Match colors strictly to workflow states or priorities (e.g., red highlights for overlaps, active green for available) [115, 116]. Always pair color codes with a secondary accessible indicator (text labels, icons, or high-contrast patterns) [118].

## 3. Deterministic TypeScript Guardrails (Anti-Slop Code Rules)
- **Ban Chained Type Assertions**: Never double-cast variables (e.g., `as unknown as` is prohibited) [99].
- **Validate Boundaries**: Parse inputs at API/form boundaries using Zod schema validators rather than casting inputs [99].
- **Assertion Safety**: Precede non-const type assertions with a `// SAFETY:` comment explaining why it is safe [99].
- **Ban Known-Value Widening**: Use the `satisfies` operator instead of wide typing that discards precise compile-time evidence [99].
- **Safe Dictionary Contracts**: Disallow defining dictionary contracts with broad, untrusted types like `unknown` or `any` [99]. Reject functions accepting or returning raw `unknown` or `Promise<unknown>` without narrow handling [99].
- **Meaningful Names**: Use descriptive, full-word identifier names. Do not use terse abbreviations or encode variable data types (suffixes/prefixes) into their names [115].

## 4. Frontend & Performance Hygiene
- **ZERO DOM Duplication**: Manage mobile and desktop views using fluid CSS/Tailwind grid controls. Do not duplicate HTML structures for responsive layouts [100].
- **Reject O(N² Operations)**: Never write nested loops (such as nested .map, .filter, or .some) to calculate technician availability. Pre-index technician shifts and existing bookings using Map or Set data structures for O(1) lookups [102].
- **Zero Production Pollution**: Keep unit tests, configuration scaffolding, or mock generator scripts separated from client-side bundle builds [100].
- **Accessibility Strictness**: Every form input must have a visible or screen-reader-accessible label; all icons/SVGs must have alt descriptions or `aria-hidden` attributes [100].

## 5. Workflows & Context Hygiene
- **Plan, Implement, Validate (PIV)**: Agree on schemas, interfaces, and screen milestones in local spec files (`plan.md`) before writing any implementation code [102].
```

---

# Part IV: Step-by-Step Prompt Sequence for Building the App

*Copy and paste these prompts sequentially into your AI tool. Wait for the tool to complete each phase and verify it passes the requirements before proceeding to the next. This prevents "context rot" and ensures cumulative correctness [102, 108].*

### Phase 1: Foundation, Data Models & In-Memory Store
**Goal:** Create a robust, performance-optimized, and typed scheduling engine state with pre-indexed data structures [101, 102].

```markdown
### Role & Goal Definition
You are a React Systems Architect. Create the TypeScript types and an in-memory state engine (React Context or a custom store) for a Calendly-style multi-skill booking system [44, 180].

### Technology Stack & Navigation Strategy
1. **Base Framework**: React, TypeScript, and Tailwind CSS.
2. **Tabbed Navigation**: Implement a single-page application with a tabbed interface ('settings' | 'calendar' | 'booking') to manage the three screens. Keep all state alive in memory so updates in the settings tab instantly propagate across other tabs.
3. **Colocation**: Colocate all state, hook, and context files under `/src/features/scheduling/` to maintain high locality.

### Domain Context
The company offers 5 service categories: 'Plumbing', 'HVAC', 'Electrical', 'Drains', 'Roofing' [180].
Technicians have:
1. Working hours/shifts: standard weekly schedule (days worked, start/end time, breaks or unavailable blocks) [180].
2. Skills/certifications: an array containing a subset of the 5 categories (e.g., Janet has ['Plumbing', 'Drains']) [180].
3. Calendar availability: pre-booked appointments (date, start/end time, service type, technician ID, customer details, assignment status: 'assigned' | 'unassigned') [180].

### Input/Output Specifications (TDP Schema)
Define the following strict TypeScript interfaces inside `/src/features/scheduling/types.ts` [180]. Adhere to clean naming conventions by using descriptive, full-word identifiers (do not encode types like 'nameString' or 'ShiftBlockArray') [115]:

```typescript
export type ServiceType = 'Plumbing' | 'HVAC' | 'Electrical' | 'Drains' | 'Roofing';

export interface ShiftBlock {
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" (e.g., "08:00")
  endTime: string;   // "HH:MM" (e.g., "17:00")
  breaks: TimeRange[];
}

export interface TimeRange {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface Technician {
  id: string;
  name: string;
  skills: ServiceType[];
  shifts: ShiftBlock[];
}

export interface Booking {
  id: string;
  customerName: string;
  serviceType: ServiceType;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  technicianId: string | null; // Null indicates "unassigned"
}
```

Validate all runtime input boundaries (such as parsing incoming booking data) using Zod schema validators rather than blindly casting inputs [99].

### Preconditions & Guardrails (ICPC '26)
- **Sample Target Date**: Lock your initial mock data and validation cases strictly to **Monday, August 24, 2026** to ensure deterministic testing and visual validation.
- **Seeded Technicians**:
  - Initialize the in-memory store with at least 4 technicians with overlapping and distinct schedules and skills:
    1. **Dave**: Skills: ['HVAC', 'Electrical']. Shift: 08:00–17:00, Break: 12:00–13:00.
    2. **Janet**: Skills: ['Plumbing', 'Drains']. Shift: 08:00–17:00, Break: 12:00–13:00.
    3. **Bob**: Skills: ['HVAC']. Shift: 08:00–17:00, Break: 13:00–14:00.
    4. **Alice**: Skills: ['Roofing']. Shift: 09:00–15:00, Break: 12:00–12:30.
- **Seeded Bookings** (Initialize 5 pre-scheduled bookings on 2026-08-24):
  - 10:00–11:00: HVAC for John (Assigned to Dave)
  - 11:00–12:00: Plumbing for Mary (Assigned to Janet)
  - 14:00–15:00: HVAC for Frank (Assigned to Bob)
  - 14:00–15:00: HVAC for Arthur (Unassigned) -> *Reserves remaining HVAC capacity on Monday at 2:00 PM!*
  - 15:00–16:00: Plumbing for Helen (Unassigned) -> *Reserves Plumbing capacity on Monday at 3:00 PM!*
- The state engine must support CRUD actions for technicians, shifts, and bookings [182].
- Implement an efficient in-memory pre-indexing layer. Rather than iterating over arrays repeatedly, store bookings by `date` as a hash map lookup key `Map<string, Booking[]>` to avoid nested $O(N^2)$ scheduling loops [102, 182].
- Ban double-casting (`as unknown as`) and known-value widening; use the `satisfies` operator for specific initialization objects [99].

Develop this clean state layer inside `/src/features/scheduling/` now. Show me your plan first, then build the file [101, 102].
```

---

### Phase 2: Screen 1 — Settings (Technician Shifts & Skills)
**Goal:** Build a functional, beautiful admin page using progressive disclosure to view, add, and edit technician details, shifts, and certifications [218].

```markdown
### Role & Goal Definition
You are a Senior UI/UX Engineer. Create a high-fidelity, interactive **Technician Shifts & Settings Screen** using React, Tailwind CSS, and Lucide Icons [44].

### Information Architecture & Layout (Anti-Frankenstein)
- **The Main Screen (List Layout)**: Display a clean grid or list of the 4 seeded technicians. Each technician's card must highlight their name, their active skills (rendered as distinct, semantic badge colors), and their active working hours for Monday.
- **Progressive Disclosure (Side Drawer)**: To prevent form-field bloat from cluttering the roster list, do NOT render the edit form inline [218]. Selecting a technician must trigger a beautiful **Slide-out Side Drawer** (or a Material-style Bottom Sheet with a 28dp top corner radius) [93, 94, 216].
- **Inside the Drawer Form**: Provide:
  - Form fields with linked, accessible `<label>` attributes [100].
  - Checkbox group for selecting certifications (Plumbing, HVAC, Electrical, Drains, Roofing).
  - A clean toggle row for each day of the week ("Working" vs "Off"). If "Working" is active, reveal input fields for Start Time, End Time, and an option list to add multiple "Break" blocks (Time Ranges) using conditional fields [218, 228].

### Deterministic Validation & Preconditions (ICPC '26)
- Ensure start times cannot be after end times. If invalid, display a clear, accessible inline validation error.
- Breaks must fall strictly within the shift's start and end times. If a break is placed outside, show an explicit error message: "Break times must be within the scheduled shift."
- Web Accessibility compliance is mandatory: Every form input must have a visible or screen-reader-accessible `<label>`, and all icons/SVGs must contain alt text or `aria-hidden` attributes [100].

### Performance & Architectural Rules (Anti-Slop)
- Colocate all component assets within `/src/features/scheduling/components/TechnicianSettings.tsx` to maintain high locality [101].
- ZERO DOM Duplication: Manage both mobile and desktop layouts through fluid CSS / Tailwind flex and grid layouts. Do not duplicate HTML structures for responsive views [100].
- Drawer state must be tightly scoped locally to prevent unnecessary re-renders of the technician list [100].
- Follow the Stepdown Rule: Place your main orchestrator component at the top, and sub-components or form helpers below [118].
- Comments must only explain intent and "why" rather than repeating what the code does [119]. Do not leave zombie code [119].

Build this component now.
```

---

### Phase 3: Screen 2 — Calendar (Dispatcher Dashboard)
**Goal:** Create an internal scheduler view that gives dispatchers visual cues about technician capacity, overlaps, and unassigned work queue alerts.

```markdown
### Role & Goal Definition
You are an expert Frontend Engineer. Build the **Dispatcher Calendar Dashboard Screen** to manage daily schedules and technician capacity [44].

### Requirements, Layout & Progressive Disclosure (Anti-Frankenstein)
1. **Above-the-Fold Prioritization**: At the top of the tab, display an active summary header:
   - Chronological Day Picker (locked to Monday, August 24, 2026 by default).
   - An **Active Capacity Summary Banner** showing: Total Working Technicians, Active Booked Hours, and a prominent counter for "Unassigned Jobs in Queue" to surface exceptions early [119, 224, 225].
2. **Technician Timelines Grid (X-axis Time, Y-axis Roster)**:
   - Create a clean visual grid representing hour blocks from 08:00 to 18:00.
   - For each technician row, color-code blocks strictly based on a **Functional Color System** [116]:
     - *Active Shift Hours*: Clear white/light grey cells with grid lines.
     - *Break Blocks*: Hashed or muted red background labeled "Break" [115].
     - *Scheduled Bookings*: Color-coded blocks spanning the appointment duration (e.g., Dave has HVAC from 10:00-11:00 as a solid blue block; Janet has Plumbing from 11:00-12:00 as a solid green block).
     - **Accessibility Fallback**: Every booked block must display a clear text label (e.g., "10:00 - 11:00: HVAC (John)") and a service icon so color is not the only source of meaning [118].
3. **Popover vs. Tooltip Boundaries**:
   - **Hover state**: Hovering over a scheduled booking block must trigger a *passive, text-only Tooltip* under 1 sentence showing client details and assigned service [165, 206].
   - **Click state**: Clicking a booking block or an open capacity slot must NOT open a hover tooltip [212]. It must trigger a **Modal Dialog or Side Sheet** allowing the dispatcher to reassign the job to another technician or edit booking details [213, 216].
4. **Dispatcher Quick-Filters**:
   - Filter dropdown by service type (Plumbing, HVAC, Electrical, Drains, Roofing) to instantly narrow rows to certified technicians [119].

### Assertive Logic & Edge Cases (ICPC '26)
- If a technician is booked during their break or outside their shift, flag this block with a bright red warning outline labeled "Scheduling Conflict: Break/Shift Overlap" [83, 87].
- Provide a dedicated right sidebar or bottom shelf for the **"Unassigned Jobs Queue"** showing our two seeded unassigned jobs on Monday (Arthur's HVAC and Helen's Plumbing). Each item must have a quick-click button to "Assign" which opens the assignments side sheet.

### Performance Rules (Anti-Slop)
- Reject O(N²) Operations: Use your pre-indexed State Hash Map lookup (`Map<string, Booking[]>`) to render appointments efficiently instead of performing nested array scans [102].
- ZERO DOM Duplication: Ensure the layout uses a responsive CSS Grid that functions beautifully on mobile devices and desktop screens without duplicating markup [100].
- Place this layout inside `/src/features/scheduling/components/DispatcherCalendar.tsx` [101].

Implement this dashboard now.
```

---

### Phase 4: Screen 3 — Auditable Customer Booking Page
**Goal:** Build the customer-facing interface featuring progressive disclosure, deterministic scheduling, and plain-English audit trails [180].

```markdown
### Role & Goal Definition
You are a Principal Software Engineer. Build the customer-facing **Booking Page** component. This component houses the core algorithmic scheduler that computes open times and explains slot states in plain language [44, 180].

### Progressive Disclosure (Layout Design)
1. **Interactive Controls**: Let the customer select a Service Type (select dropdown, default to HVAC) and a Date (locked to Monday, August 24, 2026).
2. **Conditional Form Flow (Progressive Enabling)**: Include a toggle: "Advanced: Show Certified Technicians". Only when toggled "on" should the interface reveal which specific technicians are scheduled and their working statuses, preventing initial cognitive overload [218, 228, 229].

### Core Algorithmic Logic (SCoT Structure)
Before writing code, draft your Structured Chain-of-Thought reasoning. Generate the Input-Output (IO) structure first, and then map out the sequential, branch, and loop steps for your slot availability check [50, 51].

#### 1. Input-Output (IO) Structure [51]:
- Inputs:
  - Selected Date: string ("YYYY-MM-DD")
  - Selected Service Type: ServiceType (defaulting to "HVAC")
  - Appointment Duration: 60-minute blocks, starting on the hour (08:00 to 17:00).
- Output:
  - An array of slot objects containing: `{ time: string, status: 'Available' | 'Unavailable', auditExplanation: string }` representing the next 5 chronological slots.

#### 2. The Calculation Loop (Structured Logic) [50, 57]:
- **Sequence**:
  - Filter the active roster to find technicians certified in the selected Service Type.
  - Iterate through hourly slots from 08:00 to 17:00 on the selected date.
- **Branch (Logical Checks)**:
  - If no certified technicians are scheduled to work on this day: mark the slot as **Unavailable** with an audit explanation.
  - Else, for each hourly slot:
    - Check if any scheduled certified technician has an active shift during this hour.
    - Check if this hour overlaps with that technician's breaks.
    - Check if the technician already has an assigned booking overlapping this block.
    - Check if there are any *unassigned* bookings for this service type on this date that consume collective technician capacity (e.g., if Dave and Bob are our only HVAC techs, and one slot is assigned and one is unassigned, our total HVAC slot capacity at that hour is 0).
    - If a certified technician has an active shift, is not on break, and has no assigned or unassigned overlaps, mark the slot as **Available**.
    - Otherwise, mark the slot as **Unavailable** and compile the specific reason.

### Output & plain-English Audit Explanations (TDP Specifications)
The booking page must show the next 5 chronological slots [132]. If a slot is selectable, show an "Available" indicator. If a slot is blocked, it must remain visible but disabled, accompanied by an explicit, plain-English **Audit Explanation (Situated Microcopy)** detailing *exactly* why it is unavailable [70, 132]:
- *Overlapping booking*: "Monday 10:00 AM is not available because our only HVAC-certified technician (Dave) is already booked." [180]
- *Outside working hours*: "Monday 5:00 PM is not available because it is outside the working hours of our HVAC-certified technicians." [180]
- *Break overlap*: "Monday 12:00 PM is not available because all certified technicians are currently on their scheduled lunch breaks." [180]
- *Capacity held by Unassigned job*: "Monday 2:00 PM is not available because our remaining certified technicians are reserved for an unassigned HVAC job." [180]

Avoid ambiguous checks (do not use "otherwise" referring to secondary conditions; explain both conditions explicitly in the logic) [83, 85].

### UI Layout & Architectural Hygiene
- Render the slots in a clean, vertical card list. Display the plain-language audit explanation directly inline below each disabled slot so customers understand why they cannot click it [130, 146].
- Colocate the UI inside `/src/features/scheduling/components/CustomerBooking.tsx` [101].
- Enforce Zero DOM Duplication (do not duplicate HTML elements for mobile rendering) [100] and ensure 100% accessible forms (every select/input must have linked labels) [100].

Develop this algorithmic and UI component. First, output your SCoT specification, then implement the file.
```

---

### Phase 5: Part II — Unassigned Jobs Capacity Logic
**Goal:** Refine the State Engine and integrate "unassigned appointments" into your scheduler's mathematical formulas [180].

```markdown
### Role & Goal Definition
You are a Principal Backend and Systems Engineer. Implement the business logic for **Unassigned Jobs** to ensure they accurately reserve company capacity [44, 180].

### Domain Rules (Capacity Specifications)
Let's define the exact capacity mechanics for unassigned appointments:
1. **Capacity Reduction Rule**: An unassigned appointment *must* hold capacity from the collective pool of qualified technicians.
   - *Example*: If we have 2 HVAC-certified technicians working at 10:00 AM (Dave and Janet), and there is 1 assigned HVAC booking (Dave) and 1 unassigned HVAC booking, our total HVAC capacity for 10:00 AM is 0. Janet's capacity is held by the unassigned HVAC job, even though it hasn't been officially assigned to her name yet [180].
2. **Plain-English Audit Update**:
   - If a customer tries to book a slot that is consumed by an unassigned job, the audit explanation must state: "This slot is unavailable because our remaining certified technicians are reserved for an unassigned HVAC job."
3. **Dispatcher Warning System**:
   - On Screen 2 (Dispatcher Calendar), display a dedicated sidebar or banner for **"Unassigned Jobs Queue"** [180].
   - **Conflict Detection Warning**: If the number of unassigned jobs for a given day and skill exceeds the remaining open capacity of the working certified technicians, display a highly visible warning banner:
     - *Warning*: "⚠️ Capacity Alert: You have [X] unassigned HVAC jobs on [Date] but only [Y] available hours among working HVAC technicians. Some jobs may go unfulfilled."

### Implementation Request
Refactor your core scheduling state and hooks (such as the React Context or custom `useScheduler` hook) to incorporate these unassigned capacity rules. Then, update both `DispatcherCalendar.tsx` (to show capacity alerts and warnings) and `CustomerBooking.tsx` (to reflect held capacity and updated auditable descriptions).

### Code Quality Rules
- Adhere to meaningful naming conventions and modularity (Single-Responsibility Principle) [115, 118].
- The code must be clean, highly optimized, and maintain O(1) scheduling performance via index lookups [102, 115].
- Avoid leaving zombie comments or old commented-out function blocks in your refactored code [119].

First explain the mathematical logic of your capacity checker, then implement the updates.
```

---

### Phase 6: Part III — AI assistant Dispatcher Command Bar (Natural Language)
**Goal:** Build the natural language command parsing bar featuring explain-back loops and mutual verification to modify state safely [131, 140, 180].

```markdown
### Role & Goal Definition
You are an expert AI Systems and Interface Developer. Build an interactive **AI Assistant Dispatcher Command Bar** using a deterministic, rule-based parser (or mock LLM adapter) to modify the scheduling state from natural language inputs [44, 180].

### Requirements, NLP Commands & Explain-Back Loops
Add a conversational input bar at the top of the Dispatcher Dashboard. When the user types a command, parse it and trigger a **Mutual Verification & Explain-Back Card** [131, 140]:
1. **Explain-Back Loop (No Silent Mutations)**:
   - When a dispatcher enters a command, do NOT mutate the state immediately [131, 140].
   - Generate a temporary **"Success Intent Handoff Card"** directly below the command bar [140]:
     - *Rephrased Intent*: Translate the parsed command into a clean, human statement: *"I understood you want to mark Dave as unavailable on Tuesdays for the next 4 weeks. Did I get this right?"* [137, 141]
     - *Why? (Show reasoning path)*: An expandable accordion card that reveals the exact system changes to be made (e.g., "Shift updates: Dave's Tuesdays on 2026-08-25, 2026-09-01, 2026-09-08, and 2026-09-15 set to Off.") [135].
     - *Action Triggers*: Render two physical, accessible buttons: **"Confirm Change"** and **"Cancel/Undo"** [2, 140].

2. **Supported Command Examples**:
   - *"Dave is out on Tuesdays for the next month"* -> Parses to identify Technician: "Dave", Day: "Tuesday", Action: "Mark as unavailable", Range: "Next 4 weeks".
   - *"Janet finished her plumbing certification"* -> Parses to identify Technician: "Janet", Action: "Add Skill", Skill: "Plumbing".
   - *"Schedule HVAC for Bob at 2:00 PM on Monday"* -> Parses to identify Action: "Create Booking", Customer: "Bob", Service: "HVAC", Time: "14:00 - 15:00", Date: "Next Monday's date".

3. **Handling Underspecified & Invalid Asks (ICPC '26 Exceptions)**:
   - If the request is **underspecified** (e.g., *"Mark Dave as out"* without specifying which day or date range), the assistant must output a helpful clarifying card:
     - *"I can mark Dave as out, but I need a bit more info: which day or date range will he be unavailable?"* Provide quick-click suggestion chips (e.g., "Today", "Tomorrow", "Select Date") [180].
   - If the request is **impossible or invalid** (e.g., *"Schedule HVAC for Bob at 2:00 PM on Monday"* but all HVAC technicians are fully booked/on break), reject the request and display a detailed explanation card:
     - *"Cannot schedule HVAC for Bob on Monday at 2:00 PM. Reason: No HVAC-certified technicians are available at that time (Dave is booked, Janet is on break)."* [180]

### Implementation Request
Build this natural language parser component in `/src/features/scheduling/components/AssistantCommandBar.tsx` [101]. Start by implementing a robust regex-based or keyword-matching heuristic parser to handle the specified examples deterministically. Ensure all state transitions are reflected immediately in your settings and calendar screens.

Ensure Zero DOM Duplication (rely strictly on Tailwind CSS flex/grid controls for responsive views) [100] and keep all sub-components or functions organized according to the Stepdown Rule [118]. All functions must adhere to the Single-Responsibility Principle [118].
```

---

# Part V: Token Economy, Chat Hygiene & Developer Workflow Guide

To save tokens and prevent context rot during your app-building session, adhere to these four core rules [107, 108]:

1. **The Context Reset Habit (/clear)** [107, 108]:
   * Whenever you complete a Phase (such as establishing data models in Phase 1) and are ready to move to the next, type `/clear` (or click reset) to wipe the chat history clean. This resets your compounding token cost back to zero [107].
2. **The Handoff Summary Protocol** [107]:
   * Before clearing the chat, instruct the AI: *"Generate a clean architectural 'handoff' summary of our active state, completed features, database schemas, and state decisions."* [107]
   * Clear the chat, paste that handoff summary as the context for the next prompt, and continue. This stops redundant chat arguments from inflating your billing cost [107].
3. **Edit Your Mistakes Directly** [107]:
   * If the AI writes bug-ridden code, do not reply with follow-up corrections like *"No, that is wrong, fix it."* Follow-up messages stack onto the context window permanently, increasing the cost of every turn [107].
   * Instead, click **Edit** on your original prompt, refine your requirements, and regenerate the response [107].
4. **Surgical File Referencing** [108]:
   * Do not pass vague requests like *"fix the calendar."* Point the AI directly to target files using explicit naming tags or paths (e.g., `@DispatcherCalendar.tsx` or `/src/features/scheduling/types.ts`) [108].
