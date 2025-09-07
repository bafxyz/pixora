## Context

Parse $ARGUMENTS to get the following values:

- [name]: Component name from $ARGUMENTS, converted to PascalCase
- [summary]: Component summary from $ARGUMENTS

## Task

Make a UI component according to the [name] and [summary] provided, following these guidelines:

- Create the component file in `packages/ui/src/[name]/[index].tsx` following project standards.
- Use a functional component with the name [name]
- Reference the [summary] when making the component
