import { Token, TokenType, tokenize } from "../lexer.ts";
import {
  BinaryExpr,
  Expr,
  Identifier,
  NumericLiteral,
  Program,
  Stmt,
  VarDeclaration,
  StringLiteral,
  ObjectLiteral,
  Property,
  ArrayLiteral,
  CallExpr,
  MemberExpr,
  FunctionDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  AssignmentExpr,
  ExpressionStatement
} from "../ast.ts";
import { Grammar, NonTerminal, Terminal, Symbol, EPSILON, END_MARKER, tokenTypeToTerminal } from "./grammar.ts";
import { ParseTable, buildParseTable } from "./parse_table.ts";
import { FirstSets, FollowSets, calculateFirstSets, calculateFollowSets } from "./first_follow.ts";
import { ParserInterface } from "../parser_interface.ts";

// Utility type for parse tree nodes
type ParseTreeNode = {
  symbol: Symbol;
  children: ParseTreeNode[];
  token?: Token;
};

export class EnhancedLLParser implements ParserInterface {
  private tokens: Token[] = [];
  private grammar: Grammar;
  private firstSets: FirstSets;
  private followSets: FollowSets;
  private parseTable: ParseTable;
  private currentTokenIndex = 0;
  private errors: string[] = [];
  private parseTree: ParseTreeNode | null = null;

  constructor(grammar: Grammar) {
    this.grammar = grammar;
    this.firstSets = calculateFirstSets(grammar);
    this.followSets = calculateFollowSets(grammar, this.firstSets);
    this.parseTable = buildParseTable(grammar, this.firstSets, this.followSets);
  }

  public produceAST(sourceCode: string): Program {
    const tokens = this.tokenize(sourceCode);
    return this.parse(tokens);
  }

  private tokenize(sourceCode: string): Token[] {
    return tokenize(sourceCode);
  }

  public parse(tokens: Token[]): Program {
    this.tokens = tokens;
    this.currentTokenIndex = 0;
    this.errors = [];
    
    try {
      // First build a parse tree
      this.parseTree = this.buildParseTree();
      
      // Then convert the parse tree to an AST
      return this.buildAST();
    } catch (error) {
      console.error("LL Parsing error:", error);
      // Return a minimal valid program
      return {
        kind: "Program",
        body: []
      };
    }
  }

  /**
   * Builds a parse tree using LL(1) parsing
   * @returns The root of the parse tree
   */
  private buildParseTree(): ParseTreeNode {
    // Initialize stack with end marker and start symbol
    const stack: Symbol[] = [END_MARKER, this.grammar.startSymbol];
    
    // Create the root of the parse tree
    const root: ParseTreeNode = {
      symbol: this.grammar.startSymbol,
      children: []
    };
    
    // Stack for parse tree nodes
    const nodeStack: ParseTreeNode[] = [root];
    
    // Main parsing loop
    while (stack.length > 0 && this.currentTokenIndex < this.tokens.length) {
      const top = stack[stack.length - 1];
      const currentToken = this.tokens[this.currentTokenIndex];
      const currentTerminal = tokenTypeToTerminal(currentToken.type);
      
      console.log(`Stack: [${stack.join(", ")}], Current Token: ${currentTerminal} (${currentToken.value})`);
      
      if (top === END_MARKER) {
        if (currentToken.type === TokenType.EOF) {
          // We're done!
          stack.pop();
          break;
        } else {
          throw new Error(`Parsing error: Expected end of input, got ${currentToken.value}`);
        }
      } else if (this.grammar.terminals.has(top)) {
        // Terminal on top of stack
        if (top === currentTerminal ||
            (top === "op" && currentToken.type === TokenType.BinaryOperator)) {
          // Match!
          stack.pop();
          this.currentTokenIndex++;
          
          // Pop node from node stack and attach token
          const node = nodeStack.pop();
          if (node) {
            node.token = currentToken;
          }
        } else {
          // Error: terminal mismatch
          throw new Error(
            `Parsing error: Expected '${top}', got '${currentToken.value}' at position ${this.currentTokenIndex}`
          );
        }
      } else {
        // Non-terminal on top of stack
        const nonTerminal = top as NonTerminal;
        stack.pop();
        
        // Look up production in parse table
        const ntMap = this.parseTable.get(nonTerminal);
        if (!ntMap) {
          throw new Error(`No parse table entry for non-terminal ${nonTerminal}`);
        }
        
        const production = ntMap.get(currentTerminal);
        if (!production) {
          // Try to recover - for now just report error
          throw new Error(
            `Parsing error: Unexpected token '${currentToken.value}' for non-terminal ${nonTerminal}`
          );
        }
        
        // Pop node from node stack
        const node = nodeStack.pop();
        if (!node) {
          throw new Error("Node stack underflow");
        }
        
        // Push production in reverse order
        for (let i = production.rhs.length - 1; i >= 0; i--) {
          const symbol = production.rhs[i];
          if (symbol !== EPSILON) {
            stack.push(symbol);
            
            // Create new node for this symbol
            const childNode: ParseTreeNode = {
              symbol,
              children: []
            };
            
            // Add child to current node
            node.children.unshift(childNode);
            
            // Push child onto node stack
            nodeStack.push(childNode);
          }
        }
      }
    }
    
    // Check if we consumed all input
    if (this.currentTokenIndex < this.tokens.length - 1) { // -1 to account for EOF
      throw new Error(`Parsing error: Unexpected extra input starting at position ${this.currentTokenIndex}`);
    }
    
    return root;
  }

  /**
   * Converts the parse tree to an AST
   * @returns The root Program node of the AST
   */
  private buildAST(): Program {
    if (!this.parseTree) {
      throw new Error("Parse tree not built");
    }
    
    // Convert the parse tree to an AST
    const program: Program = {
      kind: "Program",
      body: []
    };
    
    // Process the parse tree to build the AST
    const stmtList = this.findNode(this.parseTree, "StmtList");
    if (stmtList) {
      program.body = this.processStmtList(stmtList);
    }
    
    return program;
  }

  /**
   * Find a node in the parse tree with the given symbol
   * @param node The root node to search from
   * @param symbol The symbol to search for
   * @returns The first node found with the given symbol, or null if not found
   */
  private findNode(node: ParseTreeNode, symbol: Symbol): ParseTreeNode | null {
    if (node.symbol === symbol) {
      return node;
    }
    
    for (const child of node.children) {
      const found = this.findNode(child, symbol);
      if (found) {
        return found;
      }
    }
    
    return null;
  }

  /**
   * Process a statement list node to extract statements
   * @param node The statement list node
   * @returns Array of statement AST nodes
   */
  private processStmtList(node: ParseTreeNode): Stmt[] {
    const statements: Stmt[] = [];
    
    // StmtList -> Stmt StmtList | ε
    if (node.children.length > 0) {
      const stmt = node.children[0];
      const stmtList = node.children[1];
      
      if (stmt.symbol === "Stmt") {
        const statement = this.processStmt(stmt);
        if (statement) {
          statements.push(statement);
        }
      }
      
      if (stmtList && stmtList.symbol === "StmtList") {
        statements.push(...this.processStmtList(stmtList));
      }
    }
    
    return statements;
  }

  /**
   * Process a statement node
   * @param node The statement node
   * @returns The corresponding AST statement node
   */
  private processStmt(node: ParseTreeNode): Stmt | null {
    if (node.children.length === 0) {
      return null;
    }
    
    const firstChild = node.children[0];
    switch (firstChild.symbol) {
      case "VarDecl":
        return this.processVarDecl(firstChild);
      case "FnDecl":
        return this.processFnDecl(firstChild);
      case "IfStmt":
        return this.processIfStmt(firstChild);
      case "WhileStmt":
        return this.processWhileStmt(firstChild);
      case "ForStmt":
        return this.processForStmt(firstChild);
      case "ReturnStmt":
        return this.processReturnStmt(firstChild);
      case "BreakStmt":
        return this.processBreakStmt(firstChild);
      case "ContinueStmt":
        return this.processContinueStmt(firstChild);
      case "ExprStmt":
        return this.processExprStmt(firstChild);
      default:
        return null;
    }
  }

  // Process specific statement types
  
  private processVarDecl(node: ParseTreeNode): VarDeclaration {
    // VarDecl -> let identifier = Expr ;
    // VarDecl -> const identifier = Expr ;
    // VarDecl -> let identifier ;
    const isConstant = node.children[0].symbol === "const";
    const identifierNode = node.children[1];
    const identifier = identifierNode.token?.value || "";
    
    let value: Expr | undefined;
    if (node.children.length > 3 && node.children[2].symbol === "=") {
      const exprNode = node.children[3];
      value = this.processExpr(exprNode);
    }
    
    return {
      kind: "VarDeclaration",
      constant: isConstant,
      identifier,
      value
    };
  }

  private processFnDecl(node: ParseTreeNode): FunctionDeclaration {
    // FnDecl -> fn identifier ( Params ) { Block }
    const identifierNode = node.children[1];
    const name = identifierNode.token?.value || "";
    
    const paramsNode = node.children[3];
    const parameters: string[] = this.processParams(paramsNode);
    
    const blockNode = node.children[6];
    const body: Stmt[] = this.processBlock(blockNode);
    
    return {
      kind: "FunctionDeclaration",
      name,
      parameters,
      body
    };
  }

  private processParams(node: ParseTreeNode): string[] {
    // Params -> ParamList | ε
    if (node.children.length === 0) {
      return [];
    }
    
    const paramList = node.children[0];
    return this.processParamList(paramList);
  }

  private processParamList(node: ParseTreeNode): string[] {
    // ParamList -> identifier , ParamList | identifier
    const params: string[] = [];
    
    const identifierNode = node.children[0];
    const param = identifierNode.token?.value || "";
    params.push(param);
    
    if (node.children.length > 1 && node.children[2].symbol === "ParamList") {
      params.push(...this.processParamList(node.children[2]));
    }
    
    return params;
  }

  private processIfStmt(node: ParseTreeNode): IfStatement {
    // IfStmt -> if ( Expr ) { Block }
    // IfStmt -> if ( Expr ) { Block } else { Block }
    const exprNode = node.children[2];
    const condition = this.processExpr(exprNode);
    
    const thenBlockNode = node.children[5];
    const thenStmts = this.processBlock(thenBlockNode);
    
    let elseStmts: Stmt[] | undefined;
    if (node.children.length > 7 && node.children[7].symbol === "else") {
      const elseBlockNode = node.children[9];
      elseStmts = this.processBlock(elseBlockNode);
    }
    
    return {
      kind: "IfStatement",
      condition,
      then: thenStmts,
      else: elseStmts
    };
  }

  private processWhileStmt(node: ParseTreeNode): WhileStatement {
    // WhileStmt -> while ( Expr ) { Block }
    const exprNode = node.children[2];
    const condition = this.processExpr(exprNode);
    
    const blockNode = node.children[5];
    const body = this.processBlock(blockNode);
    
    return {
      kind: "WhileStatement",
      condition,
      body
    };
  }

  private processForStmt(node: ParseTreeNode): ForStatement {
    // ForStmt -> for ( VarDecl Expr ; Expr ) { Block }
    const initNode = node.children[2];
    const init = this.processVarDecl(initNode);
    
    const conditionNode = node.children[3];
    const condition = this.processExpr(conditionNode);
    
    const updateNode = node.children[5];
    const update = this.processExpr(updateNode);
    
    const blockNode = node.children[8];
    const body = this.processBlock(blockNode);
    
    return {
      kind: "ForStatement",
      init,
      condition,
      update,
      body
    };
  }

  private processReturnStmt(node: ParseTreeNode): ReturnStatement {
    // ReturnStmt -> return Expr ;
    const exprNode = node.children[1];
    const value = this.processExpr(exprNode);
    
    return {
      kind: "ReturnStatement",
      value
    };
  }

  private processBreakStmt(node: ParseTreeNode): BreakStatement {
    // BreakStmt -> break ;
    return {
      kind: "BreakStatement"
    };
  }

  private processContinueStmt(node: ParseTreeNode): ContinueStatement {
    // ContinueStmt -> continue ;
    return {
      kind: "ContinueStatement"
    };
  }

  private processExprStmt(node: ParseTreeNode): ExpressionStatement {
    // ExprStmt -> Expr ;
    const exprNode = node.children[0];
    const expression = this.processExpr(exprNode);
    
    return {
      kind: "ExpressionStatement",
      expression
    };
  }

  private processBlock(node: ParseTreeNode): Stmt[] {
    // Block -> StmtList
    const stmtListNode = node.children[0];
    return this.processStmtList(stmtListNode);
  }

  private processExpr(node: ParseTreeNode): Expr {
    // Start at the top of the expression hierarchy
    return this.processAssignExpr(node);
  }
  
  private processAssignExpr(node: ParseTreeNode): Expr {
    // AssignExpr -> CompExpr = AssignExpr | CompExpr
    if (node.children.length === 3 && node.children[1].symbol === "=") {
      const leftNode = node.children[0];
      const rightNode = node.children[2];
      
      const assigne = this.processCompExpr(leftNode);
      const value = this.processAssignExpr(rightNode);
      
      return {
        kind: "AssignmentExpr",
        assigne,
        value
      };
    }
    
    return this.processCompExpr(node.children[0]);
  }
  
  private processCompExpr(node: ParseTreeNode): Expr {
    // CompExpr -> AddExpr op CompExpr | AddExpr
    if (node.children.length === 3 && node.children[1].symbol === "op") {
      const leftNode = node.children[0];
      const opNode = node.children[1];
      const rightNode = node.children[2];
      
      const left = this.processAddExpr(leftNode);
      const operator = opNode.token?.value || "";
      const right = this.processCompExpr(rightNode);
      
      return {
        kind: "BinaryExpr",
        left,
        right,
        operator
      };
    }
    
    return this.processAddExpr(node.children[0]);
  }
  
  private processAddExpr(node: ParseTreeNode): Expr {
    // AddExpr -> MultExpr op AddExpr | MultExpr
    if (node.children.length === 3 && node.children[1].symbol === "op") {
      const leftNode = node.children[0];
      const opNode = node.children[1];
      const rightNode = node.children[2];
      
      const left = this.processMultExpr(leftNode);
      const operator = opNode.token?.value || "";
      const right = this.processAddExpr(rightNode);
      
      return {
        kind: "BinaryExpr",
        left,
        right,
        operator
      };
    }
    
    return this.processMultExpr(node.children[0]);
  }
  
  private processMultExpr(node: ParseTreeNode): Expr {
    // MultExpr -> UnaryExpr op MultExpr | UnaryExpr
    if (node.children.length === 3 && node.children[1].symbol === "op") {
      const leftNode = node.children[0];
      const opNode = node.children[1];
      const rightNode = node.children[2];
      
      const left = this.processUnaryExpr(leftNode);
      const operator = opNode.token?.value || "";
      const right = this.processMultExpr(rightNode);
      
      return {
        kind: "BinaryExpr",
        left,
        right,
        operator
      };
    }
    
    return this.processUnaryExpr(node.children[0]);
  }
  
  private processUnaryExpr(node: ParseTreeNode): Expr {
    // UnaryExpr -> op UnaryExpr | CallExpr
    if (node.children.length === 2 && node.children[0].symbol === "op") {
      // Not fully implementing unary expressions now
      return this.processCallExpr(node.children[1]);
    }
    
    return this.processCallExpr(node.children[0]);
  }
  
  private processCallExpr(node: ParseTreeNode): Expr {
    // CallExpr -> MemberExpr ( Args ) CallExpr | MemberExpr ( Args ) | MemberExpr
    if (node.children.length >= 4 && node.children[1].symbol === "(") {
      const memberNode = node.children[0];
      const argsNode = node.children[2];
      
      const caller = this.processMemberExpr(memberNode);
      const args = this.processArgs(argsNode);
      
      // Handle chained calls
      if (node.children.length > 4 && node.children[4].symbol === "CallExpr") {
        return {
          kind: "CallExpr",
          caller: {
            kind: "CallExpr",
            caller,
            args
          },
          args: []
        };
      }
      
      return {
        kind: "CallExpr",
        caller,
        args
      };
    }
    
    return this.processMemberExpr(node.children[0]);
  }
  
  private processMemberExpr(node: ParseTreeNode): Expr {
    // MemberExpr -> PrimaryExpr . identifier MemberExpr | PrimaryExpr [ Expr ] MemberExpr | PrimaryExpr
    if (node.children.length > 1) {
      const primaryNode = node.children[0];
      const primary = this.processPrimaryExpr(primaryNode);
      
      if (node.children[1].symbol === ".") {
        // Dot notation (obj.prop)
        const identifierNode = node.children[2];
        const ident = identifierNode.token?.value || "";
        
        const member: MemberExpr = {
          kind: "MemberExpr",
          object: primary,
          property: {
            kind: "Identifier",
            symbol: ident
          },
          computed: false
        };
        
        // Handle chained member expressions
        if (node.children.length > 3 && node.children[3].symbol === "MemberExpr") {
          return {
            kind: "MemberExpr",
            object: member,
            property: {
              kind: "Identifier",
              symbol: ""
            },
            computed: false
          };
        }
        
        return member;
      } else if (node.children[1].symbol === "[") {
        // Computed property (obj[expr])
        const exprNode = node.children[2];
        const expr = this.processExpr(exprNode);
        
        const member: MemberExpr = {
          kind: "MemberExpr",
          object: primary,
          property: expr,
          computed: true
        };
        
        // Handle chained member expressions
        if (node.children.length > 4 && node.children[4].symbol === "MemberExpr") {
          return {
            kind: "MemberExpr",
            object: member,
            property: {
              kind: "Identifier",
              symbol: ""
            },
            computed: false
          };
        }
        
        return member;
      }
    }
    
    return this.processPrimaryExpr(node.children[0]);
  }
  
  private processPrimaryExpr(node: ParseTreeNode): Expr {
    // PrimaryExpr -> identifier | number | string | ( Expr ) | ObjLiteral | ArrayLiteral
    const firstChild = node.children[0];
    
    switch (firstChild.symbol) {
      case "identifier":
        return {
          kind: "Identifier",
          symbol: firstChild.token?.value || ""
        };
      
      case "number":
        return {
          kind: "NumericLiteral",
          value: parseFloat(firstChild.token?.value || "0")
        };
      
      case "string":
        return {
          kind: "StringLiteral",
          value: firstChild.token?.value || ""
        };
      
      case "(":
        return this.processExpr(node.children[1]);
      
      case "ObjLiteral":
        return this.processObjLiteral(firstChild);
      
      case "ArrayLiteral":
        return this.processArrayLiteral(firstChild);
      
      default:
        // Fallback for unparseable expressions
        return {
          kind: "Identifier",
          symbol: "undefined"
        };
    }
  }
  
  private processArgs(node: ParseTreeNode): Expr[] {
    // Args -> ArgList | ε
    if (node.children.length === 0 || node.children[0].symbol === EPSILON) {
      return [];
    }
    
    const argListNode = node.children[0];
    return this.processArgList(argListNode);
  }
  
  private processArgList(node: ParseTreeNode): Expr[] {
    // ArgList -> Expr , ArgList | Expr
    const args: Expr[] = [];
    
    const exprNode = node.children[0];
    args.push(this.processExpr(exprNode));
    
    if (node.children.length > 1 && node.children[2].symbol === "ArgList") {
      args.push(...this.processArgList(node.children[2]));
    }
    
    return args;
  }
  
  private processObjLiteral(node: ParseTreeNode): ObjectLiteral {
    // ObjLiteral -> { PropList }
    const propListNode = node.children.length > 1 ? node.children[1] : null;
    const properties: Property[] = propListNode ? this.processPropList(propListNode) : [];
    
    return {
      kind: "ObjectLiteral",
      properties
    };
  }
  
  private processPropList(node: ParseTreeNode): Property[] {
    // PropList -> Prop , PropList | Prop | ε
    if (node.children.length === 0) {
      return [];
    }
    
    const properties: Property[] = [];
    
    const propNode = node.children[0];
    properties.push(this.processProp(propNode));
    
    if (node.children.length > 1 && node.children[2].symbol === "PropList") {
      properties.push(...this.processPropList(node.children[2]));
    }
    
    return properties;
  }
  
  private processProp(node: ParseTreeNode): Property {
    // Prop -> identifier : Expr | identifier
    const identifierNode = node.children[0];
    const key = identifierNode.token?.value || "";
    
    let value: Expr | undefined;
    if (node.children.length > 1 && node.children[1].symbol === ":") {
      const exprNode = node.children[2];
      value = this.processExpr(exprNode);
    }
    
    return {
      kind: "Property",
      key,
      value
    };
  }
  
  private processArrayLiteral(node: ParseTreeNode): ArrayLiteral {
    // ArrayLiteral -> [ Elements ]
    const elementsNode = node.children.length > 1 ? node.children[1] : null;
    const elements: Expr[] = elementsNode ? this.processElements(elementsNode) : [];
    
    return {
      kind: "ArrayLiteral",
      elements
    };
  }
  
  private processElements(node: ParseTreeNode): Expr[] {
    // Elements -> Expr , Elements | Expr | ε
    if (node.children.length === 0) {
      return [];
    }
    
    const elements: Expr[] = [];
    
    const exprNode = node.children[0];
    elements.push(this.processExpr(exprNode));
    
    if (node.children.length > 1 && node.children[2].symbol === "Elements") {
      elements.push(...this.processElements(node.children[2]));
    }
    
    return elements;
  }
} 