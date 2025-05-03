import { Grammar, NonTerminal, Terminal, EPSILON, END_MARKER, Production } from "./grammar.ts";
import { FirstSets, FollowSets, calculateFirstOfSequence } from "./first_follow.ts";

export type ParseTable = Map<NonTerminal, Map<Terminal, Production>>;

/**
 * Build the LL(1) parse table for the given grammar
 * @param grammar The grammar to analyze
 * @param firstSets The previously calculated FIRST sets
 * @param followSets The previously calculated FOLLOW sets
 * @returns The LL(1) parse table
 */
export function buildParseTable(
  grammar: Grammar,
  firstSets: FirstSets,
  followSets: FollowSets
): ParseTable {
  const parseTable: ParseTable = new Map();
  
  // Initialize parse table with empty maps
  for (const nonTerminal of grammar.nonTerminals) {
    parseTable.set(nonTerminal, new Map());
  }
  
  // For each production A -> α
  for (const production of grammar.productions) {
    const { lhs, rhs } = production;
    const ntMap = parseTable.get(lhs)!;
    
    // If rhs is epsilon
    if (rhs.length === 1 && rhs[0] === EPSILON) {
      // For each terminal in FOLLOW(A), add this production
      for (const terminal of followSets.get(lhs)!) {
        if (ntMap.has(terminal)) {
          console.warn(`Grammar is not LL(1): Conflict in table[${lhs}, ${terminal}]`);
        }
        ntMap.set(terminal, production);
      }
    } else {
      // Calculate FIRST(α)
      const firstOfRhs = calculateFirstOfSequence(rhs, firstSets);
      
      // For each terminal in FIRST(α), add this production
      for (const terminal of firstOfRhs) {
        if (terminal === EPSILON) {
          continue;
        }
        
        if (ntMap.has(terminal)) {
          console.warn(`Grammar is not LL(1): Conflict in table[${lhs}, ${terminal}]`);
        }
        ntMap.set(terminal, production);
      }
      
      // If ε is in FIRST(α), for each terminal in FOLLOW(A), add this production
      if (firstOfRhs.has(EPSILON)) {
        for (const terminal of followSets.get(lhs)!) {
          if (ntMap.has(terminal)) {
            console.warn(`Grammar is not LL(1): Conflict in table[${lhs}, ${terminal}]`);
          }
          ntMap.set(terminal, production);
        }
      }
    }
  }
  
  // Add error handling to the parse table
  addErrorRecovery(parseTable, grammar, followSets);
  
  return parseTable;
}

/**
 * Add error recovery entries to the parse table
 * @param parseTable The parse table to modify
 * @param grammar The grammar
 * @param followSets The previously calculated FOLLOW sets
 */
function addErrorRecovery(
  parseTable: ParseTable,
  grammar: Grammar,
  followSets: FollowSets
): void {
  // Don't try error recovery at this point
  // This can be expanded in the future
}

/**
 * Print the parse table for debugging
 * @param parseTable The parse table to print
 * @param grammar The grammar
 */
export function printParseTable(parseTable: ParseTable, grammar: Grammar): void {
  console.log("Parse Table:");
  
  // Get all terminals
  const terminals = Array.from(grammar.terminals).filter(t => t !== EPSILON);
  
  // Print header
  let header = "NT\\T";
  for (const terminal of terminals) {
    header += `\t${terminal}`;
  }
  console.log(header);
  
  // Print rows
  for (const nonTerminal of grammar.nonTerminals) {
    let row = `${nonTerminal}`;
    const ntMap = parseTable.get(nonTerminal)!;
    
    for (const terminal of terminals) {
      const production = ntMap.get(terminal);
      if (production) {
        row += `\t${production.id}`;
      } else {
        row += "\t-";
      }
    }
    
    console.log(row);
  }
}

/**
 * Check if the grammar is LL(1)
 * @param parseTable The parse table
 * @param grammar The grammar
 * @returns True if the grammar is LL(1), false otherwise
 */
export function isLL1(parseTable: ParseTable, grammar: Grammar): boolean {
  for (const [nonTerminal, ntMap] of parseTable.entries()) {
    // Check for multiple productions for the same (nonTerminal, terminal) pair
    const terminalSet = new Set<Terminal>();
    for (const [terminal, _] of ntMap.entries()) {
      if (terminalSet.has(terminal)) {
        return false;
      }
      terminalSet.add(terminal);
    }
  }
  
  return true;
} 