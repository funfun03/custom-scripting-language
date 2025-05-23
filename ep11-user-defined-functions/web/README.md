# Custom Scripting Language Web Interface

This web interface allows you to interact with the custom scripting language and compare different parsing algorithms.

## Running the Web Interface

### Option 1: Using the run.bat script (Windows)

Simply double-click the `run.bat` file in the `web` directory, or run it from the command line:
```
cd ep11-user-defined-functions\web
run.bat
```

### Option 2: Manual execution

1. Make sure you have Deno installed on your system. If not, you can install it from [https://deno.land/](https://deno.land/).

2. Navigate to the project directory and run the server:
   ```
   cd ep11-user-defined-functions
   deno run --allow-net --allow-read --allow-env --allow-write web/server.js
   ```

3. Open your browser and go to [http://localhost:8000](http://localhost:8000)

## Features

- **Code Editor**: Write your code in the editor window
- **Parser Selection**: Choose between Recursive Descent Parser and LL(1) Parser
- **Sample Code**: Load predefined examples to see how the language works
- **AST Viewer**: See the Abstract Syntax Tree generated by the parser
- **Output Display**: View the execution results and any console output

## Supported Language Features

The language supports:

- Variable declarations and assignments
- Arithmetic operations
- Function calls (including the built-in `print` function)
- Control flow statements (if/else)

### Examples

#### Simple Expression
```
// Simple expression
5 + 10;

// Variable assignment
x = 20;

// Expression with variable
x + 15;
```

#### Print Statement
```
// Print statement examples
print(42);
print("Hello, world!");
print(5 + 10);

// Variable with print
x = 100;
print(x);
print(x * 2);
```

#### If Statement
```
// If statement example
if (8 > 0) {
    print("True")
} else {
    print("False")
}
```

## Note on Parser Limitations

The LL(1) parser has limited support for some language features compared to the Recursive Descent parser. It mainly supports:

- Basic arithmetic expressions
- Variable assignments
- Print statements

More complex constructs like if-statements are currently only fully supported by the Recursive Descent parser. 