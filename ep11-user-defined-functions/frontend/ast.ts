// deno-lint-ignore-file no-empty-interface
// https://github.com/tlaceby/guide-to-interpreters-series

// -----------------------------------------------------------
// --------------          AST TYPES        ------------------
// ---     Defines the structure of our languages AST      ---
// -----------------------------------------------------------

export type NodeType =
	// STATEMENTS
	| "Program"
	| "VarDeclaration"
	| "FunctionDeclaration"
	| "IfStatement"
	| "WhileStatement"
	| "ForStatement"
	| "ReturnStatement"
	| "BreakStatement"
	| "ContinueStatement"
	| "ExpressionStatement"
	// EXPRESSIONS
	| "AssignmentExpr"
	| "MemberExpr"
	| "CallExpr"
	// Literals
	| "Property"
	| "ObjectLiteral"
	| "NumericLiteral"
	| "Identifier"
	| "BinaryExpr"
	| "StringLiteral"
	| "ArrayLiteral";

/**
 * Statements do not result in a value at runtime.
 They contain one or more expressions internally */
export type Stmt = 
	| Program
	| VarDeclaration
	| FunctionDeclaration
	| IfStatement
	| WhileStatement
	| ForStatement
	| ReturnStatement
	| BreakStatement
	| ContinueStatement
	| ExpressionStatement;

/**
 * Defines a block which contains many statements.
 * -  Only one program will be contained in a file.
 */
export interface Program {
	kind: "Program";
	body: Stmt[];
}

export interface VarDeclaration {
	kind: "VarDeclaration";
	constant: boolean;
	identifier: string;
	value?: Expr;
}

export interface FunctionDeclaration {
	kind: "FunctionDeclaration";
	parameters: string[];
	name: string;
	body: Stmt[];
}

/**  Expressions will result in a value at runtime unlike Statements */
export type Expr =
	| BinaryExpr
	| CallExpr
	| MemberExpr
	| Identifier
	| NumericLiteral
	| StringLiteral
	| ArrayLiteral
	| ObjectLiteral
	| AssignmentExpr
	| UnaryExpr
	| LogicalExpr;

export interface BinaryExpr {
	kind: "BinaryExpr";
	left: Expr;
	right: Expr;
	operator: string;
}

export interface CallExpr {
	kind: "CallExpr";
	args: Expr[];
	caller: Expr;
}

export interface MemberExpr {
	kind: "MemberExpr";
	object: Expr;
	property: Expr;
	computed: boolean;
}

export interface Identifier {
	kind: "Identifier";
	symbol: string;
}

export interface NumericLiteral {
	kind: "NumericLiteral";
	value: number;
}

export interface StringLiteral {
	kind: "StringLiteral";
	value: string;
}

export interface ArrayLiteral {
	kind: "ArrayLiteral";
	elements: Expr[];
}

export interface ObjectLiteral {
	kind: "ObjectLiteral";
	properties: Property[];
}

export interface AssignmentExpr {
	kind: "AssignmentExpr";
	assigne: Expr;
	value: Expr;
}

export interface UnaryExpr {
	kind: "UnaryExpr";
	operator: string;
	argument: Expr;
}

export interface LogicalExpr {
	kind: "LogicalExpr";
	left: Expr;
	right: Expr;
	operator: string;
}

export interface Property {
	kind: "Property";
	key: string;
	value?: Expr;
}

export interface IfStatement {
	kind: "IfStatement";
	condition: Expr;
	then: Stmt[];
	else?: Stmt[];
}

export interface WhileStatement {
	kind: "WhileStatement";
	condition: Expr;
	body: Stmt[];
}

export interface ForStatement {
	kind: "ForStatement";
	init?: Stmt | Expr;
	condition?: Expr;
	update?: Expr;
	body: Stmt[];
}

export interface ReturnStatement {
	kind: "ReturnStatement";
	value?: Expr;
}

export interface BreakStatement {
	kind: "BreakStatement";
}

export interface ContinueStatement {
	kind: "ContinueStatement";
}

export interface ExpressionStatement {
	kind: "ExpressionStatement";
	expression: Expr;
}
