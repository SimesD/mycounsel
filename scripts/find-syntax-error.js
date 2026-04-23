#!/usr/bin/env node
/**
 * Finds the exact location of the unclosed construct in public/app.js
 * by tracking the state of all openers/closers through the file.
 */

const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const lines = src.split('\n');

// State machine tracking
let inSingleStr = false;
let inDoubleStr = false;
let inRegex = false;
let inLineComment = false;
let inBlockComment = false;
let templateDepth = 0; // nesting level of template literals
let templateInterpolationDepth = []; // stack of { } depth per template level

const stack = []; // stack of { char, line, col }

let i = 0;
let lineNum = 1;
let colNum = 0;

function peek(n) { return src[i + (n || 1)]; }
function prev() { return i > 0 ? src[i - 1] : ''; }

while (i < src.length) {
    const ch = src[i];
    colNum++;

    if (ch === '\n') {
        lineNum++;
        colNum = 0;
        inLineComment = false;
        inRegex = false; // regex can't span lines
        i++;
        continue;
    }

    // Block comment end
    if (inBlockComment) {
        if (ch === '*' && peek() === '/') {
            inBlockComment = false;
            i += 2;
            colNum++;
            continue;
        }
        i++;
        continue;
    }

    // Line comment
    if (inLineComment) {
        i++;
        continue;
    }

    // Inside single-quoted string
    if (inSingleStr) {
        if (ch === '\\') { i += 2; colNum++; continue; } // escape
        if (ch === "'")  { inSingleStr = false; }
        i++;
        continue;
    }

    // Inside double-quoted string
    if (inDoubleStr) {
        if (ch === '\\') { i += 2; colNum++; continue; } // escape
        if (ch === '"')  { inDoubleStr = false; }
        i++;
        continue;
    }

    // Inside regex
    if (inRegex) {
        if (ch === '\\') { i += 2; colNum++; continue; } // escape
        if (ch === '/')  { inRegex = false; }
        i++;
        continue;
    }

    // Inside a template literal (at any depth)
    if (templateDepth > 0) {
        if (ch === '\\') { i += 2; colNum++; continue; } // escape

        if (ch === '`') {
            // End of this template literal level
            templateDepth--;
            templateInterpolationDepth.pop();
            i++;
            continue;
        }

        if (ch === '$' && peek() === '{') {
            // Start of interpolation — push a new brace level
            templateInterpolationDepth[templateDepth - 1]++;
            stack.push({ char: '${', line: lineNum, col: colNum });
            i += 2;
            colNum++;
            continue;
        }

        if (ch === '{' && templateInterpolationDepth[templateDepth - 1] > 0) {
            templateInterpolationDepth[templateDepth - 1]++;
            stack.push({ char: '{', line: lineNum, col: colNum });
            i++;
            continue;
        }

        if (ch === '}' && templateInterpolationDepth[templateDepth - 1] > 0) {
            templateInterpolationDepth[templateDepth - 1]--;
            const popped = stack.pop();
            if (!popped) {
                console.error(`Unexpected } at line ${lineNum}:${colNum}`);
            }
            i++;
            continue;
        }

        // Any other character inside template (outside interpolation)
        i++;
        continue;
    }

    // Detect comment starts
    if (ch === '/' && peek() === '/') { inLineComment = true; i += 2; continue; }
    if (ch === '/' && peek() === '*') { inBlockComment = true; i += 2; continue; }

    // Detect regex (very heuristic — only after operators/keywords)
    // Skip for simplicity; we mainly care about brackets

    // String starts
    if (ch === "'") { inSingleStr = true; i++; continue; }
    if (ch === '"') { inDoubleStr = true; i++; continue; }

    // Template literal start
    if (ch === '`') {
        templateDepth++;
        templateInterpolationDepth.push(0);
        i++;
        continue;
    }

    // Brackets
    if (ch === '{' || ch === '(' || ch === '[') {
        stack.push({ char: ch, line: lineNum, col: colNum });
        i++;
        continue;
    }

    if (ch === '}' || ch === ')' || ch === ']') {
        const matching = ch === '}' ? '{' : ch === ')' ? '(' : '[';
        const top = stack[stack.length - 1];
        if (!top) {
            console.error(`EXTRA ${ch} at line ${lineNum}:${colNum}  (nothing on stack)`);
            console.error('Context:', lines[lineNum - 1]);
        } else if (top.char !== matching && top.char !== '${') {
            console.error(`MISMATCH: ${ch} at line ${lineNum}:${colNum} closes ${top.char} opened at line ${top.line}:${top.col}`);
            console.error('  Open line:  ', lines[top.line - 1].slice(0, 100));
            console.error('  Close line: ', lines[lineNum - 1].slice(0, 100));
        } else {
            stack.pop();
        }
        i++;
        continue;
    }

    i++;
}

console.log('\n=== Results ===');
if (templateDepth > 0) {
    console.error(`Unclosed template literal (depth ${templateDepth})`);
}
if (stack.length === 0 && templateDepth === 0) {
    console.log('All constructs balanced — no syntax errors found by this scanner.');
    console.log('(Regex literals were skipped; check those manually if needed.)');
} else {
    console.error(`${stack.length} unclosed construct(s):`);
    for (const item of stack) {
        console.error(`  ${item.char} opened at line ${item.line}:${item.col}`);
        console.error('  ', lines[item.line - 1].slice(0, 120));
    }
}
