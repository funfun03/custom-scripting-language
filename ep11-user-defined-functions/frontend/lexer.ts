// https://github.com/tlaceby/guide-to-interpreters-series
// -----------------------------------------------------------
// ---------------          LEXER          -------------------
// ---  Responsible for producing tokens from the source   ---
// -----------------------------------------------------------

// Represents tokens that our language understands in parsing.
export enum TokenType {
	// Literal Types
	Number,
	String,
	Identifier,
	// Keywords
	Let,
	Const,
	Fn, // fn
	If,
	Else,
	While,
	For,
	Return,
	Break,
	Continue,

	// Grouping * Operators
	BinaryOperator,
	Equals,
	Comma,
	Dot,
	Colon,
	Semicolon,
	OpenParen, // (
	CloseParen, // )
	OpenBrace, // {
	CloseBrace, // }
	OpenBracket, // [
	CloseBracket, //]
	EOF, // Signified the end of file
}

/**
 * Constant lookup for keywords and known identifiers + symbols.
 */
const KEYWORDS: Record<string, TokenType> = {
	let: TokenType.Let,
	const: TokenType.Const,
	fn: TokenType.Fn,
	if: TokenType.If,
	else: TokenType.Else,
	while: TokenType.While,
	for: TokenType.For,
	return: TokenType.Return,
	break: TokenType.Break,
	continue: TokenType.Continue,
};

// Reoresents a single token from the source-code.
export interface Token {
	value: string; // contains the raw value as seen inside the source code.
	type: TokenType; // tagged structure.
}

// Returns a token of a given type and value
function token(value = "", type: TokenType): Token {
	return { value, type };
}

/**
 * Returns whether the character passed in alphabetic -> [a-zA-Z]
 */
function isalpha(src: string) {
	return src.toUpperCase() != src.toLowerCase();
}

/**
 * Returns true if the character is whitespace like -> [\s, \t, \n]
 */
function isskippable(str: string) {
	return str == " " || str == "\n" || str == "\t" || str == "\r";
}

/**
 Return whether the character is a valid integer -> [0-9]
 */
function isint(str: string) {
	const c = str.charCodeAt(0);
	const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
	return c >= bounds[0] && c <= bounds[1];
}

/**
 * Given a string representing source code: Produce tokens and handles
 * possible unidentified characters.
 *
 * - Returns a array of tokens.
 * - Does not modify the incoming string.
 */
export function tokenize(sourceCode: string): Token[] {
	const tokens = new Array<Token>();
	const src: string[] = sourceCode.split("");

	// produce tokens until the EOF is reached.
	while (src.length > 0) {
		// Handle comments
		if (src[0] === "/" && src.length > 1 && src[1] === "/") {
			// Single line comment
			while (src.length > 0 && src[0] !== "\n") {
				src.shift();
			}
			if (src.length > 0) {
				src.shift(); // consume the newline
			}
			continue;
		}

		// Handle string literals
		if (src[0] === '"' || src[0] === "'") {
			const quote = src.shift();
			let str = "";
			while (src.length > 0 && src[0] !== quote) {
				str += src.shift();
			}
			src.shift(); // consume closing quote
			tokens.push(token(str, TokenType.String));
			continue;
		}

		// BEGIN PARSING ONE CHARACTER TOKENS
		if (src[0] == "(") {
			tokens.push(token(src.shift(), TokenType.OpenParen));
		} else if (src[0] == ")") {
			tokens.push(token(src.shift(), TokenType.CloseParen));
		} else if (src[0] == "{") {
			tokens.push(token(src.shift(), TokenType.OpenBrace));
		} else if (src[0] == "}") {
			tokens.push(token(src.shift(), TokenType.CloseBrace));
		} else if (src[0] == "[") {
			tokens.push(token(src.shift(), TokenType.OpenBracket));
		} else if (src[0] == "]") {
			tokens.push(token(src.shift(), TokenType.CloseBracket));
		} // HANDLE BINARY OPERATORS
		else if (
			src[0] === "+" ||
			src[0] === "-" ||
			src[0] === "*" ||
			src[0] === "/" ||
			src[0] === "%" ||
			src[0] === ">" ||
			src[0] === "<" ||
			src[0] === "!"
		) {
			// Handle comparison operators
			if ((src[0] === ">" || src[0] === "<" || src[0] === "!") && src.length > 1) {
				if (src[1] === "=") {
					const firstChar = src.shift();
					const secondChar = src.shift();
					if (firstChar && secondChar) {
						tokens.push(token(firstChar + secondChar, TokenType.BinaryOperator));
						continue;
					}
				}
			}
			const op = src.shift();
			if (op) {
				tokens.push(token(op, TokenType.BinaryOperator));
			}
		} // Handle Conditional & Assignment Tokens
		else if (src[0] === "=") {
			tokens.push(token(src.shift(), TokenType.Equals));
		} else if (src[0] == ";") {
			tokens.push(token(src.shift(), TokenType.Semicolon));
		} else if (src[0] == ":") {
			tokens.push(token(src.shift(), TokenType.Colon));
		} else if (src[0] == ",") {
			tokens.push(token(src.shift(), TokenType.Comma));
		} else if (src[0] == ".") {
			tokens.push(token(src.shift(), TokenType.Dot));
		} // HANDLE MULTICHARACTER KEYWORDS, TOKENS, IDENTIFIERS ETC...
		else {
			// Handle numeric literals -> Integers
			if (isint(src[0])) {
				let num = "";
				while (src.length > 0 && isint(src[0])) {
					num += src.shift();
				}

				// append new numeric token.
				tokens.push(token(num, TokenType.Number));
			} // Handle Identifier & Keyword Tokens.
			else if (isalpha(src[0])) {
				let ident = "";
				while (src.length > 0 && (isalpha(src[0]) || isint(src[0]))) {
					ident += src.shift();
				}

				// CHECK FOR RESERVED KEYWORDS
				const reserved = KEYWORDS[ident];
				// If value is not undefined then the identifier is
				// reconized keyword
				if (typeof reserved == "number") {
					tokens.push(token(ident, reserved));
				} else {
					// Unreconized name must mean user defined symbol.
					tokens.push(token(ident, TokenType.Identifier));
				}
			} else if (isskippable(src[0])) {
				// Skip uneeded chars.
				src.shift();
			} // Handle unreconized characters.
			// TODO: Impliment better errors and error recovery.
			else {
				console.error(
					"Unreconized character found in source: ",
					src[0].charCodeAt(0),
					src[0]
				);
				Deno.exit(1);
			}
		}
	}

	tokens.push({ type: TokenType.EOF, value: "EndOfFile" });
	return tokens;
}
