// deno-lint-ignore-file no-explicit-any
import {
	AssignmentExpr,
	BinaryExpr,
	CallExpr,
	Expr,
	Identifier,
	MemberExpr,
	NumericLiteral,
	ObjectLiteral,
	Program,
	Property,
	Stmt,
	VarDeclaration,
	FunctionDeclaration,
	IfStatement,
	WhileStatement,
	ForStatement,
	ReturnStatement,
	BreakStatement,
	ContinueStatement,
	StringLiteral,
	ArrayLiteral,
	ExpressionStatement,
} from "./ast.ts";

import { Token, tokenize, TokenType } from "./lexer.ts";
import { ParserInterface, ParserType } from "./parser_interface.ts";
import { LLParser } from "./ll_parser/ll_parser.ts";
import { grammar } from "./ll_parser/grammar_utils.ts";
import { createEnhancedLLParser } from "./enhanced_ll_parser/index.ts";

/**
 * Frontend for producing a valid AST from sourcode
 */
export default class Parser implements ParserInterface {
	private parserType: ParserType;
	private tokens: Token[] = [];

	constructor(parserType: ParserType = ParserType.RecursiveDescent) {
		this.parserType = parserType;
	}

	/*
	 * Determines if the parsing is complete and the END OF FILE Is reached.
	 */
	private not_eof(): boolean {
		return this.tokens.length > 0 && this.tokens[0].type !== TokenType.EOF;
	}

	/**
	 * Returns the currently available token
	 */
	private at(): Token {
		if (this.tokens.length === 0) {
			throw new Error("Unexpected end of tokens array");
		}
		return this.tokens[0];
	}

	/**
	 * Returns the previous token and then advances the tokens array to the next value.
	 */
	private eat(): Token {
		if (this.tokens.length === 0) {
			throw new Error("Unexpected end of tokens array");
		}
		return this.tokens.shift()!;
	}

	/**
	 * Returns the previous token and then advances the tokens array to the next value.
	 *  Also checks the type of expected token and throws if the values dnot match.
	 */
	private expect(type: TokenType, err: any): Token {
		if (this.tokens.length === 0) {
			throw new Error("Unexpected end of tokens array");
		}
		const prev = this.tokens.shift()!;
		if (prev.type !== type) {
			console.error("Parser Error:\n", err, prev, " - Expecting: ", type);
			Deno.exit(1);
		}
		return prev;
	}

	public produceAST(sourceCode: string): Program {
		this.tokens = tokenize(sourceCode);
		return this.parse(this.tokens);
	}

	public parse(tokens: Token[]): Program {
		switch (this.parserType) {
			case ParserType.RecursiveDescent:
				return this.parseRecursiveDescent(tokens);
			case ParserType.LL:
				return this.parseLL(tokens);
			case ParserType.EnhancedLL:
				return this.parseEnhancedLL(tokens);
			default:
				throw new Error(`Unknown parser type: ${this.parserType}`);
		}
	}

	private parseRecursiveDescent(tokens: Token[]): Program {
		this.tokens = tokens;
		const program: Program = {
			kind: "Program",
			body: [],
		};

		// Parse until end of file
		while (this.not_eof()) {
			program.body.push(this.parse_stmt());
		}

		return program;
	}

	private parseLL(tokens: Token[]): Program {
		const llParser = new LLParser(tokens, grammar);
		try {
			return llParser.parse();
		} catch (error) {
			console.log("LL parsing failed, falling back to Recursive Descent parser", error);
			// Fall back to recursive descent parser
			return this.parseRecursiveDescent(tokens);
		}
	}

	private parseEnhancedLL(tokens: Token[]): Program {
		const enhancedLLParser = createEnhancedLLParser();
		try {
			return enhancedLLParser.parse(tokens);
		} catch (error) {
			console.log("Enhanced LL parsing failed, falling back to Recursive Descent parser", error);
			// Fall back to recursive descent parser
			return this.parseRecursiveDescent(tokens);
		}
	}

	// Handle complex statement types
	private parse_stmt(): Stmt {
		switch (this.at().type) {
			case TokenType.Let:
			case TokenType.Const:
				return this.parse_var_declaration();
			case TokenType.Fn:
				return this.parse_fn_declaration();
			case TokenType.If:
				return this.parse_if_stmt();
			case TokenType.While:
				return this.parse_while_stmt();
			case TokenType.For:
				return this.parse_for_stmt();
			case TokenType.Return:
				return this.parse_return_stmt();
			case TokenType.Break:
				return this.parse_break_stmt();
			case TokenType.Continue:
				return this.parse_continue_stmt();
			case TokenType.Print:
				return this.parse_print_stmt();
			default:
				const expr = this.parse_expr();
				// Only expect semicolon if the next token is not a closing brace
				if (this.at().type !== TokenType.CloseBrace) {
					this.expect(TokenType.Semicolon, "Expected ';' after expression");
				}
				return {
					kind: "ExpressionStatement",
					expression: expr
				} as ExpressionStatement;
		}
	}

	// Handle print statement for the recursive descent parser
	private parse_print_stmt(): Stmt {
		// Consume the 'print' token
		this.eat();
		
		// Expect the opening parenthesis
		this.expect(TokenType.OpenParen, "Expected '(' after 'print'");
		
		// Parse the expression inside the print statement
		const printExpr = this.parse_expr();
		
		// Expect the closing parenthesis
		this.expect(TokenType.CloseParen, "Expected ')' after expression in print statement");
		
		// Only expect semicolon if the next token is not a closing brace
		if (this.at().type !== TokenType.CloseBrace) {
			this.expect(TokenType.Semicolon, "Expected ';' after print statement");
		}
		
		// Create a call expression for print
		const callExpr: CallExpr = {
			kind: "CallExpr",
			caller: {
				kind: "Identifier",
				symbol: "print"
			} as Identifier,
			args: [printExpr]
		};
		
		// Return as an expression statement
		return {
			kind: "ExpressionStatement",
			expression: callExpr
		} as ExpressionStatement;
	}

	parse_fn_declaration(): Stmt {
		this.eat(); // eat fn keyword
		const name = this.expect(
			TokenType.Identifier,
			"Expected function name following fn keyword"
		).value;

		const args = this.parse_args();
		const params: string[] = [];
		for (const arg of args) {
			if (arg.kind !== "Identifier") {
				console.log(arg);
				throw "Inside function declaration expected parameters to be of type string.";
			}

			params.push((arg as Identifier).symbol);
		}

		this.expect(
			TokenType.OpenBrace,
			"Expected function body following declaration"
		);
		const body: Stmt[] = [];

		while (
			this.at().type !== TokenType.EOF &&
			this.at().type !== TokenType.CloseBrace
		) {
			body.push(this.parse_stmt());
		}

		this.expect(
			TokenType.CloseBrace,
			"Closing brace expected inside function declaration"
		);

		const fn = {
			body,
			name,
			parameters: params,
			kind: "FunctionDeclaration",
		} as FunctionDeclaration;

		return fn;
	}

	// LET IDENT;
	// ( LET | CONST ) IDENT = EXPR;
	parse_var_declaration(): Stmt {
		const isConstant = this.eat().type == TokenType.Const;
		const identifier = this.expect(
			TokenType.Identifier,
			"Expected identifier name following let | const keywords."
		).value;

		if (this.at().type == TokenType.Semicolon) {
			this.eat(); // expect semicolon
			if (isConstant) {
				throw "Must assigne value to constant expression. No value provided.";
			}

			return {
				kind: "VarDeclaration",
				identifier,
				constant: false,
			} as VarDeclaration;
		}

		this.expect(
			TokenType.Equals,
			"Expected equals token following identifier in var declaration."
		);

		const declaration = {
			kind: "VarDeclaration",
			value: this.parse_expr(),
			identifier,
			constant: isConstant,
		} as VarDeclaration;

		this.expect(
			TokenType.Semicolon,
			"Variable declaration statment must end with semicolon."
		);

		return declaration;
	}

	// Handle expressions
	private parse_expr(): Expr {
		return this.parse_comparison_expr();
	}

	private parse_comparison_expr(): Expr {
		let left = this.parse_assignment_expr();

		while (
			this.at().value === ">" ||
			this.at().value === "<" ||
			this.at().value === ">=" ||
			this.at().value === "<=" ||
			this.at().value === "==" ||
			this.at().value === "!="
		) {
			const operator = this.eat().value;
			const right = this.parse_assignment_expr();
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator,
			} as BinaryExpr;
		}

		return left;
	}

	private parse_assignment_expr(): Expr {
		const left = this.parse_object_expr();

		if (this.at().type === TokenType.Equals) {
			this.eat(); // advance past equals
			const value = this.parse_assignment_expr();
			return { value, assigne: left, kind: "AssignmentExpr" } as AssignmentExpr;
		}

		return left;
	}

	private parse_object_expr(): Expr {
		// { Prop[] }
		if (this.at().type !== TokenType.OpenBrace) {
			return this.parse_array_expr();
		}

		this.eat(); // advance past open brace.
		const properties = new Array<Property>();

		while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
			const key = this.expect(
				TokenType.Identifier,
				"Object literal key expected"
			).value;

			// Allows shorthand key: pair -> { key, }
			if (this.at().type === TokenType.Comma) {
				this.eat(); // advance past comma
				properties.push({ key, kind: "Property" } as Property);
				continue;
			} // Allows shorthand key: pair -> { key }
			else if (this.at().type === TokenType.CloseBrace) {
				properties.push({ key, kind: "Property" });
				continue;
			}

			// { key: val }
			this.expect(
				TokenType.Colon,
				"Missing colon following identifier in ObjectExpr"
			);
			const value = this.parse_expr();

			properties.push({ kind: "Property", value, key });
			if (this.at().type !== TokenType.CloseBrace) {
				this.expect(
					TokenType.Comma,
					"Expected comma or closing bracket following property"
				);
			}
		}

		this.expect(TokenType.CloseBrace, "Object literal missing closing brace.");
		return { kind: "ObjectLiteral", properties } as ObjectLiteral;
	}

	private parse_array_expr(): Expr {
		if (this.at().type !== TokenType.OpenBracket) {
			return this.parse_additive_expr();
		}

		this.eat(); // eat the opening bracket
		const elements: Expr[] = [];
		
		// Parse array elements until we hit a closing bracket or EOF
		while (this.not_eof() && this.at().type !== TokenType.CloseBracket) {
			elements.push(this.parse_expr());
			if (this.not_eof() && this.at().type === TokenType.Comma) {
				this.eat(); // eat the comma
			}
		}
		
		if (!this.not_eof()) {
			throw new Error("Unexpected end of file while parsing array literal");
		}
		
		this.expect(
			TokenType.CloseBracket,
			"Expected closing bracket after array elements"
		);
		return {
			kind: "ArrayLiteral",
			elements,
		} as ArrayLiteral;
	}

	// Handle Addition & Subtraction Operations
	private parse_additive_expr(): Expr {
		let left = this.parse_multiplicitave_expr();

		while (this.at().value == "+" || this.at().value == "-") {
			const operator = this.eat().value;
			const right = this.parse_multiplicitave_expr();
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator,
			} as BinaryExpr;
		}

		return left;
	}

	// Handle Multiplication, Division & Modulo Operations
	private parse_multiplicitave_expr(): Expr {
		let left = this.parse_call_member_expr();

		while (
			this.at().value == "/" ||
			this.at().value == "*" ||
			this.at().value == "%"
		) {
			const operator = this.eat().value;
			const right = this.parse_call_member_expr();
			left = {
				kind: "BinaryExpr",
				left,
				right,
				operator,
			} as BinaryExpr;
		}

		return left;
	}

	// foo.x()()
	private parse_call_member_expr(): Expr {
		const member = this.parse_primary_expr();

		if (this.at().type == TokenType.OpenParen) {
			return this.parse_call_expr(member);
		}

		return member;
	}

	private parse_call_expr(caller: Expr): Expr {
		let call_expr: Expr = {
			kind: "CallExpr",
			caller,
			args: this.parse_args(),
		} as CallExpr;

		if (this.at().type == TokenType.OpenParen) {
			call_expr = this.parse_call_expr(call_expr);
		}

		return call_expr;
	}

	private parse_args(): Expr[] {
		this.expect(TokenType.OpenParen, "Expected open parenthesis");
		const args =
			this.at().type == TokenType.CloseParen ? [] : this.parse_arguments_list();

		this.expect(
			TokenType.CloseParen,
			"Missing closing parenthesis inside arguments list"
		);
		return args;
	}

	private parse_arguments_list(): Expr[] {
		const args = [this.parse_assignment_expr()];

		while (this.at().type == TokenType.Comma && this.eat()) {
			args.push(this.parse_assignment_expr());
		}

		return args;
	}

	private parse_member_expr(): Expr {
		let object = this.parse_primary_expr();

		while (
			this.at().type == TokenType.Dot ||
			this.at().type == TokenType.OpenBracket
		) {
			const operator = this.eat();
			let property: Expr;
			let computed: boolean;

			// non-computed values aka obj.expr
			if (operator.type == TokenType.Dot) {
				computed = false;
				// get identifier
				property = this.parse_primary_expr();
				if (property.kind != "Identifier") {
					throw `Cannonot use dot operator without right hand side being a identifier`;
				}
			} else {
				// this allows obj[computedValue]
				computed = true;
				property = this.parse_expr();
				this.expect(
					TokenType.CloseBracket,
					"Missing closing bracket in computed value."
				);
			}

			object = {
				kind: "MemberExpr",
				object,
				property,
				computed,
			} as MemberExpr;
		}

		return object;
	}

	// Orders Of Prescidence
	// Assignment
	// Object
	// AdditiveExpr
	// MultiplicitaveExpr
	// Call
	// Member
	// PrimaryExpr

	// Parse Literal Values & Grouping Expressions
	private parse_primary_expr(): Expr {
		const tk = this.at().type;

		// Determine which token we are currently at and return literal value
		switch (tk) {
			// User defined values.
			case TokenType.Identifier:
				return { kind: "Identifier", symbol: this.eat().value } as Identifier;

			// Constants and Numeric Constants
			case TokenType.Number:
				return {
					kind: "NumericLiteral",
					value: parseFloat(this.eat().value),
				} as NumericLiteral;

			// String Literals
			case TokenType.String:
				return {
					kind: "StringLiteral",
					value: this.eat().value,
				} as StringLiteral;

			// Array Literals
			case TokenType.OpenBracket:
				return this.parse_array_expr();

			// Grouping Expressions
			case TokenType.OpenParen: {
				this.eat(); // eat the opening paren
				const value = this.parse_expr();
				this.expect(
					TokenType.CloseParen,
					"Unexpected token found inside parenthesised expression. Expected closing parenthesis."
				); // closing paren
				return value;
			}

			// Unidentified Tokens and Invalid Code Reached
			default:
				console.error("Unexpected token found during parsing!", this.at());
				Deno.exit(1);
		}
	}

	private parse_if_stmt(): IfStatement {
		this.eat(); // eat if
		this.expect(TokenType.OpenParen, "Expected '(' after if");
		const condition = this.parse_expr();
		this.expect(TokenType.CloseParen, "Expected ')' after if condition");
		this.expect(TokenType.OpenBrace, "Expected '{' after if condition");
		
		const then: Stmt[] = [];
		while (this.at().type !== TokenType.CloseBrace) {
			then.push(this.parse_stmt());
		}
		this.eat(); // eat }

		let elseBranch: Stmt[] | undefined;
		if (this.at().type === TokenType.Else) {
			this.eat(); // eat else
			this.expect(TokenType.OpenBrace, "Expected '{' after else");
			elseBranch = [];
			while (this.at().type !== TokenType.CloseBrace) {
				elseBranch.push(this.parse_stmt());
			}
			this.eat(); // eat }
		}

		return {
			kind: "IfStatement",
			condition,
			then,
			else: elseBranch,
		};
	}

	private parse_while_stmt(): WhileStatement {
		this.eat(); // eat while
		const condition = this.parse_expr();
		this.expect(TokenType.OpenBrace, "Expected { after while condition");
		
		const body: Stmt[] = [];
		while (this.at().type !== TokenType.CloseBrace) {
			body.push(this.parse_stmt());
		}
		this.eat(); // eat }

		return {
			kind: "WhileStatement",
			condition,
			body,
		};
	}

	private parse_for_stmt(): ForStatement {
		this.eat(); // eat for
		this.expect(TokenType.OpenParen, "Expected '(' after for");
		
		let init: Stmt | Expr | undefined;
		if (this.at().type === TokenType.Let || this.at().type === TokenType.Const) {
			init = this.parse_var_declaration();
		} else if (this.at().type !== TokenType.Semicolon) {
			init = this.parse_expr();
			this.expect(TokenType.Semicolon, "Expected ';' after for init");
		} else {
			this.eat(); // eat semicolon
		}

		let condition: Expr | undefined;
		if (this.at().type !== TokenType.Semicolon) {
			condition = this.parse_expr();
		}
		this.expect(TokenType.Semicolon, "Expected ';' after for condition");

		let update: Expr | undefined;
		if (this.at().type !== TokenType.CloseParen) {
			update = this.parse_expr();
		}
		this.expect(TokenType.CloseParen, "Expected ')' after for update");
		this.expect(TokenType.OpenBrace, "Expected '{' after for");

		const body: Stmt[] = [];
		while (this.at().type !== TokenType.CloseBrace) {
			body.push(this.parse_stmt());
		}
		this.eat(); // eat }

		return {
			kind: "ForStatement",
			init,
			condition,
			update,
			body,
		};
	}

	private parse_return_stmt(): ReturnStatement {
		this.eat(); // eat return
		const value = this.parse_expr();
		return {
			kind: "ReturnStatement",
			value,
		};
	}

	private parse_break_stmt(): BreakStatement {
		this.eat(); // eat break
		return {
			kind: "BreakStatement",
		};
	}

	private parse_continue_stmt(): ContinueStatement {
		this.eat(); // eat continue
		return {
			kind: "ContinueStatement",
		};
	}

	private parse_array_literal(): ArrayLiteral {
		this.eat(); // eat [
		const elements: Expr[] = [];
		
		while (this.at().type !== TokenType.CloseBracket) {
			elements.push(this.parse_expr());
			if (this.at().type === TokenType.Comma) {
				this.eat();
			}
		}
		
		this.expect(TokenType.CloseBracket, "Expected ] after array elements");
		return {
			kind: "ArrayLiteral",
			elements,
		};
	}
}
