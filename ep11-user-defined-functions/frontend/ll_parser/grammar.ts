import { Grammar } from "./grammar_utils.ts";
import { TokenType } from "../lexer.ts";

export const grammar: Grammar = {
  terminals: new Set([
    TokenType[TokenType.Let],
    TokenType[TokenType.Const],
    TokenType[TokenType.Fn],
    TokenType[TokenType.If],
    TokenType[TokenType.While],
    TokenType[TokenType.For],
    TokenType[TokenType.Return],
    TokenType[TokenType.Break],
    TokenType[TokenType.Continue],
    TokenType[TokenType.Identifier],
    TokenType[TokenType.Number],
    TokenType[TokenType.String],
    TokenType[TokenType.OpenParen],
    TokenType[TokenType.CloseParen],
    TokenType[TokenType.OpenBrace],
    TokenType[TokenType.CloseBrace],
    TokenType[TokenType.OpenBracket],
    TokenType[TokenType.CloseBracket],
    TokenType[TokenType.Equals],
    TokenType[TokenType.Semicolon],
    TokenType[TokenType.Comma],
    TokenType[TokenType.Dot],
    TokenType[TokenType.BinaryOperator],
    TokenType[TokenType.EOF]
  ]),
  nonTerminals: new Set([
    "Program",
    "Stmt",
    "VarDeclaration",
    "FunctionDeclaration",
    "IfStatement",
    "WhileStatement",
    "ForStatement",
    "ReturnStatement",
    "BreakStatement",
    "ContinueStatement",
    "Expr",
    "AssignmentExpr",
    "LogicalExpr",
    "ComparisonExpr",
    "AdditiveExpr",
    "MultiplicativeExpr",
    "UnaryExpr",
    "PrimaryExpr",
    "CallExpr",
    "MemberExpr",
    "ArrayExpr",
    "ObjectExpr",
    "Block"
  ]),
  productions: [
    // Program
    { lhs: "Program", rhs: ["Stmt", "Program"] },
    { lhs: "Program", rhs: [] },

    // Statements
    { lhs: "Stmt", rhs: ["VarDeclaration"] },
    { lhs: "Stmt", rhs: ["FunctionDeclaration"] },
    { lhs: "Stmt", rhs: ["IfStatement"] },
    { lhs: "Stmt", rhs: ["WhileStatement"] },
    { lhs: "Stmt", rhs: ["ForStatement"] },
    { lhs: "Stmt", rhs: ["ReturnStatement"] },
    { lhs: "Stmt", rhs: ["BreakStatement"] },
    { lhs: "Stmt", rhs: ["ContinueStatement"] },
    { lhs: "Stmt", rhs: ["Expr"] },

    // Variable Declaration
    { lhs: "VarDeclaration", rhs: [TokenType[TokenType.Let], TokenType[TokenType.Identifier], TokenType[TokenType.Equals], "Expr", TokenType[TokenType.Semicolon]] },
    { lhs: "VarDeclaration", rhs: [TokenType[TokenType.Const], TokenType[TokenType.Identifier], TokenType[TokenType.Equals], "Expr", TokenType[TokenType.Semicolon]] },

    // Function Declaration
    { lhs: "FunctionDeclaration", rhs: [TokenType[TokenType.Fn], TokenType[TokenType.Identifier], TokenType[TokenType.OpenParen], "Params", TokenType[TokenType.CloseParen], "Block"] },
    { lhs: "Params", rhs: [TokenType[TokenType.Identifier], "ParamsTail"] },
    { lhs: "Params", rhs: [] },
    { lhs: "ParamsTail", rhs: [TokenType[TokenType.Comma], TokenType[TokenType.Identifier], "ParamsTail"] },
    { lhs: "ParamsTail", rhs: [] },

    // Expressions
    { lhs: "Expr", rhs: ["AssignmentExpr"] },
    { lhs: "AssignmentExpr", rhs: ["LogicalExpr"] },
    { lhs: "AssignmentExpr", rhs: ["PrimaryExpr", TokenType[TokenType.Equals], "AssignmentExpr"] },
    { lhs: "LogicalExpr", rhs: ["ComparisonExpr"] },
    { lhs: "LogicalExpr", rhs: ["LogicalExpr", TokenType[TokenType.BinaryOperator], "ComparisonExpr"] },
    { lhs: "ComparisonExpr", rhs: ["AdditiveExpr"] },
    { lhs: "ComparisonExpr", rhs: ["ComparisonExpr", TokenType[TokenType.BinaryOperator], "AdditiveExpr"] },
    { lhs: "AdditiveExpr", rhs: ["MultiplicativeExpr"] },
    { lhs: "AdditiveExpr", rhs: ["AdditiveExpr", TokenType[TokenType.BinaryOperator], "MultiplicativeExpr"] },
    { lhs: "MultiplicativeExpr", rhs: ["UnaryExpr"] },
    { lhs: "MultiplicativeExpr", rhs: ["MultiplicativeExpr", TokenType[TokenType.BinaryOperator], "UnaryExpr"] },
    { lhs: "UnaryExpr", rhs: ["PrimaryExpr"] },
    { lhs: "UnaryExpr", rhs: [TokenType[TokenType.BinaryOperator], "UnaryExpr"] },
    { lhs: "PrimaryExpr", rhs: [TokenType[TokenType.Identifier]] },
    { lhs: "PrimaryExpr", rhs: [TokenType[TokenType.Number]] },
    { lhs: "PrimaryExpr", rhs: [TokenType[TokenType.String]] },
    { lhs: "PrimaryExpr", rhs: [TokenType[TokenType.OpenParen], "Expr", TokenType[TokenType.CloseParen]] },
    { lhs: "PrimaryExpr", rhs: ["ArrayExpr"] },
    { lhs: "PrimaryExpr", rhs: ["ObjectExpr"] },
    { lhs: "PrimaryExpr", rhs: ["CallExpr"] },
    { lhs: "PrimaryExpr", rhs: ["MemberExpr"] },

    // Array and Object Expressions
    { lhs: "ArrayExpr", rhs: [TokenType[TokenType.OpenBracket], "ArrayElements", TokenType[TokenType.CloseBracket]] },
    { lhs: "ArrayElements", rhs: ["Expr", "ArrayElementsTail"] },
    { lhs: "ArrayElements", rhs: [] },
    { lhs: "ArrayElementsTail", rhs: [TokenType[TokenType.Comma], "Expr", "ArrayElementsTail"] },
    { lhs: "ArrayElementsTail", rhs: [] },
    { lhs: "ObjectExpr", rhs: [TokenType[TokenType.OpenBrace], "ObjectProperties", TokenType[TokenType.CloseBrace]] },
    { lhs: "ObjectProperties", rhs: ["ObjectProperty", "ObjectPropertiesTail"] },
    { lhs: "ObjectProperties", rhs: [] },
    { lhs: "ObjectPropertiesTail", rhs: [TokenType[TokenType.Comma], "ObjectProperty", "ObjectPropertiesTail"] },
    { lhs: "ObjectPropertiesTail", rhs: [] },
    { lhs: "ObjectProperty", rhs: [TokenType[TokenType.Identifier], TokenType[TokenType.Colon], "Expr"] },
    { lhs: "ObjectProperty", rhs: [TokenType[TokenType.Identifier]] },

    // Call and Member Expressions
    { lhs: "CallExpr", rhs: ["PrimaryExpr", TokenType[TokenType.OpenParen], "Args", TokenType[TokenType.CloseParen]] },
    { lhs: "Args", rhs: ["Expr", "ArgsTail"] },
    { lhs: "Args", rhs: [] },
    { lhs: "ArgsTail", rhs: [TokenType[TokenType.Comma], "Expr", "ArgsTail"] },
    { lhs: "ArgsTail", rhs: [] },
    { lhs: "MemberExpr", rhs: ["PrimaryExpr", TokenType[TokenType.Dot], TokenType[TokenType.Identifier]] },
    { lhs: "MemberExpr", rhs: ["PrimaryExpr", TokenType[TokenType.OpenBracket], "Expr", TokenType[TokenType.CloseBracket]] },

    // Block
    { lhs: "Block", rhs: [TokenType[TokenType.OpenBrace], "StmtList", TokenType[TokenType.CloseBrace]] },
    { lhs: "StmtList", rhs: ["Stmt", "StmtList"] },
    { lhs: "StmtList", rhs: [] }
  ],
  startSymbol: "Program"
}; 