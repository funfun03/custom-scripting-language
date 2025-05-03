# Custom Scripting Language

This project implements a simple scripting language interpreter in TypeScript, featuring:

- Lexer
- Parser (Recursive Descent and LL(1))
- AST representation
- Interpreter

## Project Structure

The project is organized into episodes (folders) representing different stages of language development:

- `ep01-lexer`: Tokenization
- `ep02-ast-types`: AST structure definitions
- `ep03-parser`: Basic recursive descent parser
- `ep04-interpreter`: Basic interpreter
- `ep05-environments`: Variable environments
- `ep06-declarations`: Variable declarations
- `ep07-assignment-expr`: Assignment expressions
- `ep08-object-literals`: Object literals
- `ep09-call-obj-member-expr`: Function calls and object member access
- `ep10-native-functions`: Built-in functions
- `ep11-user-defined-functions`: User-defined functions

## Language Features

The language supports:
- Variable declarations (`let`, `const`)
- User-defined functions
- Control flow statements (`if-else`, `while`, `for`)
- Basic data types (numbers, strings, arrays, objects)
- Function calls
- Object and array access
- Arithmetic and comparison operations

## Running the Interpreter

Use Deno to run the interpreter:

```
deno run --allow-read main.ts
```

This will execute the code in `test2.txt` by default.

## Parser Implementations

This project includes multiple parser implementations:

### 1. Recursive Descent Parser

- Traditional hand-written parser
- Top-down approach using mutually recursive functions
- Each function corresponds to a grammar production
- Default parser used in the project

### 2. Basic LL Parser

- Simple LL(1) parser implementation
- Grammar defined in `frontend/ll_parser/grammar_utils.ts`
- Parse table construction in `frontend/ll_parser/parse_table.ts`
- Parser implementation in `frontend/ll_parser/ll_parser.ts`

### 3. Enhanced LL Parser (Experimental)

- More comprehensive LL(1) parser implementation
- FIRST and FOLLOW set calculation
- Better error reporting
- Parse tree to AST conversion
- Currently has grammar conflicts that need resolution

## Development Status

See `LL_PARSER_REPORT.md` for a detailed report on the LL parser implementation and future work. 