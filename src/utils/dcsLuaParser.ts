import * as luaparse from 'luaparse';

function unescapeLuaString(raw: string): string {
  if (!raw) return '';
  // Check if string is enclosed in double or single quotes
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw
        .slice(1, -1)
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
    }
  }
  // Multiline strings [[ ... ]] or [=[ ... ]=]
  const longMatch = raw.match(/^\[(=*)\[([\s\S]*?)\]\1\]$/);
  if (longMatch) {
    return longMatch[2];
  }
  return raw;
}

function astToValue(node: any): any {
  if (!node) return null;
  switch (node.type) {
    case 'StringLiteral':
      return node.value !== null && node.value !== undefined ? node.value : unescapeLuaString(node.raw);
    case 'NumericLiteral':
      return node.value;
    case 'BooleanLiteral':
      return node.value;
    case 'NilLiteral':
      return null;
    case 'UnaryExpression':
      if (node.operator === '-') {
        return -astToValue(node.argument);
      }
      if (node.operator === 'not') {
        return !astToValue(node.argument);
      }
      return astToValue(node.argument);
    case 'BinaryExpression': {
      const left = astToValue(node.left);
      const right = astToValue(node.right);
      if (typeof left === 'number' && typeof right === 'number') {
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return right !== 0 ? left / right : 0;
          case '%': return left % right;
          case '^': return Math.pow(left, right);
        }
      }
      if (typeof left === 'string' && typeof right === 'string' && node.operator === '..') {
        return left + right;
      }
      return left ?? right;
    }
    case 'Identifier':
      if (node.name === 'true') return true;
      if (node.name === 'false') return false;
      if (node.name === 'nil') return null;
      return node.name;
    case 'TableConstructorExpression': {
      const obj: Record<string | number, any> = {};
      let arrayIndex = 1;

      for (const field of node.fields) {
        let key: any;
        let val: any;
        if (field.type === 'TableKey') {
          key = astToValue(field.key);
          val = astToValue(field.value);
        } else if (field.type === 'TableKeyString') {
          key = field.key.name;
          val = astToValue(field.value);
        } else if (field.type === 'TableValue') {
          key = arrayIndex;
          val = astToValue(field.value);
        }
        if (key !== undefined) {
          obj[key] = val;
        }
        arrayIndex++;
      }

      return obj;
    }
    default:
      return null;
  }
}

/**
 * Parses a Lua file containing assignment(s) like `mission = { ... }` or `dictionary = { ... }`
 * Returns the parsed table value corresponding to the requested variable name or the first assignment.
 */
export function parseLuaTable(luaCode: string, targetVarName?: string): any {
  if (!luaCode) return null;

  // 1. Strip UTF-8 BOM if present
  let cleanCode = luaCode;
  if (cleanCode.charCodeAt(0) === 0xfeff) {
    cleanCode = cleanCode.slice(1);
  }

  // 2. Try parsing with luaVersion 5.3, fallback to 5.1 / LuaJIT
  let ast: any = null;
  const versions: ('5.3' | '5.2' | 'LuaJIT' | '5.1')[] = ['5.3', 'LuaJIT', '5.1'];

  for (const v of versions) {
    try {
      ast = luaparse.parse(cleanCode, {
        luaVersion: v,
        comments: false,
        locations: false,
        ranges: false,
      });
      if (ast) break;
    } catch {
      // Continue to next version
    }
  }

  if (!ast) {
    console.error('luaparse failed to parse Lua code across all versions.');
    return null;
  }

  try {
    for (const stmt of ast.body) {
      // Global assignment: varName = { ... }
      if (stmt.type === 'AssignmentStatement') {
        const firstVar = stmt.variables?.[0] as any;
        const varName = firstVar?.name;
        if (!targetVarName || varName === targetVarName) {
          return astToValue(stmt.init?.[0]);
        }
      }
      // Local statement: local varName = { ... }
      if (stmt.type === 'LocalStatement') {
        const firstVar = stmt.variables?.[0] as any;
        const varName = firstVar?.name;
        if (!targetVarName || varName === targetVarName) {
          return astToValue(stmt.init?.[0]);
        }
      }
      // Return statement: return { ... }
      if (stmt.type === 'ReturnStatement' && stmt.arguments?.length > 0) {
        return astToValue(stmt.arguments[0]);
      }
    }

    // If specific targetVarName was requested but not found by name,
    // fallback to first table found in the AST statements
    for (const stmt of ast.body) {
      if (stmt.type === 'AssignmentStatement' && stmt.init?.[0]?.type === 'TableConstructorExpression') {
        return astToValue(stmt.init[0]);
      }
      if (stmt.type === 'LocalStatement' && stmt.init?.[0]?.type === 'TableConstructorExpression') {
        return astToValue(stmt.init[0]);
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to convert AST to value:', err);
    return null;
  }
}
