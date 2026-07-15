const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

// Dynamically resolve node_modules starting from the scanned file's directory
let dir = (filePath && filePath !== '-') ? path.dirname(path.resolve(filePath)) : process.cwd();
while (dir && dir !== '/' && dir !== path.dirname(dir)) {
  const nm = path.join(dir, 'node_modules');
  if (fs.existsSync(nm)) {
    module.paths.push(nm);
    break;
  }
  dir = path.dirname(dir);
}

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function parseCode(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'dynamicImport'
      ]
    });

    const exports = [];
    const imports = [];

    traverse(ast, {
      ExportNamedDeclaration(nodePath) {
        const { node } = nodePath;
        if (node.declaration) {
          const decl = node.declaration;
          if (decl.id && decl.id.name) {
            exports.push({
              name: decl.id.name,
              kind: decl.type.replace('Declaration', '').toLowerCase(),
              range: `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}`
            });
          } else if (decl.declarations) {
            for (const d of decl.declarations) {
              if (d.id && d.id.name) {
                exports.push({
                  name: d.id.name,
                  kind: 'variable',
                  range: `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}`
                });
              }
            }
          }
        }
        if (node.specifiers) {
          for (const spec of node.specifiers) {
            if (spec.exported && spec.exported.name) {
              exports.push({
                name: spec.exported.name,
                kind: 'export',
                range: `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}`
              });
            }
          }
        }
      },
      ExportDefaultDeclaration(nodePath) {
        const { node } = nodePath;
        let name = 'default';
        let kind = 'default';
        if (node.declaration) {
          if (node.declaration.id && node.declaration.id.name) {
            name = node.declaration.id.name;
          }
          kind = node.declaration.type.replace('Declaration', '').toLowerCase();
        }
        exports.push({
          name,
          kind,
          range: `${node.loc.start.line}:${node.loc.start.column}-${node.loc.end.line}:${node.loc.end.column}`
        });
      },
      ImportDeclaration(nodePath) {
        const { node } = nodePath;
        const from = node.source.value;
        if (node.specifiers && node.specifiers.length > 0) {
          for (const spec of node.specifiers) {
            imports.push({
              name: spec.local.name,
              from
            });
          }
        } else {
          imports.push({
            name: '',
            from
          });
        }
      },
      CallExpression(nodePath) {
        const { node } = nodePath;
        if (node.callee && node.arguments && node.arguments[0]) {
          const isDynamicImport = node.callee.type === 'Import';
          const isRequire = node.callee.type === 'Identifier' && node.callee.name === 'require';
          
          if (isDynamicImport || isRequire) {
            const arg = node.arguments[0];
            if (arg.type === 'StringLiteral') {
              imports.push({
                name: '',
                from: arg.value
              });
            } else if (arg.type === 'TemplateLiteral' && arg.quasis && arg.quasis.length === 1) {
              imports.push({
                name: '',
                from: arg.quasis[0].value.cooked
              });
            }
          }
        }
      }
    });

    console.log(JSON.stringify({ exports, imports }, null, 2));
  } catch (err) {
    console.error("Error parsing JS/TS file:", err.message);
    process.exit(1);
  }
}

function extractVueScript(code) {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  const match = scriptRegex.exec(code);
  if (match) {
    return match[1];
  }
  return '';
}

if (!filePath || filePath === '-') {
  let code = '';
  process.stdin.on('data', chunk => {
    code += chunk;
  });
  process.stdin.on('end', () => {
    if (code.trim().startsWith('<') || code.includes('<script')) {
      code = extractVueScript(code);
    }
    parseCode(code);
  });
} else {
  let code = fs.readFileSync(filePath, 'utf-8');
  if (filePath.endsWith('.vue')) {
    code = extractVueScript(code);
  }
  parseCode(code);
}
