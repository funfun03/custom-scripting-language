import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";
import { ParserType } from "./frontend/parser_interface.ts";
import { analyzeGrammar } from "./frontend/enhanced_ll_parser/index.ts";

// Analyze grammar details (debugging info)
// Uncomment to enable grammar analysis
// analyzeGrammar();

// Run with different parser types:
// ParserType.RecursiveDescent - Original recursive descent parser
// ParserType.LL - Basic LL parser
// ParserType.EnhancedLL - Enhanced LL(1) parser with better error handling

// Choose which test to run based on command line argument
const args = Deno.args;
const testFile = args[0] || "./test_ll_parser.txt";  // Default to our simple LL parser test
const parser = args[1] === "rd" ? ParserType.RecursiveDescent : ParserType.EnhancedLL;

// Run the test
run(testFile, parser);

async function run(filename: string, parserType: ParserType) {
	try {
		console.log(`Using parser: ${ParserType[parserType]}`);
		const parser = new Parser(parserType);
		const env = createGlobalEnv();

		const input = await Deno.readTextFile(filename);
		console.log(`Parsing file: ${filename}`);
		console.log("Source code:");
		console.log(input);
		
		try {
			const program = parser.produceAST(input);
			
			console.log("\nAST generated:");
			console.log(JSON.stringify(program, null, 2));

			console.log("\nRunning program:");
			try {
				const result = evaluate(program, env);
				console.log("\nResult:", result);
			} catch (evalError) {
				console.error("\nEvaluation error:", evalError);
			}
		} catch (parseError) {
			console.error("\nParsing error:", parseError);
		}
	} catch (fileError: unknown) {
		console.error("\nError reading file:", fileError instanceof Error ? fileError.message : String(fileError));
	}
}
