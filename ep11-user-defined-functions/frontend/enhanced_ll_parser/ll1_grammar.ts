import { TokenType } from "../lexer.ts";

// Grammar definition types
export type Terminal = string;
export type NonTerminal = string;
export type Symbol = Terminal | NonTerminal;
export const EPSILON = "ε";
export const END_MARKER = "$";

export interface Production {
  id: number;
  lhs: NonTerminal;
  rhs: Symbol[];
}

export interface Grammar {
  terminals: Set<Terminal>;
  nonTerminals: Set<NonTerminal>;
  productions: Production[];
  startSymbol: NonTerminal;
}

// Define terminals from token types
export function tokenTypeToTerminal(type: TokenType): Terminal {
  switch (type) {
    case TokenType.Let: return "let";
    case TokenType.Const: return "const";
    case TokenType.Identifier: return "identifier";
    case TokenType.Equals: return "=";
    case TokenType.Semicolon: return ";";
    case TokenType.OpenParen: return "(";
    case TokenType.CloseParen: return ")";
    case TokenType.OpenBrace: return "{";
    case TokenType.CloseBrace: return "}";
    case TokenType.OpenBracket: return "[";
    case TokenType.CloseBracket: return "]";
    case TokenType.Comma: return ",";
    case TokenType.Colon: return ":";
    case TokenType.Dot: return ".";
    case TokenType.Number: return "number";
    case TokenType.String: return "string";
    case TokenType.Fn: return "fn";
    case TokenType.If: return "if";
    case TokenType.Else: return "else";
    case TokenType.While: return "while";
    case TokenType.For: return "for";
    case TokenType.Return: return "return";
    case TokenType.Break: return "break";
    case TokenType.Continue: return "continue";
    case TokenType.Print: return "print";
    case TokenType.BinaryOperator: return "op";
    case TokenType.EOF: return END_MARKER;
    default: return String(type);
  }
}

// Minimal LL(1) grammar for basic operations
export const ll1Grammar: Grammar = {
  terminals: new Set([
    "identifier", "number", "string", "print", ";", "(", ")", "=", "op", ",", END_MARKER
  ]),
  nonTerminals: new Set([
    "Program", "StmtList", "Stmt", "PrintStmt", "AssignStmt", "ExprStmt",
    "Expr", "Term", "Factor", "ExprTail", "TermTail", "ArgList", "ArgListTail"
  ]),
  productions: [
    // Program structure
    { id: 1, lhs: "Program", rhs: ["StmtList"] },
    { id: 2, lhs: "StmtList", rhs: ["Stmt", "StmtList"] },
    { id: 3, lhs: "StmtList", rhs: [EPSILON] },
    
    // Statement types
    { id: 4, lhs: "Stmt", rhs: ["PrintStmt"] },
    { id: 5, lhs: "Stmt", rhs: ["AssignStmt"] },
    { id: 6, lhs: "Stmt", rhs: ["ExprStmt"] },
    
    // Print statement
    { id: 7, lhs: "PrintStmt", rhs: ["print", "(", "Expr", ")", ";"] },
    
    // Assignment statement
    { id: 8, lhs: "AssignStmt", rhs: ["identifier", "=", "Expr", ";"] },
    
    // Expression statement
    { id: 9, lhs: "ExprStmt", rhs: ["Expr", ";"] },
    
    // Expression grammar (without left recursion)
    { id: 10, lhs: "Expr", rhs: ["Term", "ExprTail"] },
    { id: 11, lhs: "ExprTail", rhs: ["op", "Term", "ExprTail"] }, // op is + or -
    { id: 12, lhs: "ExprTail", rhs: [EPSILON] },
    
    // Term
    { id: 13, lhs: "Term", rhs: ["Factor", "TermTail"] },
    { id: 14, lhs: "TermTail", rhs: ["op", "Factor", "TermTail"] }, // op is * or /
    { id: 15, lhs: "TermTail", rhs: [EPSILON] },
    
    // Factor
    { id: 16, lhs: "Factor", rhs: ["identifier"] },
    { id: 17, lhs: "Factor", rhs: ["number"] },
    { id: 18, lhs: "Factor", rhs: ["string"] },
    { id: 19, lhs: "Factor", rhs: ["(", "Expr", ")"] },
    { id: 20, lhs: "Factor", rhs: ["identifier", "(", "ArgList", ")"] }, // Function call
    
    // Function arguments
    { id: 21, lhs: "ArgList", rhs: ["Expr", "ArgListTail"] },
    { id: 22, lhs: "ArgList", rhs: [EPSILON] },
    { id: 23, lhs: "ArgListTail", rhs: [",", "Expr", "ArgListTail"] },
    { id: 24, lhs: "ArgListTail", rhs: [EPSILON] },
  ],
  startSymbol: "Program"
}; 