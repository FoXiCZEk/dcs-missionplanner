/**
 * DCS Lua Serializer
 * Serializes JavaScript data objects into valid Lua tables compatible with the DCS World engine.
 */

export function toLuaValue(value: any, indent = 0): string {
  const pad = '    '.repeat(indent);
  const nextPad = '    '.repeat(indent + 1);

  if (value === null || value === undefined) {
    return 'nil';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (typeof value === 'number') {
    if (isNaN(value)) return '0';
    if (!isFinite(value)) return '0';
    // Clean up floats
    return Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(6)).toString();
  }

  if (typeof value === 'string') {
    // Escape string for Lua double-quoted literal
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '{}';
    }
    const lines: string[] = ['{'];
    for (let i = 0; i < value.length; i++) {
      // DCS 1-based indexing
      lines.push(`${nextPad}[${i + 1}] = ${toLuaValue(value[i], indent + 1)},`);
    }
    lines.push(`${pad}}`);
    return lines.join('\n');
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return '{}';
    }

    const lines: string[] = ['{'];
    for (const key of keys) {
      const val = value[key];
      if (val === undefined) continue;

      let keyStr: string;
      const numKey = Number(key);
      if (!isNaN(numKey) && Number.isInteger(numKey) && numKey.toString() === key) {
        keyStr = `[${numKey}]`;
      } else {
        keyStr = `["${key}"]`;
      }

      lines.push(`${nextPad}${keyStr} = ${toLuaValue(val, indent + 1)},`);
    }
    lines.push(`${pad}}`);
    return lines.join('\n');
  }

  return 'nil';
}

/**
 * Serialize a named Lua table (e.g. `mission = { ... }` or `dictionary = { ... }`)
 */
export function serializeNamedLuaTable(tableName: string, data: any): string {
  return `${tableName} = ${toLuaValue(data, 0)}\n`;
}
