# **<mark>1. Naming Conventions & Meaningful Identifiers</mark>** 

<mark>Choosing clear, descriptive names is the single most repeatable guideline for writing clear code.</mark> 

- <mark>Reveal Purpose, Avoid Abbreviations: Use meaningful, full-word identifier names that reveal intent rather than terse letters or short abbreviations. Informative names serve as lightweight, built-in documentation.</mark> 

- <mark>Use Parts of Speech Properly: Style guides generally recommend using verbs for</mark> functions (e.g., <mark>comparePlantGrowth )</mark> and nouns for objects (e.g., <mark>plantGrowth )</mark> . Multi-item objects should be pluralized. 

- <mark>Do Not Encode Types: Avoid adding suffixes or prefixes that encode the</mark> variable’s data type into its name (e.g., naming a variable <mark>nameString</mark> or adding <mark>Hungarian-like notation). Doing so adds extraneous cognitive load to the reader.</mark> 

- <mark>Keep Surprises Minimal: Rich, surprising names are appropriate only when they highlight unusual functionality; routine variables should use standard, predictable naming conventions.</mark> 

# **<mark>2. Control Flow & Simple Logic</mark>** 

<mark>Keeping the path of execution simple directly reduces reading time and increases confidence in understanding.</mark> 

- <mark>Minimize Nesting: Deeply nested blocks (such as several nested loops or if-else statements) drastically increase structural complexity and reading difficulty.</mark> 

- <mark>Simplify Conditions: Simplify complex Boolean expressions and if-conditions. For-loops are often structurally harder to follow than streamlined conditional paths, and long-loop conditions should be simplified.</mark> 

- <mark>Structure Over Complexity: Readability declines quickly when nested blocks multiply. If a block contains nested if statements inside nested try blocks, extract the nested operations into separate functions to flatten and clarify the code.</mark> 

# **<mark>3. Formatting, Whitespace, & Layout</mark>** 

<mark>Consistent formatting acts as a crucial visual aid, helping developers delimit and mentally parse code elements.</mark> 

- Adhere to Team Conventions: The specific formatting style (like <mark>snake_case</mark> vs. <mark>camelCase )</mark> is less important than strict consistency. The best style guide is <mark>always the one shared and agreed upon by your team.</mark> 

- <mark>Enforce Line Limits: Keep the horizontal length of lines restricted—commonly between 80 and 120 characters. Break lines after returns or function arguments if they exceed this limit.</mark> 

- <mark>Leverage Whitespace Strategicially: Vertical and horizontal spacing should be used to indicate relatedness. Add horizontal spacing around operators, objects, and arguments. Use vertical empty lines to separate unrelated chunks (acting like paragraphs in written text) and group related statements together.</mark> 

<mark>● Maintain Logical Ordering: Present code in a clear linear flow. List dependencies at the top before the code that uses them, following a formulaic approach: (1) libraries/packages, (2) user-defined functions, (3) loading data, (4) data management, and (5) analysis.</mark> 

# **<mark>4. Modularity, Abstraction, & Modifying Code</mark>** 

<mark>High quality code is clean "by construction," which requires appropriate code structure and division.</mark> 

<mark>● Single-Responsibility Principle: A function or method should do exactly one thing and do it well. Wrapping too many tasks into one large method introduces unnecessary complexity.</mark> 

- <mark>DRY (Do Not Repeat Yourself): Avoid code duplication by extracting repetitive operations into dedicated, reusable functions.</mark> 

- <mark>The Stepdown Rule: Organize your code hierarchically. High-level functions should be run first, with lower-level detail functions executed further down. This makes the main narrative of the script easily visible to readers before they dig into lower-level details.</mark> 

# **<mark>5. Intentional Documentation</mark>** 

<mark>While documentation is a critical element of code quality, over-commenting can easily degrade into a distraction.</mark> 

- <mark>Comment Selectively: Write comments to explain intent, rationale, or non-obvious behavior rather than merely translating a line of self-explanatory code into natural language.</mark> 

- <mark>Prefer Code Over Comments: Restructure code and use clear variable and function names rather than relying on comments to make confusing code understandable.</mark> 

- <mark>Kill Zombie Code: Do not leave commented-out code in active files. Outdated comments and zombie code lines clutter the script, distracting the reader and creating confusion.</mark> 

# **<mark>6. Development & Refactoring Habits</mark>** 

<mark>Clear code is a continuous, evolving target that must be managed intentionally throughout the lifecycle of a software project.</mark> 

- <mark>Write Clean from the Start: Never write messy code with the assumption that you will "fix it later". Unreadable code rarely improves on its own during software evolution; instead, it hardens into technical debt.</mark> 

- <mark>Keep Changes Small and Incremental: Prefer small, consistent commits. Large, complex code changes are major contributors to readability erosion and are highly prone to introducing defects.</mark> 

<mark>● Refactor Constantly: Practice "floss refactoring"—interleaving small, opportunistic design improvements with regular development activities to continuously keep code maintainable and clear.</mark> 

