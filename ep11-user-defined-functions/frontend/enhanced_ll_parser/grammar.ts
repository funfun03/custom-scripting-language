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

// Semantic action types for AST building
export interface SemanticAction {
  action: string;
  params?: any[];
}

export interface ProductionWithAction extends Production {
  semanticActions?: SemanticAction[];
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
    case TokenType.BinaryOperator: return "op";
    case TokenType.EOF: return END_MARKER;
    default: return type.toString();
  }
}

// Create a more comprehensive grammar with proper productions for all language features
export const enhancedGrammar: Grammar = {
  terminals: new Set([
    "let", "const", "identifier", "=", ";", "(", ")", "{", "}", "[", "]",
    ",", ":", ".", "number", "string", "fn", "if", "else", "while", "for",
    "return", "break", "continue", "op", END_MARKER
  ]),
  nonTerminals: new Set([
    "Program", "StmtList", "Stmt", "VarDecl", "FnDecl", "IfStmt", "WhileStmt", "ForStmt",
    "ReturnStmt", "BreakStmt", "ContinueStmt", "ExprStmt", "Block", "Params",
    "ParamList", "Expr", "AssignExpr", "CompExpr", "AddExpr", "MultExpr", "UnaryExpr",
    "CallExpr", "MemberExpr", "PrimaryExpr", "Args", "ArgList", "ObjLiteral", "PropList",
    "Prop", "ArrayLiteral", "Elements"
  ]),
  productions: [
    // Program structure
    { id: 1, lhs: "Program", rhs: ["StmtList"] },
    { id: 2, lhs: "StmtList", rhs: ["Stmt", "StmtList"] },
    { id: 3, lhs: "StmtList", rhs: [EPSILON] },

    // Statements
    { id: 4, lhs: "Stmt", rhs: ["VarDecl"] },
    { id: 5, lhs: "Stmt", rhs: ["FnDecl"] },
    { id: 6, lhs: "Stmt", rhs: ["IfStmt"] },
    { id: 7, lhs: "Stmt", rhs: ["WhileStmt"] },
    { id: 8, lhs: "Stmt", rhs: ["ForStmt"] },
    { id: 9, lhs: "Stmt", rhs: ["ReturnStmt"] },
    { id: 10, lhs: "Stmt", rhs: ["BreakStmt"] },
    { id: 11, lhs: "Stmt", rhs: ["ContinueStmt"] },
    { id: 12, lhs: "Stmt", rhs: ["ExprStmt"] },

    // Variable declarations
    { id: 13, lhs: "VarDecl", rhs: ["let", "identifier", "=", "Expr", ";"] },
    { id: 14, lhs: "VarDecl", rhs: ["const", "identifier", "=", "Expr", ";"] },
    { id: 15, lhs: "VarDecl", rhs: ["let", "identifier", ";"] },

    // Function declarations
    { id: 16, lhs: "FnDecl", rhs: ["fn", "identifier", "(", "Params", ")", "{", "Block", "}"] },
    { id: 17, lhs: "Params", rhs: ["ParamList"] },
    { id: 18, lhs: "Params", rhs: [EPSILON] },
    { id: 19, lhs: "ParamList", rhs: ["identifier", ",", "ParamList"] },
    { id: 20, lhs: "ParamList", rhs: ["identifier"] },

    // Control flow statements
    { id: 21, lhs: "IfStmt", rhs: ["if", "(", "Expr", ")", "{", "Block", "}"] },
    { id: 22, lhs: "IfStmt", rhs: ["if", "(", "Expr", ")", "{", "Block", "}", "else", "{", "Block", "}"] },
    { id: 23, lhs: "WhileStmt", rhs: ["while", "(", "Expr", ")", "{", "Block", "}"] },
    { id: 24, lhs: "ForStmt", rhs: ["for", "(", "VarDecl", "Expr", ";", "Expr", ")", "{", "Block", "}"] },
    
    // Other statements
    { id: 25, lhs: "ReturnStmt", rhs: ["return", "Expr", ";"] },
    { id: 26, lhs: "BreakStmt", rhs: ["break", ";"] },
    { id: 27, lhs: "ContinueStmt", rhs: ["continue", ";"] },
    { id: 28, lhs: "ExprStmt", rhs: ["Expr", ";"] },

    // Block
    { id: 29, lhs: "Block", rhs: ["StmtList"] },

    // Expression hierarchy
    { id: 30, lhs: "Expr", rhs: ["AssignExpr"] },
    { id: 31, lhs: "AssignExpr", rhs: ["CompExpr", "=", "AssignExpr"] },
    { id: 32, lhs: "AssignExpr", rhs: ["CompExpr"] },
    
    // Comparison expressions
    { id: 33, lhs: "CompExpr", rhs: ["AddExpr", "op", "CompExpr"] },
    { id: 34, lhs: "CompExpr", rhs: ["AddExpr"] },
    
    // Additive expressions
    { id: 35, lhs: "AddExpr", rhs: ["MultExpr", "op", "AddExpr"] },
    { id: 36, lhs: "AddExpr", rhs: ["MultExpr"] },
    
    // Multiplicative expressions
    { id: 37, lhs: "MultExpr", rhs: ["UnaryExpr", "op", "MultExpr"] },
    { id: 38, lhs: "MultExpr", rhs: ["UnaryExpr"] },

    // Unary expressions
    { id: 39, lhs: "UnaryExpr", rhs: ["op", "UnaryExpr"] },
    { id: 40, lhs: "UnaryExpr", rhs: ["CallExpr"] },

    // Call expressions
    { id: 41, lhs: "CallExpr", rhs: ["MemberExpr", "(", "Args", ")", "CallExpr"] },
    { id: 42, lhs: "CallExpr", rhs: ["MemberExpr", "(", "Args", ")"] },
    { id: 43, lhs: "CallExpr", rhs: ["MemberExpr"] },
    
    // Member expressions
    { id: 44, lhs: "MemberExpr", rhs: ["PrimaryExpr", ".", "identifier", "MemberExpr"] },
    { id: 45, lhs: "MemberExpr", rhs: ["PrimaryExpr", "[", "Expr", "]", "MemberExpr"] },
    { id: 46, lhs: "MemberExpr", rhs: ["PrimaryExpr"] },
    
    // Primary expressions
    { id: 47, lhs: "PrimaryExpr", rhs: ["identifier"] },
    { id: 48, lhs: "PrimaryExpr", rhs: ["number"] },
    { id: 49, lhs: "PrimaryExpr", rhs: ["string"] },
    { id: 50, lhs: "PrimaryExpr", rhs: ["(", "Expr", ")"] },
    { id: 51, lhs: "PrimaryExpr", rhs: ["ObjLiteral"] },
    { id: 52, lhs: "PrimaryExpr", rhs: ["ArrayLiteral"] },
    
    // Arguments
    { id: 53, lhs: "Args", rhs: ["ArgList"] },
    { id: 54, lhs: "Args", rhs: [EPSILON] },
    { id: 55, lhs: "ArgList", rhs: ["Expr", ",", "ArgList"] },
    { id: 56, lhs: "ArgList", rhs: ["Expr"] },
    
    // Object literals
    { id: 57, lhs: "ObjLiteral", rhs: ["{", "PropList", "}"] },
    { id: 58, lhs: "PropList", rhs: ["Prop", ",", "PropList"] },
    { id: 59, lhs: "PropList", rhs: ["Prop"] },
    { id: 60, lhs: "PropList", rhs: [EPSILON] },
    { id: 61, lhs: "Prop", rhs: ["identifier", ":", "Expr"] },
    { id: 62, lhs: "Prop", rhs: ["identifier"] },
    
    // Array literals
    { id: 63, lhs: "ArrayLiteral", rhs: ["[", "Elements", "]"] },
    { id: 64, lhs: "Elements", rhs: ["Expr", ",", "Elements"] },
    { id: 65, lhs: "Elements", rhs: ["Expr"] },
    { id: 66, lhs: "Elements", rhs: [EPSILON] },
  ],
  startSymbol: "Program"
}; 