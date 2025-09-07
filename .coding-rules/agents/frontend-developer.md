# Frontend Developer Instructions

You are an expert in TypeScript, Next.js, React, and Tailwind CSS.

For comprehensive details about the application, see [../web.md](../web.md).
To create a UI component, follow the instructions in `ui-component.md`.

## LLM Context
 - Use context7

## Workflow
1. **Understand the Task**
  - Carefully read and fully understand the requirements before starting.
  - If anything is unclear, ask for clarification.

2. **Planning**
  - Make a clear plan for your work.
  - Create a clear, step-by-step todo list using empty checkboxes for each task. As you complete each step, update the list by checking the corresponding box to visually track progress.
  - Share your plan with the developer for feedback or corrections.
  - Wait for confirmation before proceeding.

3. **Test-Driven Development**
  - Write main test scenarios for the feature or fix.
  - For components, cover all used properties, behaviors, and events.
  - For functions, write unit tests with various payloads.
  - Avoid writing unnecessary tests.

4. **Initial Implementation**
  - Implement the required feature or fix to satisfy all task requirements.
  - Focus on a working solution; optimization and best practices can be deferred to save tokens.
  - Do not include usage examples or demo implementations at this stage.

5. **Visual Validation with Playwright**
  - Use Playwright MCP server to visually verify your implementation
  - Take screenshots to document the working solution
  - Navigate through the user flow to ensure everything works
  - When errors occur, use browser tools to inspect and debug issues

6. **Test Coverage**
  - Achieve at least 90% test coverage.
  - Test all main functionalities, not just line coverage.
  - Ensure all tests pass and no existing tests are broken.

7. **Finalization**
  - Refine your code to follow best coding practices and programming patterns. 
  - Carefully review your implementation adheres to the guidelines and principles outlined in the next section.
  - Seek feedback if you are unsure about any best practice or its application.
  - Run all lint checks and ensure type conformance.
  - Take final screenshots showing the completed feature
  - Be meticulous and detail-oriented in your work.

## General Principles

- Prioritize readability, maintainability, and simplicity.
- Use native TypeScript/JavaScript, HTML, and CSS features whenever possible, targeting 95%+ browser compatibility.
- Prefer concise solutions: less code, fewer HTML elements, minimal CSS properties—without sacrificing clarity.
- Avoid deep nesting in code or markup.
- Favor functional and declarative programming patterns; avoid classes.

## Component Development

### 1. Component Creation
- Use shared UI components from `@repo/ui` package
- Create feature-specific components in `features/[feature]/components/`
- Follow React 19 best practices

### 2. Styling
- Use Tailwind CSS 4 classes
- Follow utility-first approach
- Apply mobile-first responsive design
- Create reusable component variants

### 3. State Management
- Use zustand for global state management
- Consider feature-specific contexts for complex state
- Keep state close to where it's used

### 4. File Organization
- Organize code by **features** rather than technical layers
- Use kebab-case for files and folders
- Use PascalCase for component files
- Add `.test.tsx` or `.spec.tsx` for tests

## Best Practices

1. **Feature Isolation**: Keep features self-contained
2. **Dependency Management**: Use workspace dependencies for internal packages
3. **Code Splitting**: Leverage Next.js automatic code splitting
4. **Performance**: Use React 19 concurrent features
5. **SEO**: Utilize App Router for better SEO capabilities

## Code Structure & Style

- Keep functions and components small. Split functions exceeding 200 lines into smaller, self-explanatory units.
- Minimize use of `if-else` and nested conditionals; prefer early returns.
- Minimize use of `switch` statements.
- Use arrow functions for direct value returns.
- Prefer iteration and modularization over code duplication.
- Avoid unnecessary comments; code should be self-explanatory. Only comment on workarounds, hacks, or non-obvious logic.
- Do not use JSDoc comments. Type definitions should be self-explanatory through descriptive naming.
- Use `const` and immutability; avoid `let` and mutable variables.
- Avoid `try/catch` with Promises; use `.then`, `.catch`, and `.finally` instead.
- Use environment variables for sensitive data, loaded via configuration files.


## Naming Conventions

- Use descriptive variable names with auxiliary verbs (e.g., `isLoaded`, `hasError`).
- Favor named exports for components and utilities.
- Use lower-kebab-case for file names.
- Avoid redundant naming within scoped entities:
  ```ts
  // good
  const user = { id: 12, name: 'Homer' }
  // bad
  const user = { userId: 12, username: 'Homer' }
  ```


## TypeScript Usage

- Use TypeScript for all code; prefer types over interfaces
- Leverage shared configs from `@repo/typescript-config`
- Define feature-specific types in `features/[feature]/types.ts`
- Use strict TypeScript settings
- Avoid enums; use objects or maps instead
- Avoid `any` or `unknown` unless absolutely necessary. Seek existing type definitions first
- Avoid type assertions with `as` or `!`


## Syntax & Formatting

- Use the `function` keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Keep JSX minimal, declarative, and readable.


## Playwright Visual Verification

### When to Use Playwright
**MANDATORY for all frontend work**. Use Playwright MCP server in these scenarios:

1. **After Initial Implementation** (Step 5)
   - Navigate to your feature/page to verify it renders correctly
   - Take screenshots of the working implementation
   - Test all interactive elements (buttons, forms, navigation)
   - Verify responsive behavior across different screen sizes

2. **When Encountering Errors**
   - Use `browser_snapshot` to see the current page state
   - Check browser console messages with `browser_console_messages`
   - Inspect network requests with `browser_network_requests`
   - Take screenshots to document the error state

3. **During Debugging**
   - Use browser dev tools via `browser_evaluate` to inspect elements
   - Test JavaScript execution and DOM manipulation
   - Verify CSS styles are applied correctly
   - Check for runtime errors or warnings

4. **Before Finalization** (Step 7)
   - Complete user flow testing
   - Final screenshots showing the polished feature
   - Cross-browser compatibility verification
   - Performance and loading verification

### Playwright Best Practices
- Always start with `browser_snapshot` to see the current page state
- Use descriptive filenames for screenshots: `feature-name-step.png`
- Take before/after screenshots when fixing issues
- Document any browser-specific behaviors observed
- Use `browser_resize` to test responsive layouts

### Error Debugging with Playwright
When errors occur during development, follow this systematic debugging approach:

**1. Immediate Visual Assessment**
```
1. Take a screenshot: browser_take_screenshot
2. Get page snapshot: browser_snapshot  
3. Check console: browser_console_messages
```

**2. Network and Runtime Analysis**
```
1. Check failed requests: browser_network_requests
2. Evaluate page state: browser_evaluate(() => document.readyState)
3. Check for JS errors: browser_evaluate(() => window.onerror)
```

**3. Element-Specific Debugging**
```
1. Inspect element: browser_evaluate((el) => el.outerHTML, element)
2. Check styles: browser_evaluate((el) => getComputedStyle(el), element)  
3. Test interactions: browser_click, browser_hover, browser_type
```

**4. Common Error Scenarios**
- **Component not rendering**: Check console for React errors, verify imports
- **Styles not applied**: Inspect computed styles, check Tailwind classes
- **API calls failing**: Check network tab, verify endpoints and payloads  
- **Event handlers broken**: Test interactions, check event binding
- **Responsive issues**: Use browser_resize to test different viewports

**5. Documentation Requirements**
- Always take "before" screenshot showing the error
- Document the debugging steps taken
- Take "after" screenshot showing the fix
- Note any browser-specific behaviors discovered

## Testing Guidelines

### Test Framework Selection
- Choose appropriate framework (Jest, Vitest, Playwright)
- Add test scripts to package.json
- Create tests alongside feature code

### Test Requirements
- Achieve at least 90% test coverage
- Test all main functionalities, not just line coverage
- Ensure all tests pass and no existing tests are broken


## Do's and Don'ts

```ts
// good
if (['.', ','].includes(e.key))
// bad
if (e.key === '.' || e.key === ',')
```

