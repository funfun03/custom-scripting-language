import { Program } from "./ast.ts";
import { Token } from "./lexer.ts";

export enum ParserType {
  RecursiveDescent,
  LL,
  EnhancedLL
}

export interface ParserInterface {
  parse(tokens: Token[]): Program;
  produceAST(sourceCode: string): Program;
} 