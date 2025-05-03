import { Grammar, Terminal, NonTerminal, Symbol, EPSILON, Production } from "./grammar.ts";

export type FirstSets = Map<Symbol, Set<Terminal>>;
export type FollowSets = Map<NonTerminal, Set<Terminal>>;

/**
 * Calculate FIRST sets for all symbols in the grammar
 * @param grammar The grammar to analyze
 * @returns A map from symbols to their FIRST sets
 */
export function calculateFirstSets(grammar: Grammar): FirstSets {
  const firstSets: FirstSets = new Map();
  
  // Initialize FIRST sets
  // For terminals, FIRST(t) = {t}
  for (const terminal of grammar.terminals) {
    const terminalSet = new Set<Terminal>();
    terminalSet.add(terminal);
    firstSets.set(terminal, terminalSet);
  }
  
  // For non-terminals, initialize with empty sets
  for (const nonTerminal of grammar.nonTerminals) {
    firstSets.set(nonTerminal, new Set<Terminal>());
  }
  
  // Special case for epsilon
  if (!firstSets.has(EPSILON)) {
    const epsilonSet = new Set<Terminal>();
    epsilonSet.add(EPSILON);
    firstSets.set(EPSILON, epsilonSet);
  }
  
  let changed = true;
  while (changed) {
    changed = false;
    
    // For each production A -> α
    for (const production of grammar.productions) {
      const { lhs, rhs } = production;
      const lhsFirstSet = firstSets.get(lhs)!;
      
      // If rhs is epsilon, add epsilon to FIRST(lhs)
      if (rhs.length === 1 && rhs[0] === EPSILON) {
        const beforeSize = lhsFirstSet.size;
        lhsFirstSet.add(EPSILON);
        if (lhsFirstSet.size > beforeSize) {
          changed = true;
        }
        continue;
      }
      
      // Calculate FIRST of rhs
      let allDeriveEpsilon = true;
      for (let i = 0; i < rhs.length; i++) {
        const symbol = rhs[i];
        const symbolFirstSet = firstSets.get(symbol)!;
        
        // Add FIRST(symbol) - {ε} to FIRST(lhs)
        const beforeSize = lhsFirstSet.size;
        for (const terminal of symbolFirstSet) {
          if (terminal !== EPSILON) {
            lhsFirstSet.add(terminal);
          }
        }
        if (lhsFirstSet.size > beforeSize) {
          changed = true;
        }
        
        // If symbol doesn't derive epsilon, we're done with this production
        if (!symbolFirstSet.has(EPSILON)) {
          allDeriveEpsilon = false;
          break;
        }
      }
      
      // If all symbols in rhs can derive epsilon, add epsilon to FIRST(lhs)
      if (allDeriveEpsilon) {
        const beforeSize = lhsFirstSet.size;
        lhsFirstSet.add(EPSILON);
        if (lhsFirstSet.size > beforeSize) {
          changed = true;
        }
      }
    }
  }
  
  return firstSets;
}

/**
 * Calculate FOLLOW sets for all non-terminals in the grammar
 * @param grammar The grammar to analyze
 * @param firstSets The previously calculated FIRST sets
 * @returns A map from non-terminals to their FOLLOW sets
 */
export function calculateFollowSets(grammar: Grammar, firstSets: FirstSets): FollowSets {
  const followSets: FollowSets = new Map();
  
  // Initialize FOLLOW sets with empty sets
  for (const nonTerminal of grammar.nonTerminals) {
    followSets.set(nonTerminal, new Set<Terminal>());
  }
  
  // Add $ to FOLLOW(Start)
  followSets.get(grammar.startSymbol)!.add("$");
  
  let changed = true;
  while (changed) {
    changed = false;
    
    // For each production A -> αBβ
    for (const production of grammar.productions) {
      const { lhs, rhs } = production;
      
      // For each non-terminal B in RHS
      for (let i = 0; i < rhs.length; i++) {
        const symbol = rhs[i];
        
        // Skip if symbol is a terminal
        if (!grammar.nonTerminals.has(symbol)) {
          continue;
        }
        
        const symbolFollowSet = followSets.get(symbol)!;
        const beforeSize = symbolFollowSet.size;
        
        // Case 1: A -> αBβ, add FIRST(β) - {ε} to FOLLOW(B)
        if (i < rhs.length - 1) {
          // Calculate FIRST of everything after B
          const remainingSymbols = rhs.slice(i + 1);
          const firstOfRemaining = calculateFirstOfSequence(remainingSymbols, firstSets);
          
          // Add FIRST(β) - {ε} to FOLLOW(B)
          for (const terminal of firstOfRemaining) {
            if (terminal !== EPSILON) {
              symbolFollowSet.add(terminal);
            }
          }
          
          // Case 2: A -> αBβ and ε is in FIRST(β), add FOLLOW(A) to FOLLOW(B)
          if (firstOfRemaining.has(EPSILON)) {
            // Add FOLLOW(A) to FOLLOW(B)
            const lhsFollowSet = followSets.get(lhs)!;
            for (const terminal of lhsFollowSet) {
              symbolFollowSet.add(terminal);
            }
          }
        } 
        // Case 3: A -> αB, add FOLLOW(A) to FOLLOW(B)
        else {
          const lhsFollowSet = followSets.get(lhs)!;
          for (const terminal of lhsFollowSet) {
            symbolFollowSet.add(terminal);
          }
        }
        
        if (symbolFollowSet.size > beforeSize) {
          changed = true;
        }
      }
    }
  }
  
  return followSets;
}

/**
 * Calculate the FIRST set of a sequence of symbols
 * @param sequence Sequence of symbols
 * @param firstSets Previously calculated FIRST sets
 * @returns FIRST set of the sequence
 */
export function calculateFirstOfSequence(sequence: Symbol[], firstSets: FirstSets): Set<Terminal> {
  const result = new Set<Terminal>();
  
  // If sequence is empty, return {ε}
  if (sequence.length === 0) {
    result.add(EPSILON);
    return result;
  }
  
  // Calculate FIRST of sequence
  let allDeriveEpsilon = true;
  for (let i = 0; i < sequence.length; i++) {
    const symbol = sequence[i];
    const symbolFirstSet = firstSets.get(symbol)!;
    
    // Add FIRST(symbol) - {ε} to result
    for (const terminal of symbolFirstSet) {
      if (terminal !== EPSILON) {
        result.add(terminal);
      }
    }
    
    // If symbol doesn't derive epsilon, we're done
    if (!symbolFirstSet.has(EPSILON)) {
      allDeriveEpsilon = false;
      break;
    }
  }
  
  // If all symbols can derive epsilon, add epsilon to result
  if (allDeriveEpsilon) {
    result.add(EPSILON);
  }
  
  return result;
}

/**
 * Get relevant productions for a non-terminal that match the lookahead token
 * @param grammar The grammar
 * @param nonTerminal The non-terminal symbol
 * @param lookahead The lookahead terminal
 * @param firstSets Calculated FIRST sets
 * @param followSets Calculated FOLLOW sets
 * @returns The matching production or null if none found
 */
export function predictProduction(
  grammar: Grammar,
  nonTerminal: NonTerminal,
  lookahead: Terminal,
  firstSets: FirstSets,
  followSets: FollowSets
): Production | null {
  // Find all productions with the given non-terminal on the LHS
  const relevantProductions = grammar.productions.filter(p => p.lhs === nonTerminal);
  
  for (const production of relevantProductions) {
    const { rhs } = production;
    
    // If RHS is epsilon
    if (rhs.length === 1 && rhs[0] === EPSILON) {
      // If lookahead is in FOLLOW(nonTerminal), this production applies
      if (followSets.get(nonTerminal)!.has(lookahead)) {
        return production;
      }
    } else {
      // Calculate FIRST of the RHS
      const firstOfRhs = calculateFirstOfSequence(rhs, firstSets);
      
      // If lookahead is in FIRST(RHS), this production applies
      if (firstOfRhs.has(lookahead)) {
        return production;
      }
      
      // If ε is in FIRST(RHS) and lookahead is in FOLLOW(nonTerminal),
      // this production applies
      if (firstOfRhs.has(EPSILON) && followSets.get(nonTerminal)!.has(lookahead)) {
        return production;
      }
    }
  }
  
  return null;
} 