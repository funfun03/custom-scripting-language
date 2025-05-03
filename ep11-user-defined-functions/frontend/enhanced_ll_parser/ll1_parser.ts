import { Token, TokenType, tokenize } from "../lexer.ts";
import {
  Program, Stmt, Expr, ExpressionStatement,
  BinaryExpr, CallExpr, AssignmentExpr,
  Identifier, NumericLiteral, StringLiteral
} from "../ast.ts";
import { Grammar, NonTerminal, Terminal, Symbol, EPSILON, END_MARKER, tokenTypeToTerminal } from "./ll1_grammar.ts";
import { ParserInterface } from "../parser_interface.ts";

export class LL1Parser implements ParserInterface {
  private tokens: Token[] = [];
  private currentToken: Token | null = null;
  private currentTokenIndex = 0;
  private grammar: Grammar;
  private ast: Program = { kind: "Program", body: [] };
  private errors: string[] = [];

  constructor(grammar: Grammar) {
    this.grammar = grammar;
  }

  // Main parse function
  public parse(tokens: Token[]): Program {
    this.tokens = tokens;
    this.currentTokenIndex = 0;
    this.currentToken = this.tokens[0];
    this.ast = { kind: "Program", body: [] };
    this.errors = [];
    
    try {
      this.program();
      return this.ast;
    } catch (error) {
      console.error("LL(1) Parsing error:", error);
      return this.ast;
    }
  }

  public produceAST(sourceCode: string): Program {
    const tokens = tokenize(sourceCode);
    return this.parse(tokens);
  }

  // Helper functions
  private advance(): void {
    this.currentTokenIndex++;
    if (this.currentTokenIndex < this.tokens.length) {
      this.currentToken = this.tokens[this.currentTokenIndex];
    } else {
      this.currentToken = null;
    }
  }

  private match(type: TokenType): Token {
    if (!this.currentToken) {
      throw this.error("Unexpected end of input");
    }
    
    if (this.currentToken.type === type) {
      const token = this.currentToken;
      this.advance();
      return token;
    }
    
    throw this.error(`Expected ${TokenType[type]}, got ${TokenType[this.currentToken.type]} (${this.currentToken.value})`);
  }

  private error(message: string): Error {
    this.errors.push(message);
    return new Error(message);
  }

  // Check if current token is of given type without consuming it
  private check(type: TokenType): boolean {
    return this.currentToken?.type === type;
  }

  // LL(1) parsing functions for each non-terminal
  private program(): void {
    // Program -> StmtList
    const statements = this.stmtList();
    this.ast.body = statements;
  }

  private stmtList(): Stmt[] {
    const statements: Stmt[] = [];
    
    // StmtList -> Stmt StmtList | ε
    while (this.currentToken && this.currentToken.type !== TokenType.EOF) {
      // First set of Stmt is first set of all statement types
      if (this.check(TokenType.Print) || 
          this.check(TokenType.Identifier) || 
          this.check(TokenType.Number) || 
          this.check(TokenType.String) || 
          this.check(TokenType.OpenParen)) {
        const stmt = this.stmt();
        if (stmt) {
          statements.push(stmt);
        }
      } else {
        break;
      }
    }
    
    return statements;
  }

  private stmt(): Stmt {
    // Stmt -> PrintStmt | AssignStmt | ExprStmt
    if (this.check(TokenType.Print)) {
      return this.printStmt();
    } else if (this.check(TokenType.Identifier) && 
               this.tokens[this.currentTokenIndex + 1]?.type === TokenType.Equals) {
      return this.assignStmt();
    } else {
      return this.exprStmt();
    }
  }

  private printStmt(): ExpressionStatement {
    // PrintStmt -> print ( Expr ) ;
    this.match(TokenType.Print);
    this.match(TokenType.OpenParen);
    const expression = this.expr();
    this.match(TokenType.CloseParen);
    this.match(TokenType.Semicolon);
    
    // Create a call expression
    const callExpr: CallExpr = {
      kind: "CallExpr",
      caller: {
        kind: "Identifier",
        symbol: "print"
      } as Identifier,
      args: [expression]
    };
    
    return {
      kind: "ExpressionStatement",
      expression: callExpr
    };
  }

  private assignStmt(): ExpressionStatement {
    // AssignStmt -> identifier = Expr ;
    const identifier = this.match(TokenType.Identifier).value;
    this.match(TokenType.Equals);
    const value = this.expr();
    this.match(TokenType.Semicolon);
    
    // Create an assignment expression
    const assignExpr: AssignmentExpr = {
      kind: "AssignmentExpr",
      assigne: {
        kind: "Identifier",
        symbol: identifier
      } as Identifier,
      value
    };
    
    return {
      kind: "ExpressionStatement",
      expression: assignExpr
    };
  }

  private exprStmt(): ExpressionStatement {
    // ExprStmt -> Expr ;
    const expression = this.expr();
    this.match(TokenType.Semicolon);
    
    return {
      kind: "ExpressionStatement",
      expression
    };
  }

  private expr(): Expr {
    // Expr -> Term ExprTail
    // Parse the first term
    let left = this.term();
    
    // Parse any additional terms with + or -
    while (this.currentToken && 
           this.currentToken.type === TokenType.BinaryOperator && 
           (this.currentToken.value === "+" || this.currentToken.value === "-")) {
      const operator = this.match(TokenType.BinaryOperator).value;
      const right = this.term();
      
      // Create binary expression
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator
      };
    }
    
    return left;
  }

  private term(): Expr {
    // Term -> Factor TermTail
    // Parse the first factor
    let left = this.factor();
    
    // Parse any additional factors with * or /
    while (this.currentToken && 
           this.currentToken.type === TokenType.BinaryOperator && 
           (this.currentToken.value === "*" || this.currentToken.value === "/")) {
      const operator = this.match(TokenType.BinaryOperator).value;
      const right = this.factor();
      
      // Create binary expression
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator
      };
    }
    
    return left;
  }

  private factor(): Expr {
    // Factor -> identifier | number | string | ( Expr ) | identifier ( ArgList )
    if (this.check(TokenType.Identifier)) {
      // Check if it's a function call
      if (this.tokens[this.currentTokenIndex + 1]?.type === TokenType.OpenParen) {
        return this.functionCall();
      }
      
      // Just an identifier
      return {
        kind: "Identifier",
        symbol: this.match(TokenType.Identifier).value
      };
    } else if (this.check(TokenType.Number)) {
      return {
        kind: "NumericLiteral",
        value: parseFloat(this.match(TokenType.Number).value)
      };
    } else if (this.check(TokenType.String)) {
      return {
        kind: "StringLiteral",
        value: this.match(TokenType.String).value
      };
    } else if (this.check(TokenType.OpenParen)) {
      this.match(TokenType.OpenParen);
      const expr = this.expr();
      this.match(TokenType.CloseParen);
      return expr;
    } else {
      throw this.error(`Unexpected token in factor: ${this.currentToken?.value}`);
    }
  }

  private functionCall(): CallExpr {
    // identifier ( ArgList )
    const funcName = this.match(TokenType.Identifier).value;
    this.match(TokenType.OpenParen);
    
    // Parse argument list
    const args: Expr[] = [];
    
    // If there are arguments
    if (!this.check(TokenType.CloseParen)) {
      // Parse first expression
      args.push(this.expr());
      
      // Parse any additional expressions separated by commas
      while (this.check(TokenType.Comma)) {
        this.match(TokenType.Comma);
        args.push(this.expr());
      }
    }
    
    this.match(TokenType.CloseParen);
    
    return {
      kind: "CallExpr",
      caller: {
        kind: "Identifier",
        symbol: funcName
      } as Identifier,
      args
    };
  }
} 