import { TokenType } from "../lexer.ts";
import { Grammar, Production, Terminal, NonTerminal, Symbol, EPSILON } from "./grammar_utils.ts";

export type ParseTable = Map<NonTerminal, Map<Terminal, Production>>;

export function tokenTypeToTerminal(type: TokenType): Terminal {
  switch (type) {
    case TokenType.Let:
      return "let";
    case TokenType.Const:
      return "const";
    case TokenType.Identifier:
      return "identifier";
    case TokenType.Equals:
      return "=";
    case TokenType.Semicolon:
      return ";";
    case TokenType.OpenParen:
      return "(";
    case TokenType.CloseParen:
      return ")";
    case TokenType.OpenBrace:
      return "{";
    case TokenType.CloseBrace:
      return "}";
    case TokenType.OpenBracket:
      return "[";
    case TokenType.CloseBracket:
      return "]";
    case TokenType.Comma:
      return ",";
    case TokenType.Colon:
      return ":";
    case TokenType.Dot:
      return ".";
    case TokenType.Number:
      return "number";
    case TokenType.String:
      return "string";
    case TokenType.Fn:
      return "fn";
    case TokenType.If:
      return "if";
    case TokenType.Else:
      return "else";
    case TokenType.While:
      return "while";
    case TokenType.For:
      return "for";
    case TokenType.Return:
      return "return";
    case TokenType.Break:
      return "break";
    case TokenType.Continue:
      return "continue";
    case TokenType.EOF:
      return "$";
    default:
      return type.toString();
  }
}

// Cải tiến và sửa hàm xây dựng bảng phân tích
export function buildParseTable(grammar: Grammar): ParseTable {
  const parseTable: ParseTable = new Map();
  const visited = new Set<string>();

  // Khởi tạo bảng phân tích
  for (const nonTerminal of grammar.nonTerminals) {
    parseTable.set(nonTerminal, new Map());
  }

  // Xử lý đặc biệt cho Program - để có thể bắt đầu với bất kỳ token nào
  const programMap = parseTable.get("Program")!;
  const programProd = grammar.productions.find(p => p.lhs === "Program" && p.rhs[0] === "Stmt");
  if (programProd) {
    // Program có thể bắt đầu với bất kỳ token nào (except EOF)
    for (const terminal of grammar.terminals) {
      if (terminal !== "$") {
        programMap.set(terminal, programProd);
      }
    }
  }

  // Xử lý đặc biệt cho Stmt
  const stmtMap = parseTable.get("Stmt")!;
  
  // Stmt -> IfStatement
  const ifStmtProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "IfStatement");
  if (ifStmtProd) {
    stmtMap.set("if", ifStmtProd);
  }
  
  // Stmt -> VarDeclaration
  const varDeclProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "VarDeclaration");
  if (varDeclProd) {
    stmtMap.set("let", varDeclProd);
    stmtMap.set("const", varDeclProd);
  }
  
  // Stmt -> FunctionDeclaration
  const fnDeclProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "FunctionDeclaration");
  if (fnDeclProd) {
    stmtMap.set("fn", fnDeclProd);
  }
  
  // Stmt -> WhileStatement
  const whileStmtProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "WhileStatement");
  if (whileStmtProd) {
    stmtMap.set("while", whileStmtProd);
  }
  
  // Stmt -> ForStatement
  const forStmtProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "ForStatement");
  if (forStmtProd) {
    stmtMap.set("for", forStmtProd);
  }
  
  // Stmt -> ReturnStatement
  const returnStmtProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "ReturnStatement");
  if (returnStmtProd) {
    stmtMap.set("return", returnStmtProd);
  }
  
  // Stmt -> BreakStatement
  const breakStmtProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "BreakStatement");
  if (breakStmtProd) {
    stmtMap.set("break", breakStmtProd);
  }
  
  // Stmt -> ContinueStatement
  const continueStmtProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "ContinueStatement");
  if (continueStmtProd) {
    stmtMap.set("continue", continueStmtProd);
  }
  
  // Stmt -> Expr;
  const exprStmtProd = grammar.productions.find(p => p.lhs === "Stmt" && p.rhs[0] === "Expr");
  if (exprStmtProd) {
    stmtMap.set("identifier", exprStmtProd);
    stmtMap.set("number", exprStmtProd);
    stmtMap.set("string", exprStmtProd);
    stmtMap.set("(", exprStmtProd);
  }

  // Xử lý đặc biệt cho IfStatement
  const ifStmtMap = parseTable.get("IfStatement")!;
  const simpleIfProd = grammar.productions.find(p => p.lhs === "IfStatement" && p.rhs.length === 7);
  const ifElseProd = grammar.productions.find(p => p.lhs === "IfStatement" && p.rhs.length === 11);
  
  if (simpleIfProd) {
    ifStmtMap.set("if", simpleIfProd);
  } else if (ifElseProd) {
    ifStmtMap.set("if", ifElseProd);
  }

  // Xử lý đặc biệt cho Block
  const blockMap = parseTable.get("Block")!;
  const blockStmtProd = grammar.productions.find(p => p.lhs === "Block" && p.rhs[0] === "Stmt");
  const blockEmptyProd = grammar.productions.find(p => p.lhs === "Block" && p.rhs[0] === EPSILON);
  
  if (blockStmtProd) {
    // Block có thể bắt đầu với bất kỳ token nào có thể bắt đầu Stmt
    for (const [terminal, _] of stmtMap.entries()) {
      blockMap.set(terminal, blockStmtProd);
    }
  }
  
  if (blockEmptyProd) {
    blockMap.set("}", blockEmptyProd);
  }

  // Xử lý đặc biệt cho Expr
  const exprMap = parseTable.get("Expr")!;
  const idExprProd = grammar.productions.find(p => p.lhs === "Expr" && p.rhs[0] === "identifier");
  const numExprProd = grammar.productions.find(p => p.lhs === "Expr" && p.rhs[0] === "number");
  const strExprProd = grammar.productions.find(p => p.lhs === "Expr" && p.rhs[0] === "string");
  const parenExprProd = grammar.productions.find(p => p.lhs === "Expr" && p.rhs[0] === "(");
  
  if (idExprProd) exprMap.set("identifier", idExprProd);
  if (numExprProd) exprMap.set("number", numExprProd);
  if (strExprProd) exprMap.set("string", strExprProd);
  if (parenExprProd) exprMap.set("(", parenExprProd);

  // Xử lý đặc biệt cho bảng phân tích
  // Bổ sung các quy tắc dành riêng cho BinaryExpr để xử lý phép toán
  const operatorTokens = ["+", "-", "*", "/", "%", "==", "!=", ">", "<", ">=", "<="];
  
  // Xử lý đặc biệt cho binary expression và comparisons (>, <, ==, !=...)
  // Cần đặc biệt cho phép kết hợp Expr -> Expr Op Expr
  const binaryExprProds = grammar.productions.filter(p => 
    p.lhs === "Expr" && p.rhs.length === 3 && p.rhs[0] === "Expr" && operatorTokens.includes(p.rhs[1])
  );
  
  if (binaryExprProds.length > 0) {
    // Không thể đặt trực tiếp vào bảng vì sẽ tạo xung đột
    // Nhưng chúng ta có thể xử lý đặc biệt trong mã phân tích
    // ở đây chỉ demo khả năng parsing
  }

  // Xử lý đặc biệt cho VarDeclaration
  const varDeclMap = parseTable.get("VarDeclaration")!;
  const letDeclProd = grammar.productions.find(p => p.lhs === "VarDeclaration" && p.rhs[0] === "let");
  const constDeclProd = grammar.productions.find(p => p.lhs === "VarDeclaration" && p.rhs[0] === "const");
  if (letDeclProd) varDeclMap.set("let", letDeclProd);
  if (constDeclProd) varDeclMap.set("const", constDeclProd);

  // Xử lý đặc biệt cho CallExpr (function calls)
  // Cần bổ sung quy tắc cho Expr -> identifier (...)
  const callExprProd = grammar.productions.find(p => 
    p.lhs === "Expr" && p.rhs.length > 0 && p.rhs[0] === "identifier"
  );
  
  if (callExprProd && exprMap) {
    // Một identifier có thể là một CallExpr
    exprMap.set("identifier", callExprProd);
  }

  return parseTable;
}

// Hàm tính toán tập Predict cho một non-terminal
function calculatePredictSet(grammar: Grammar, nonTerminal: NonTerminal, visited: Set<string>): Set<Terminal> {
  const result = new Set<Terminal>();
  
  // Tránh đệ quy vô hạn
  const key = nonTerminal;
  if (visited.has(key)) {
    return result;
  }
  visited.add(key);

  // Tìm tất cả các production có LHS là nonTerminal
  for (const production of grammar.productions) {
    if (production.lhs === nonTerminal) {
      // Nếu RHS bắt đầu bằng terminal (khác epsilon)
      if (production.rhs.length > 0 && grammar.terminals.has(production.rhs[0] as Terminal) && production.rhs[0] !== EPSILON) {
        result.add(production.rhs[0] as Terminal);
      } 
      // Nếu RHS bắt đầu bằng non-terminal khác
      else if (production.rhs.length > 0 && grammar.nonTerminals.has(production.rhs[0] as NonTerminal)) {
        const innerPredictSet = calculatePredictSet(grammar, production.rhs[0] as NonTerminal, visited);
        for (const terminal of innerPredictSet) {
          result.add(terminal);
        }
      }
      // Nếu RHS là epsilon
      else if (production.rhs.length === 1 && production.rhs[0] === EPSILON) {
        // Epsilon không được thêm vào tập Predict
      }
    }
  }

  visited.delete(key);
  return result;
} 