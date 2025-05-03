import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.177.0/http/file_server.ts";
import { parse, join, dirname, fromFileUrl } from "https://deno.land/std@0.177.0/path/mod.ts";
import { contentType } from "https://deno.land/std@0.177.0/media_types/mod.ts";
import Parser from "../frontend/parser.ts";
import { ParserType } from "../frontend/parser_interface.ts";
import { createGlobalEnv } from "../runtime/environment.ts";
import { evaluate } from "../runtime/interpreter.ts";

const PORT = 8000;
const currentDir = dirname(fromFileUrl(import.meta.url));
const projectDir = join(currentDir, "..");

// Create a function to capture console.log output
function captureStdout(callback) {
  const originalConsoleLog = console.log;
  let output = '';
  
  // Override console.log
  console.log = (...args) => {
    // Format the output like the original console.log
    const text = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    output += text + '\n';
  };
  
  try {
    // Run the callback
    const result = callback();
    
    // Restore console.log
    console.log = originalConsoleLog;
    
    return { result, output };
  } catch (error) {
    // Restore console.log in case of error
    console.log = originalConsoleLog;
    throw error;
  }
}

async function handleRequest(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  console.log(`Handling request: ${path}`);
  
  // Handle API endpoints
  if (path === "/run" && req.method === "POST") {
    try {
      const body = await req.json();
      const code = body.code;
      const parserType = body.parserType === "rd" ? ParserType.RecursiveDescent : ParserType.EnhancedLL;
      
      console.log(`Running code with parser: ${ParserType[parserType]}`);
      
      // Capture console output during execution
      const { result, output } = captureStdout(() => {
        const parser = new Parser(parserType);
        const env = createGlobalEnv();
        
        // Parse and evaluate
        console.log(`Using parser: ${ParserType[parserType]}`);
        console.log("Source code:");
        console.log(code);
        
        const ast = parser.produceAST(code);
        
        console.log("\nAST generated:");
        // Don't log the full AST to the console
        
        console.log("\nRunning program:");
        const evalResult = evaluate(ast, env);
        console.log("\nResult:", evalResult);
        
        return { ast, evalResult };
      });
      
      return new Response(
        JSON.stringify({ 
          output: output, 
          ast: result.ast 
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    } catch (error) {
      console.error("Error processing code:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }
  }
  
  // Serve static files
  if (path === "/") {
    const filePath = join(currentDir, "index.html");
    console.log(`Serving index.html from: ${filePath}`);
    return serveFile(req, filePath);
  }
  
  try {
    // Serve other static files from the web directory
    const filePath = join(currentDir, path.substring(1));
    console.log(`Trying to serve file: ${filePath}`);
    
    const fileInfo = await Deno.stat(filePath);
    
    if (fileInfo.isFile) {
      const { ext } = parse(filePath);
      const contentTypeValue = contentType(ext) || "application/octet-stream";
      
      return serveFile(req, filePath, {
        headers: { "Content-Type": contentTypeValue }
      });
    }
  } catch (error) {
    console.log(`File not found: ${error.message}`);
    // File not found, continue to 404
  }
  
  // Not found
  return new Response("Not Found", { status: 404 });
}

console.log(`Starting server on http://localhost:${PORT}`);
console.log(`Project directory: ${projectDir}`);
console.log(`Web files directory: ${currentDir}`);

serve(handleRequest, { port: PORT }); 