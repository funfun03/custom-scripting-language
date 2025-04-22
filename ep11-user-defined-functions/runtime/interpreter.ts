import {
	NumberVal,
	StringVal,
	ArrayVal,
	RuntimeVal,
	MK_NULL,
	MK_NUMBER,
	MK_STRING,
	MK_ARRAY,
	ValueType,
	MK_BREAK,
	MK_CONTINUE,
	MK_RETURN,
	ControlFlowVal,
} from "./values.ts";
import {
	AssignmentExpr,
	BinaryExpr,
	CallExpr,
	FunctionDeclaration,
	Identifier,
	NumericLiteral,
	ObjectLiteral,
	Program,
	Stmt,
	VarDeclaration,
	ExpressionStatement,
	StringLiteral,
	ArrayLiteral,
	IfStatement,
	WhileStatement,
	ForStatement,
	ReturnStatement,
	Expr,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import {
	eval_function_declaration,
	eval_program,
	eval_var_declaration,
} from "./eval/statements.ts";
import {
	eval_assignment,
	eval_binary_expr,
	eval_call_expr,
	eval_identifier,
	eval_object_expr,
} from "./eval/expressions.ts";

export function evaluate(astNode: Stmt | Expr, env: Environment): RuntimeVal {
	if (isStmt(astNode)) {
		return evaluateStmt(astNode, env);
	} else {
		return evaluateExpr(astNode, env);
	}
}

function isStmt(node: Stmt | Expr): node is Stmt {
	return [
		"Program",
		"VarDeclaration",
		"FunctionDeclaration",
		"IfStatement",
		"WhileStatement",
		"ForStatement",
		"ReturnStatement",
		"BreakStatement",
		"ContinueStatement",
		"ExpressionStatement"
	].includes(node.kind);
}

function evaluateStmt(astNode: Stmt, env: Environment): RuntimeVal {
	switch (astNode.kind) {
		case "Program":
			return eval_program(astNode as Program, env);
		case "VarDeclaration":
			return eval_var_declaration(astNode as VarDeclaration, env);
		case "FunctionDeclaration":
			return eval_function_declaration(astNode as FunctionDeclaration, env);
		case "IfStatement":
			return eval_if_stmt(astNode as IfStatement, env);
		case "WhileStatement":
			return eval_while_stmt(astNode as WhileStatement, env);
		case "ForStatement":
			return eval_for_stmt(astNode as ForStatement, env);
		case "ReturnStatement":
			return eval_return_stmt(astNode as ReturnStatement, env);
		case "BreakStatement":
			return MK_BREAK();
		case "ContinueStatement":
			return MK_CONTINUE();
		case "ExpressionStatement":
			return evaluate((astNode as ExpressionStatement).expression, env);
		default:
			console.error(
				"This AST Node has not yet been setup for interpretation.\n",
				astNode
			);
			Deno.exit(0);
	}
}

function evaluateExpr(astNode: Expr, env: Environment): RuntimeVal {
	switch (astNode.kind) {
		case "NumericLiteral":
			return MK_NUMBER((astNode as NumericLiteral).value);
		case "StringLiteral":
			return MK_STRING((astNode as StringLiteral).value);
		case "ArrayLiteral":
			const elements = (astNode as ArrayLiteral).elements.map(e => evaluate(e, env));
			return MK_ARRAY(elements);
		case "Identifier":
			return eval_identifier(astNode as Identifier, env);
		case "ObjectLiteral":
			return eval_object_expr(astNode as ObjectLiteral, env);
		case "CallExpr":
			return eval_call_expr(astNode as CallExpr, env);
		case "AssignmentExpr":
			return eval_assignment(astNode as AssignmentExpr, env);
		case "BinaryExpr":
			return eval_binary_expr(astNode as BinaryExpr, env);
		default:
			console.error(
				"This AST Node has not yet been setup for interpretation.\n",
				astNode
			);
			Deno.exit(0);
	}
}

function eval_if_stmt(node: IfStatement, env: Environment): RuntimeVal {
	const condition = evaluate(node.condition, env);
	if (is_truthy(condition)) {
		return eval_block(node.then, env);
	} else if (node.else) {
		return eval_block(node.else, env);
	}
	return MK_NULL();
}

function eval_while_stmt(node: WhileStatement, env: Environment): RuntimeVal {
	while (is_truthy(evaluate(node.condition, env))) {
		const result = eval_block(node.body, env);
		if (result.type === "break") break;
		if (result.type === "continue") continue;
	}
	return MK_NULL();
}

function eval_for_stmt(node: ForStatement, env: Environment): RuntimeVal {
	const loopEnv = new Environment(env);
	
	if (node.init) {
		evaluate(node.init, loopEnv);
	}
	
	while (!node.condition || is_truthy(evaluate(node.condition, loopEnv))) {
		const result = eval_block(node.body, loopEnv);
		if (result.type === "break") break;
		if (result.type === "continue") continue;
		
		if (node.update) {
			evaluate(node.update, loopEnv);
		}
	}
	
	return MK_NULL();
}

function eval_return_stmt(node: ReturnStatement, env: Environment): RuntimeVal {
	if (node.value) {
		return MK_RETURN(evaluate(node.value, env));
	}
	return MK_RETURN();
}

function eval_block(statements: Stmt[], env: Environment): RuntimeVal {
	let result: RuntimeVal = MK_NULL();
	for (const stmt of statements) {
		result = evaluate(stmt, env);
		if (result.type === "break" || result.type === "continue" || result.type === "return") {
			return result;
		}
	}
	return result;
}

function is_truthy(value: RuntimeVal): boolean {
	if (value.type === "null") return false;
	if (value.type === "boolean") return (value as { type: "boolean"; value: boolean }).value;
	if (value.type === "number") return (value as NumberVal).value !== 0;
	if (value.type === "string") return (value as StringVal).value !== "";
	if (value.type === "array") return (value as ArrayVal).elements.length > 0;
	return true;
}
