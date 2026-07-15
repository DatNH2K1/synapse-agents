import ast
import json
import sys


def parse_code(code, file_path="<stdin>"):
    try:
        tree = ast.parse(code, filename=file_path)
        exports = []
        imports = []
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                exports.append(
                    {
                        "name": node.name,
                        "kind": "function",
                        "range": f"{node.lineno}:{node.col_offset}-{node.end_lineno}:{node.end_col_offset}"
                        if hasattr(node, "end_lineno")
                        else f"{node.lineno}:{node.col_offset}",
                    }
                )
            elif isinstance(node, ast.ClassDef):
                exports.append(
                    {
                        "name": node.name,
                        "kind": "class",
                        "range": f"{node.lineno}:{node.col_offset}-{node.end_lineno}:{node.end_col_offset}"
                        if hasattr(node, "end_lineno")
                        else f"{node.lineno}:{node.col_offset}",
                    }
                )
            elif isinstance(node, ast.Import):
                for name in node.names:
                    imports.append(
                        {"name": name.asname or name.name, "from": name.name}
                    )
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                level = node.level
                from_str = "." * level + module
                for name in node.names:
                    imports.append({"name": name.asname or name.name, "from": from_str})
        return {"exports": exports, "imports": imports}
    except Exception as e:
        print(f"Error parsing Python: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "-":
        code = sys.stdin.read()
        result = parse_code(code)
    else:
        with open(sys.argv[1], "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()
        result = parse_code(code, sys.argv[1])
    print(json.dumps(result, indent=2))
