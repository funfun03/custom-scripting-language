import { TokenType } from "../lexer.ts";

export type Terminal = string;
export type NonTerminal = string;
export type Symbol = Terminal | NonTerminal;
export const EPSILON = "ε";
export const END_MARKER = "$";

export interface Production {
  lhs: NonTerminal;
  rhs: Symbol[];
}

export interface Grammar {
  terminals: Set<Terminal>;
  nonTerminals: Set<NonTerminal>;
  productions: Production[];
  startSymbol: NonTerminal;
}

export const grammar: Grammar = {
  terminals: new Set([
    "let", "const", "identifier", "=", ";", "(", ")", "{", "}", "[", "]",
    ",", ":", ".", "number", "string", "fn", "if", "else", "while", "for",
    "return", "break", "continue", END_MARKER
  ]),
  nonTerminals: new Set([
    "Program", "Stmt", "VarDeclaration", "FunctionDeclaration", "IfStatement",
    "WhileStatement", "ForStatement", "ReturnStatement", "BreakStatement",
    "ContinueStatement", "Expr", "Block"
  ]),
  productions: [
    // Program
    { lhs: "Program", rhs: ["Stmt", "Program"] },
    { lhs: "Program", rhs: [EPSILON] },
    
    // Statements
    { lhs: "Stmt", rhs: ["VarDeclaration"] },
    { lhs: "Stmt", rhs: ["FunctionDeclaration"] },
    { lhs: "Stmt", rhs: ["IfStatement"] },
    { lhs: "Stmt", rhs: ["WhileStatement"] },
    { lhs: "Stmt", rhs: ["ForStatement"] },
    { lhs: "Stmt", rhs: ["ReturnStatement"] },
    { lhs: "Stmt", rhs: ["BreakStatement"] },
    { lhs: "Stmt", rhs: ["ContinueStatement"] },
    { lhs: "Stmt", rhs: ["Expr", ";"] },
    
    // Variable Declaration
    { lhs: "VarDeclaration", rhs: ["let", "identifier", "=", "Expr", ";"] },
    { lhs: "VarDeclaration", rhs: ["const", "identifier", "=", "Expr", ";"] },
    
    // Function Declaration
    { lhs: "FunctionDeclaration", rhs: ["fn", "identifier", "(", ")", "{", "Block", "}"] },
    
    // If Statement
    { lhs: "IfStatement", rhs: ["if", "(", "Expr", ")", "{", "Block", "}"] },
    { lhs: "IfStatement", rhs: ["if", "(", "Expr", ")", "{", "Block", "}", "else", "{", "Block", "}"] },
    
    // While Statement
    { lhs: "WhileStatement", rhs: ["while", "(", "Expr", ")", "{", "Block", "}"] },
    
    // For Statement
    { lhs: "ForStatement", rhs: ["for", "(", "VarDeclaration", "Expr", ";", "Expr", ")", "{", "Block", "}"] },
    
    // Return Statement
    { lhs: "ReturnStatement", rhs: ["return", "Expr", ";"] },
    
    // Break Statement
    { lhs: "BreakStatement", rhs: ["break", ";"] },
    
    // Continue Statement
    { lhs: "ContinueStatement", rhs: ["continue", ";"] },
    
    // Block
    { lhs: "Block", rhs: ["Stmt", "Block"] },
    { lhs: "Block", rhs: [EPSILON] },
    
    // Expressions
    { lhs: "Expr", rhs: ["identifier"] },
    { lhs: "Expr", rhs: ["number"] },
    { lhs: "Expr", rhs: ["string"] },
    { lhs: "Expr", rhs: ["(", "Expr", ")"] },
    { lhs: "Expr", rhs: ["Expr", "+", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "-", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "*", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "/", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "%", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "==", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "!=", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", ">", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "<", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", ">=", "Expr"] },
    { lhs: "Expr", rhs: ["Expr", "<=", "Expr"] }
  ],
  startSymbol: "Program"
}; 