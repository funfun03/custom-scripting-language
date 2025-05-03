import { Token } from "../lexer.ts";
import { Program } from "../ast.ts";
import { ParserInterface } from "../parser_interface.ts";
import { EnhancedLLParser } from "./enhanced_ll_parser.ts";
import { enhancedGrammar, tokenTypeToTerminal } from "./grammar.ts";
import { calculateFirstSets, calculateFollowSets } from "./first_follow.ts";
import { buildParseTable, printParseTable, isLL1 } from "./parse_table.ts";
import { ll1Grammar } from "./ll1_grammar.ts";
import { LL1Parser } from "./ll1_parser.ts";

/**
 * Factory function to create a new enhanced LL parser
 * @returns An instance of the enhanced LL parser
 */
export function createEnhancedLLParser(): ParserInterface {
  // Use the LL1Parser with the simplified grammar for basic operations
  return new LL1Parser(ll1Grammar);
}

/**
 * Debugging function to print grammar analysis for the enhanced LL parser
 */
export function analyzeGrammar(): void {
  console.log("Analyzing grammar...");
  
  // Use the LL1 grammar instead of the enhanced grammar for analysis
  const grammar = ll1Grammar;
  
  // Calculate FIRST and FOLLOW sets
  const firstSets = calculateFirstSets(grammar);
  const followSets = calculateFollowSets(grammar, firstSets);
  
  // Build and check the parse table
  const parseTable = buildParseTable(grammar, firstSets, followSets);
  
  // Print FIRST sets
  console.log("\nFIRST sets:");
  for (const [nonTerminal, set] of firstSets.entries()) {
    if (grammar.nonTerminals.has(nonTerminal)) {
      console.log(`FIRST(${nonTerminal}) = {${Array.from(set).join(", ")}}`);
    }
  }
  
  // Print FOLLOW sets
  console.log("\nFOLLOW sets:");
  for (const [nonTerminal, set] of followSets.entries()) {
    console.log(`FOLLOW(${nonTerminal}) = {${Array.from(set).join(", ")}}`);
  }
  
  // Print parse table
  console.log("\nParse Table:");
  printParseTable(parseTable, grammar);
  
  // Check if grammar is LL(1)
  const isLLOne = isLL1(parseTable, grammar);
  console.log(`\nIs the grammar LL(1)? ${isLLOne ? "Yes" : "No"}`);
}

/**
 * Enhanced LL Parser implementation that conforms to the ParserInterface
 */
export class LLParserAdapter implements ParserInterface {
  private parser: LL1Parser;
  
  constructor() {
    // Use the LL1Parser with the simplified grammar
    this.parser = new LL1Parser(ll1Grammar);
  }
  
  /**
   * Produce an AST from source code
   * @param sourceCode The source code to parse
   * @returns An abstract syntax tree representation of the program
   */
  public produceAST(sourceCode: string): Program {
    // Use the existing lexer to tokenize the source code
    // This will be handled inside the parser's produceAST method
    return this.parser.produceAST(sourceCode);
  }
  
  /**
   * Parse tokens into an AST
   * @param tokens The tokens to parse
   * @returns An abstract syntax tree representation of the program
   */
  public parse(tokens: Token[]): Program {
    return this.parser.parse(tokens);
  }
} 