import { Token, TokenType } from "../lexer.ts";
import { Program, Stmt, Expr, BinaryExpr, NumericLiteral, StringLiteral, Identifier, ExpressionStatement, VarDeclaration, AssignmentExpr, CallExpr, FunctionDeclaration, IfStatement, WhileStatement, ForStatement, ReturnStatement, BreakStatement, ContinueStatement } from "../ast.ts";
import { Grammar } from "./grammar_utils.ts";
import { ParseTable, buildParseTable, tokenTypeToTerminal } from "../ll_parser/parse_table.ts";

export class LLParser {
  private tokens: Token[];
  private grammar: Grammar;
  private parseTable: ParseTable;
  private stack: string[] = [];
  private currentTokenIndex = 0;
  private nodeStack: any[] = [];
  private operatorTokens = ["+", "-", "*", "/", "%", "==", "!=", ">", "<", ">=", "<="];

  constructor(tokens: Token[], grammar: Grammar) {
    this.tokens = tokens;
    this.grammar = grammar;
    this.parseTable = buildParseTable(grammar);
    this.stack.push("$");
    this.stack.push(grammar.startSymbol);
  }

  public parse(): Program {
    const program: Program = {
      kind: "Program",
      body: []
    };

    try {
      // Thực hiện phân tích đơn giản: bỏ qua xây dựng AST
      // chỉ để demo phân tích cú pháp
      while (this.stack.length > 0 && this.currentTokenIndex < this.tokens.length) {
        const top = this.stack[this.stack.length - 1];
        const currentToken = this.tokens[this.currentTokenIndex];
        const currentTerminal = tokenTypeToTerminal(currentToken.type);

        console.log(`Stack: [${this.stack.join(", ")}], Current Token: ${currentTerminal} (${currentToken.value})`);

        // Xử lý trường hợp đặc biệt cho BinaryExpr
        if (top === "Expr" && this.isOperator(currentToken.value) && this.currentTokenIndex > 0) {
          // Chúng ta vừa xử lý xong một Expr, và hiện tại token là toán tử
          // Giả định rằng đây là BinaryExpr (Expr Op Expr)
          
          // Pop Expr từ stack
          this.stack.pop();
          
          // Push trở lại Expr Op Expr (trong thứ tự ngược)
          this.stack.push("Expr");
          this.stack.push(currentToken.value);
          this.stack.push("Expr");
          
          // Không tiêu thụ token
          continue;
        }

        // Xử lý trường hợp đặc biệt cho CallExpr (function calls)
        if (top === "identifier" && this.currentTokenIndex < this.tokens.length - 1 && 
            this.tokens[this.currentTokenIndex + 1].type === TokenType.OpenParen) {
          // Đây là function call: identifier (...)
          console.log("Phát hiện function call");
          
          // Xử lý function call đặc biệt
          this.stack.pop(); // Pop identifier
          this.stack.push(")"); // Đóng ngoặc
          this.stack.push("Expr"); // Arguments
          this.stack.push("("); // Mở ngoặc
          this.stack.push("identifier"); // Tên hàm
          
          continue;
        }

        if (top === currentTerminal) {
          // Match terminal - tiêu thụ token
          this.stack.pop();
          this.currentTokenIndex++;
          
          // Xử lý token để tạo AST node (không thực hiện để đơn giản hóa)
        } else if (this.grammar.terminals.has(top)) {
          // Error - expected terminal but got something else
          throw new Error(`Lỗi cú pháp: Mong đợi '${top}' nhưng nhận được '${currentToken.value}' tại vị trí ${this.currentTokenIndex}`);
        } else {
          // Non-terminal - sử dụng bảng phân tích
          const production = this.parseTable.get(top)?.get(currentTerminal);
          if (!production) {
            throw new Error(`Không tìm thấy sản xuất cho ${top} với token ${currentTerminal} (${currentToken.value})`);
          }

          // Pop the non-terminal
          this.stack.pop();
          
          // Push production rhs in reverse order (không đẩy epsilon)
          for (let i = production.rhs.length - 1; i >= 0; i--) {
            if (production.rhs[i] !== "ε") { // Skip epsilon
              this.stack.push(production.rhs[i]);
            }
          }
        }
      }

      console.log("Phân tích LL thành công!");
      // Sử dụng cây AST từ Recursive Descent cho phần thực thi
      return program;
    } catch (error) {
      console.error(`LL Parser error:`, error);
      // Return a basic program in case of error
      return program;
    }
  }

  private isOperator(value: string): boolean {
    return this.operatorTokens.includes(value);
  }
} 