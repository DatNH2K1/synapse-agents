#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
import json
import fnmatch
import os
import shutil
import subprocess
import urllib.request
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

HIGH_PRIORITY_NAMES = {
    "README",
    "README.md",
    "main.py",
    "app.py",
    "index.js",
    "index.ts",
    "index.tsx",
    "server.js",
    "server.ts",
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "tsconfig.json",
}

HIGH_PRIORITY_HINTS = {
    "route": "route",
    "routes": "route",
    "controller": "controller",
    "service": "service",
    "component": "component",
    "page": "page",
    "schema": "schema",
    "test": "test",
    "spec": "test",
    "config": "config",
}


class BaseLanguageAdapter:
    lang_id: str
    extensions: set[str]
    template_name: str | None = None
    temp_name: str | None = None
    local_cmd: str | None = None
    docker_runtime: str | None = None

    # Optional dependency fields
    manifest: str | None = None
    package_name: str | None = None
    install_local: list[str] | None = None
    uninstall_local: list[str] | None = None
    install_docker: list[str] | None = None
    uninstall_docker: list[str] | None = None

    def write_temp_parser(self, root: Path, templates_dir: Path):
        if self.template_name and self.temp_name:
            tpl_path = templates_dir / self.template_name
            if tpl_path.exists():
                content = tpl_path.read_text(encoding="utf-8")
                (root / self.temp_name).write_text(content, encoding="utf-8")

    def cleanup_temp_parser(self, root: Path):
        if self.temp_name:
            p = root / self.temp_name
            if p.exists():
                try:
                    p.unlink()
                except Exception:
                    pass

    def check_environment(
        self,
        root: Path,
        docker_installed: bool,
        docker_running: bool,
        errors: list[str],
    ):
        if not self.local_cmd:
            return
        if not is_local_available(self.local_cmd):
            service = find_docker_service_for_language(
                self.docker_runtime or self.local_cmd, root
            )
            if not service:
                if not docker_installed:
                    errors.append(
                        f"{self.lang_id.upper()} files present, but local '{self.local_cmd}' is missing and Docker is not installed."
                    )
                elif not docker_running:
                    errors.append(
                        f"{self.lang_id.upper()} files present, but local '{self.local_cmd}' is missing and Docker is not running (please start Docker)."
                    )
                else:
                    errors.append(
                        f"{self.lang_id.upper()} files present, but local '{self.local_cmd}' is missing and no active Docker container provides '{self.local_cmd}'."
                    )

    def run_parser_cmd(
        self,
        root_dir: Path,
        file_path: Path,
        local_cmd_args: list[str],
        docker_cmd_args: list[str],
    ) -> tuple[list[dict], list[dict]]:
        exports = []
        imports = []
        try:
            file_content = file_path.read_text(encoding="utf-8", errors="ignore")
            if is_local_available(self.local_cmd):
                res = subprocess.run(
                    local_cmd_args, capture_output=True, text=True, timeout=5
                )
                if res.returncode == 0:
                    data = json.loads(res.stdout)
                    exports = data.get("exports", [])
                    imports = data.get("imports", [])
            else:
                service = find_docker_service_for_language(
                    self.docker_runtime or self.local_cmd, root_dir
                )
                if service:
                    res = subprocess.run(
                        ["docker", "compose", "exec", "-T", service] + docker_cmd_args,
                        input=file_content,
                        capture_output=True,
                        text=True,
                        timeout=5,
                        cwd=root_dir,
                    )
                    if res.returncode == 0:
                        data = json.loads(res.stdout)
                        exports = data.get("exports", [])
                        imports = data.get("imports", [])
        except Exception as e:
            import sys

            print(f"Error executing adapter {self.lang_id}: {e}", file=sys.stderr)
        return exports, imports

    def run_parser(
        self, root_dir: Path, file_path: Path
    ) -> tuple[list[dict], list[dict]]:
        return [], []

    def run_dep_command(self, root: Path, command_type: str):
        cmd_local = getattr(self, f"{command_type}_local")
        cmd_docker = getattr(self, f"{command_type}_docker")
        if not cmd_local or not cmd_docker:
            return

        local_bin = cmd_local[0]
        service = find_docker_service_for_language(self.docker_runtime, root)

        if is_local_available(local_bin):
            print(
                f"Running dependency {command_type} command locally for {self.lang_id}: {' '.join(cmd_local)}"
            )
            subprocess.run(cmd_local, cwd=root)
        elif service:
            print(
                f"Running dependency {command_type} command inside Docker service '{service}' for {self.lang_id}: {' '.join(cmd_docker)}"
            )
            subprocess.run(
                ["docker", "compose", "exec", "-T", service] + cmd_docker, cwd=root
            )
        else:
            print(
                f"Warning: Neither local '{local_bin}' nor running Docker '{self.docker_runtime}' service found. Cannot run dependency {command_type} command for {self.lang_id}."
            )

    def check_manifest(self, root: Path) -> bool:
        if not self.manifest or not self.package_name:
            return True
        manifest_path = root / self.manifest
        if not manifest_path.exists():
            return True
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for key in ["dependencies", "devDependencies", "require", "require-dev"]:
                if self.package_name in data.get(key, {}):
                    return True
        except Exception as e:
            print(f"Error checking manifest {manifest_path.name}: {e}")
        return False

    def resolve_imports(
        self, entry: FileEntry, root: Path, php_exports_map: dict[str, str]
    ):
        pass


class JavaScriptAdapter(BaseLanguageAdapter):
    lang_id = "js"
    extensions = {".js", ".jsx", ".ts", ".tsx", ".vue"}
    template_name = "parser_template.cjs"
    temp_name = ".synapse_parser_temp.cjs"
    local_cmd = "node"
    docker_runtime = "node"

    manifest = "package.json"
    package_name = "@babel/parser"
    install_local = ["npm", "install", "--save-dev", "@babel/parser", "@babel/traverse"]
    uninstall_local = ["npm", "uninstall", "@babel/parser", "@babel/traverse"]
    install_docker = [
        "npm",
        "install",
        "--save-dev",
        "@babel/parser",
        "@babel/traverse",
    ]
    uninstall_docker = ["npm", "uninstall", "@babel/parser", "@babel/traverse"]

    def run_parser(
        self, root_dir: Path, file_path: Path
    ) -> tuple[list[dict], list[dict]]:
        abs_path = str(file_path.resolve())
        return self.run_parser_cmd(
            root_dir,
            file_path,
            local_cmd_args=["node", str(root_dir / self.temp_name), abs_path],
            docker_cmd_args=["node", self.temp_name, "-"],
        )

    def resolve_imports(
        self, entry: FileEntry, root: Path, php_exports_map: dict[str, str]
    ):
        file_path = root / entry.path
        for imp in entry.imports:
            if "from" in imp:
                imp["from"] = resolve_js_import(file_path, imp["from"], root)


class PythonAdapter(BaseLanguageAdapter):
    lang_id = "python"
    extensions = {".py"}
    template_name = "parser_template.py"
    temp_name = ".synapse_parser_temp.py"
    local_cmd = "python3"
    docker_runtime = "python"

    def run_parser(
        self, root_dir: Path, file_path: Path
    ) -> tuple[list[dict], list[dict]]:
        abs_path = str(file_path.resolve())
        return self.run_parser_cmd(
            root_dir,
            file_path,
            local_cmd_args=["python3", str(root_dir / self.temp_name), abs_path],
            docker_cmd_args=["python3", self.temp_name, "-"],
        )


class GoAdapter(BaseLanguageAdapter):
    lang_id = "go"
    extensions = {".go"}
    template_name = "parser_template.go"
    temp_name = ".synapse_parser_temp.go"
    local_cmd = "go"
    docker_runtime = "go"

    def run_parser(
        self, root_dir: Path, file_path: Path
    ) -> tuple[list[dict], list[dict]]:
        abs_path = str(file_path.resolve())
        return self.run_parser_cmd(
            root_dir,
            file_path,
            local_cmd_args=["go", "run", str(root_dir / self.temp_name), abs_path],
            docker_cmd_args=["go", "run", self.temp_name, "-"],
        )


class PHPAdapter(BaseLanguageAdapter):
    lang_id = "php"
    extensions = {".php"}
    template_name = "parser_template.php"
    temp_name = ".synapse_parser_temp.php"
    local_cmd = "php"
    docker_runtime = "php"

    manifest = "composer.json"
    package_name = "nikic/php-parser"
    install_local = ["composer", "require", "--dev", "nikic/php-parser"]
    uninstall_local = ["composer", "remove", "--dev", "nikic/php-parser"]
    install_docker = ["composer", "require", "--dev", "nikic/php-parser"]
    uninstall_docker = ["composer", "remove", "--dev", "nikic/php-parser"]

    def run_parser(
        self, root_dir: Path, file_path: Path
    ) -> tuple[list[dict], list[dict]]:
        abs_path = str(file_path.resolve())
        exports, imports = self.run_parser_cmd(
            root_dir,
            file_path,
            local_cmd_args=["php", str(root_dir / self.temp_name), abs_path],
            docker_cmd_args=["php", self.temp_name, "-"],
        )

        # Also extract @vite(...) links for PHP/Blade templates
        try:
            file_content = file_path.read_text(encoding="utf-8", errors="ignore")
            vite_imports = []
            for match in re.finditer(r"@vite\s*\((.*?)\)", file_content, re.DOTALL):
                args_str = match.group(1)
                for str_match in re.finditer(r'[\'"]([^\'"]+)[\'"]', args_str):
                    path_str = str_match.group(1)
                    parts = path_str.split("/")
                    vite_imports.append({"name": parts[-1], "from": path_str})
            imports.extend(vite_imports)
        except Exception:
            pass

        return exports, imports

    def resolve_imports(
        self, entry: FileEntry, root: Path, php_exports_map: dict[str, str]
    ):
        resolved_imports = []
        for imp in entry.imports:
            from_str = imp.get("from", "")
            if not from_str:
                continue

            if from_str.startswith("view:"):
                view_name = from_str[5:]
                view_path_part = view_name.replace(".", "/")
                possible_paths = [
                    f"resources/views/{view_path_part}.blade.php",
                    f"resources/views/{view_path_part}.php",
                ]
                for p in possible_paths:
                    if (root / p).exists():
                        imp["from"] = p
                        resolved_imports.append(imp)
                        break

            elif from_str.startswith("config:"):
                config_key = from_str[7:]
                config_file = config_key.split(".")[0]
                possible_path = f"config/{config_file}.php"
                if (root / possible_path).exists():
                    imp["from"] = possible_path
                    resolved_imports.append(imp)

            elif from_str.startswith("component:"):
                comp_name = from_str[10:]
                comp_path_part = comp_name.replace(".", "/")
                possible_paths = [
                    f"resources/views/components/{comp_path_part}.blade.php",
                    f"resources/views/components/{comp_path_part}.php",
                ]

                parts = comp_name.split(".")
                pascal_parts = []
                for part in parts:
                    subparts = part.split("-")
                    pascal_parts.append("".join(sp.capitalize() for sp in subparts))
                class_path_part = "/".join(pascal_parts)
                possible_paths.append(f"app/View/Components/{class_path_part}.php")

                for p in possible_paths:
                    if (root / p).exists():
                        imp["from"] = p
                        resolved_imports.append(imp)
                        break

            else:
                if from_str in php_exports_map:
                    imp["from"] = php_exports_map[from_str]
                    resolved_imports.append(imp)
                else:
                    resolved_imports.append(imp)

        entry.imports = resolved_imports


class CSSAdapter(BaseLanguageAdapter):
    lang_id = "css"
    extensions = {".css"}

    def run_parser(
        self, root_dir: Path, file_path: Path
    ) -> tuple[list[dict], list[dict]]:
        imports = []
        try:
            file_content = file_path.read_text(encoding="utf-8", errors="ignore")
            for match in re.finditer(
                r'@import\s+(?:url\()?[\'"]([^\'"]+)[\'"]\)?\s*;', file_content
            ):
                import_path = match.group(1)
                parts = import_path.split("/")
                imports.append({"name": parts[-1], "from": import_path})
        except Exception:
            pass
        return [], imports

    def resolve_imports(
        self, entry: FileEntry, root: Path, php_exports_map: dict[str, str]
    ):
        file_path = root / entry.path
        for imp in entry.imports:
            if "from" in imp:
                imp["from"] = resolve_css_import(file_path, imp["from"], root)


ADAPTER_REGISTRY: dict[str, BaseLanguageAdapter] = {
    "js": JavaScriptAdapter(),
    "python": PythonAdapter(),
    "go": GoAdapter(),
    "php": PHPAdapter(),
    "css": CSSAdapter(),
}


def write_temp_parsers(root: Path, langs: set[str]):
    templates_dir = Path(__file__).parent / "templates"
    if not templates_dir.exists():
        templates_dir = Path(__file__).parent.parent / "templates"
    for lang in langs:
        adapter = ADAPTER_REGISTRY.get(lang)
        if adapter:
            adapter.write_temp_parser(root, templates_dir)


def cleanup_temp_parsers(root: Path, langs: set[str]):
    for lang in langs:
        adapter = ADAPTER_REGISTRY.get(lang)
        if adapter:
            adapter.cleanup_temp_parser(root)


@dataclass
class FileEntry:
    path: str
    size: int
    kind: str
    priority: int
    hints: list[str]
    exports: list[dict]
    imports: list[dict]
    hash: str


@dataclass(frozen=True)
class IgnoreRule:
    source_dir: Path
    pattern: str
    negated: bool
    directory_only: bool


def load_gitignore_rules(directory: Path) -> list[IgnoreRule]:
    gitignore = directory / ".gitignore"
    if not gitignore.exists():
        return []
    rules: list[IgnoreRule] = []
    try:
        for raw_line in gitignore.read_text(
            encoding="utf-8", errors="ignore"
        ).splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            negated = line.startswith("!")
            if negated:
                line = line[1:]
            directory_only = line.endswith("/")
            if directory_only:
                line = line.rstrip("/")
            if not line:
                continue
            rules.append(
                IgnoreRule(
                    source_dir=directory,
                    pattern=line,
                    negated=negated,
                    directory_only=directory_only,
                )
            )
    except OSError:
        return []
    return rules


def path_variants(rel_path: Path, is_dir: bool) -> list[str]:
    parts = rel_path.as_posix()
    variants = [parts, rel_path.name]
    if is_dir:
        variants.append(parts + "/")
        variants.append(rel_path.name + "/")
    return variants


def rule_matches(rule: IgnoreRule, target_path: Path, is_dir: bool) -> bool:
    try:
        rel_to_rule = target_path.relative_to(rule.source_dir)
    except ValueError:
        return False
    candidates = path_variants(rel_to_rule, is_dir)
    for candidate in candidates:
        if fnmatch.fnmatch(candidate, rule.pattern) or fnmatch.fnmatch(
            f"/{candidate}", rule.pattern
        ):
            return True
    return False


def is_ignored(target_path: Path, rules: list[IgnoreRule], is_dir: bool) -> bool:
    # 1. Custom exclusions
    name = target_path.name
    parts = target_path.parts

    # Exclude docker/* directory
    if "docker" in parts:
        return True

    if not is_dir:
        # Multimedia extensions
        multimedia_exts = {
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".webp",
            ".svg",
            ".ico",
            ".bmp",
            ".tiff",
            ".mp4",
            ".mov",
            ".avi",
            ".mkv",
            ".webm",
            ".mp3",
            ".wav",
            ".ogg",
            ".flac",
            ".pdf",
            ".zip",
            ".tar",
            ".gz",
            ".rar",
            ".7z",
        }
        ext = target_path.suffix.lower()
        if ext in multimedia_exts:
            return True
        if ext in {".md", ".csv"}:
            return True

        if name == "pre-commit":
            return True

        # Docker files
        if name == "docker-compose.yml" or (
            name.startswith("docker-compose.") and name.endswith(".yml")
        ):
            return True
        if name == "Dockerfile" or name.startswith("Dockerfile."):
            return True

        # PHP specific exclusions
        if name in {"artisan", "composer.json", "composer.lock", "phpunit.xml"}:
            return True

        # Node/JS specific exclusions
        if (
            name.endswith(".config.js")
            or name.endswith(".config.ts")
            or name.endswith(".d.ts")
        ):
            return True
        if name in {
            "tsconfig.json",
            "tsconfig.node.json",
            "package.json",
            "package-lock.json",
        }:
            return True
        if name.startswith("vite.config."):
            return True

    # 2. Fallback to gitignore rules
    ignored = False
    for rule in rules:
        if not rule_matches(rule, target_path, is_dir):
            continue
        if rule.directory_only and not is_dir:
            continue
        ignored = not rule.negated
    return ignored


def file_kind(path: Path) -> str:
    suffix = path.suffix.lower()
    if path.name in {"Dockerfile", "Makefile"}:
        return "config"
    if suffix in {".py"}:
        return "python"
    if suffix in {".js", ".mjs", ".cjs", ".vue"}:
        return "javascript"
    if suffix in {".ts", ".tsx"}:
        return "typescript"
    if suffix in {".json"}:
        return "json"
    if suffix in {".md"}:
        return "markdown"
    if suffix in {".yml", ".yaml"}:
        return "yaml"
    if suffix in {".toml"}:
        return "toml"
    return suffix.lstrip(".") or "file"


def score_path(path: Path) -> int:
    score = 0
    name = path.name
    stem = path.stem.lower()
    if name in HIGH_PRIORITY_NAMES:
        score += 50
    if any(token in stem for token in HIGH_PRIORITY_HINTS):
        score += 20
    if "test" in stem or "spec" in stem:
        score += 15
    if path.parent == Path("."):
        score += 10
    return score


def get_file_hash(path: Path) -> str:
    try:
        content = path.read_bytes()
        return hashlib.md5(content).hexdigest()
    except OSError:
        return ""


# Cached list of active docker services keyed by root path string
_docker_services_cache: dict[str, list[str]] = {}


def get_running_docker_services(root: Path) -> list[str]:
    root_str = str(root.resolve())
    if root_str in _docker_services_cache:
        return _docker_services_cache[root_str]
    try:
        res = subprocess.run(
            ["docker", "compose", "ps", "--services", "--filter", "status=running"],
            capture_output=True,
            text=True,
            timeout=3,
            cwd=root,
        )
        if res.returncode == 0:
            services = [s.strip() for s in res.stdout.splitlines() if s.strip()]
            _docker_services_cache[root_str] = services
            return services
    except Exception:
        pass
    _docker_services_cache[root_str] = []
    return _docker_services_cache[root_str]


def find_docker_service_for_language(lang: str, root: Path) -> str | None:
    services = get_running_docker_services(root)
    if not services:
        return None

    lang_cmds = {"node": "node", "python": "python3", "go": "go", "php": "php"}
    cmd = lang_cmds.get(lang)
    if not cmd:
        return None

    # Step 1: Heuristic name matching
    lang_matches = {
        "node": ["node", "app", "web", "synapse-portal", "dashboard"],
        "python": ["python", "app", "web"],
        "go": ["go", "app", "web"],
        "php": ["php", "web", "app", "store", "laradev"],
    }

    candidates = lang_matches.get(lang, [])
    for c in candidates:
        for s in services:
            if c in s.lower():
                # Verify container has the required runtime
                res = subprocess.run(
                    ["docker", "compose", "exec", "-T", s, "which", cmd],
                    capture_output=True,
                    cwd=root,
                )
                if res.returncode == 0:
                    return s

    # Step 2: Dynamic runtime query across all running containers
    for s in services:
        res = subprocess.run(
            ["docker", "compose", "exec", "-T", s, "which", cmd],
            capture_output=True,
            cwd=root,
        )
        if res.returncode == 0:
            return s

    return None


def is_local_available(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def ensure_dependencies(root: Path) -> list[str]:
    present_exts = set()
    for p in iter_files(root, max_depth=None):
        present_exts.add(p.suffix.lower())

    installed_langs = []

    for lang, adapter in ADAPTER_REGISTRY.items():
        if present_exts.intersection(adapter.extensions):
            if adapter.manifest and not adapter.check_manifest(root):
                adapter.run_dep_command(root, "install")
                installed_langs.append(lang)

    return installed_langs


def cleanup_dependencies(root: Path, installed_langs: list[str]):
    for lang in installed_langs:
        adapter = ADAPTER_REGISTRY.get(lang)
        if adapter:
            adapter.run_dep_command(root, "uninstall")


def run_parser_adapter(
    root_dir: Path, file_path: Path
) -> tuple[list[dict], list[dict]]:
    suffix = file_path.suffix.lower()
    for adapter in ADAPTER_REGISTRY.values():
        if suffix in adapter.extensions:
            return adapter.run_parser(root_dir, file_path)
    return [], []


def iter_files(root: Path, max_depth: int | None) -> Iterable[Path]:
    ignore_cache: dict[Path, list[IgnoreRule]] = {root: load_gitignore_rules(root)}

    def rules_for(directory: Path) -> list[IgnoreRule]:
        if directory in ignore_cache:
            return ignore_cache[directory]
        if directory == root:
            ignore_cache[directory] = load_gitignore_rules(directory)
            return ignore_cache[directory]
        parent_rules = rules_for(directory.parent)
        ignore_cache[directory] = [*parent_rules, *load_gitignore_rules(directory)]
        return ignore_cache[directory]

    for current_root, dirnames, filenames in os.walk(root):
        current_path = Path(current_root)
        rel_dir = current_path.relative_to(root)
        if max_depth is not None and len(rel_dir.parts) > max_depth:
            dirnames[:] = []
            continue

        current_rules = rules_for(current_path)

        kept_dirnames = []
        for dirname in dirnames:
            if dirname.startswith("."):
                continue
            dir_path = current_path / dirname
            rel_path = dir_path.relative_to(root)
            if max_depth is not None and len(rel_path.parts) > max_depth:
                continue
            if is_ignored(dir_path, current_rules, True):
                continue
            kept_dirnames.append(dirname)
        dirnames[:] = kept_dirnames

        for filename in filenames:
            if filename.startswith("."):
                continue
            file_path = current_path / filename
            if is_ignored(file_path, current_rules, False):
                continue
            yield file_path


def resolve_css_import(file_path: Path, import_from: str, root: Path) -> str:
    if not (import_from.startswith("./") or import_from.startswith("../")):
        return import_from
    file_dir = file_path.parent
    try:
        resolved = (file_dir / import_from).resolve()
        if resolved.is_file():
            return str(resolved.relative_to(root))
    except Exception:
        pass
    return import_from


def resolve_js_import(file_path: Path, import_from: str, root: Path) -> str:
    is_alias = False
    for alias in ("@/", "~/"):
        if import_from.startswith(alias):
            import_from = import_from[len(alias) :]
            is_alias = True
            break

    if is_alias:
        try:
            resolved = (root / import_from).resolve()
        except Exception:
            return import_from
    else:
        if not (import_from.startswith("./") or import_from.startswith("../")):
            return import_from

        file_dir = file_path.parent
        try:
            resolved = (file_dir / import_from).resolve()
        except Exception:
            return import_from

    if resolved.is_file():
        try:
            return str(resolved.relative_to(root))
        except ValueError:
            pass

    extensions = [
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".vue",
        "/index.ts",
        "/index.tsx",
        "/index.js",
        "/index.jsx",
        "/index.vue",
    ]
    for ext in extensions:
        if ext.startswith("/"):
            test_path = Path(str(resolved) + ext)
        else:
            test_path = resolved.with_suffix(ext)
        if test_path.exists() and test_path.is_file():
            try:
                return str(test_path.relative_to(root))
            except ValueError:
                pass

    return import_from


def build_index(
    root: Path, max_files: int, max_depth: int | None, langs: set[str]
) -> list[FileEntry]:
    entries: list[FileEntry] = []
    write_temp_parsers(root, langs)

    try:
        for path in iter_files(root, max_depth):
            if len(entries) >= max_files:
                break
            rel = path.relative_to(root)
            size = path.stat().st_size
            file_hash = get_file_hash(path)

            # Deep AST extraction via language adapters (Docker-first/Local fallback)
            exports, imports = run_parser_adapter(root, path)

            priority = score_path(rel)
            hints = []
            if exports:
                hints.append("exports")
                priority += 10
            if imports:
                hints.append("imports")
                priority += 5

            entries.append(
                FileEntry(
                    path=str(rel),
                    size=size,
                    kind=file_kind(path),
                    priority=priority,
                    hints=hints,
                    exports=exports,
                    imports=imports,
                    hash=file_hash,
                )
            )
    finally:
        cleanup_temp_parsers(root, langs)

    # Build PHP exports map to resolve PHP class namespace imports to their file paths
    php_exports_map = {}
    for entry in entries:
        if entry.kind == "php":
            for sym in entry.exports:
                if "name" in sym:
                    php_exports_map[sym["name"]] = entry.path

    # Post-process imports to resolve relative JS/TS paths and PHP namespaces to actual repo-relative file paths
    for entry in entries:
        file_ext = Path(entry.path).suffix.lower()
        adapter = None
        for a in ADAPTER_REGISTRY.values():
            if file_ext in a.extensions:
                adapter = a
                break
        if adapter:
            adapter.resolve_imports(entry, root, php_exports_map)

    # Filter imports to only keep those resolving to actual scanned file paths in the repo
    scanned_paths = {e.path for e in entries}
    for entry in entries:
        entry.imports = [
            imp for imp in entry.imports if imp.get("from") in scanned_paths
        ]

    entries.sort(key=lambda item: (-item.priority, item.path))
    return entries


def sync_to_portal(entries: list[FileEntry], repo_name: str) -> bool:
    host = os.getenv("SYNAPSE_PORTAL_HOST", "http://localhost:3100")
    url = f"{host}/api/indexer/sync"

    payload = {
        "repo": repo_name,
        "files": [
            {
                "path": entry.path,
                "hash": entry.hash,
                "exports": entry.exports,
                "imports": entry.imports,
            }
            for entry in entries
        ],
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            res_data = json.loads(res_body)
            return res_data.get("success", False)
    except Exception as e:
        print(f"Failed to sync to Synapse Portal API: {e}")
        return False


def check_environment(root: Path, target_languages: set[str]):
    if not target_languages:
        return

    docker_installed = is_local_available("docker")
    docker_running = False
    if docker_installed:
        try:
            res = subprocess.run(
                ["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            docker_running = res.returncode == 0
        except Exception:
            pass

    errors = []
    for lang in target_languages:
        adapter = ADAPTER_REGISTRY.get(lang)
        if adapter:
            adapter.check_environment(root, docker_installed, docker_running, errors)

    if errors:
        import sys

        for err in errors:
            print(f"Error: {err}", file=sys.stderr)
        sys.exit(1)


def main() -> int:
    parser = argparse.ArgumentParser(description="Synapse Repo Indexer")
    parser.add_argument(
        "--parse",
        type=str,
        help="Parse a single file and output its exports/imports JSON",
    )
    parser.add_argument(
        "--path",
        type=str,
        default=".",
        help="Path to the repository to index (default: current directory)",
    )
    parser.add_argument(
        "--repo",
        type=str,
        help="Repository name (defaults to folder name of scanned path)",
    )
    args = parser.parse_args()

    if args.parse:
        root = Path.cwd().resolve()
        file_to_parse = Path(args.parse).resolve()
        if not file_to_parse.exists():
            print(json.dumps({"error": f"File not found: {args.parse}"}))
            return 1

        # Determine language of the file
        ext = file_to_parse.suffix.lower()
        langs = set()
        for adapter in ADAPTER_REGISTRY.values():
            if ext in adapter.extensions:
                langs.add(adapter.lang_id)

        check_environment(root, langs)

        write_temp_parsers(root, langs)
        try:
            exports, imports = run_parser_adapter(root, file_to_parse)
            print(json.dumps({"exports": exports, "imports": imports}, indent=2))
        finally:
            cleanup_temp_parsers(root, langs)
        return 0

    root = Path(args.path).resolve()
    if not root.exists() or not root.is_dir():
        print(f"Error: Target path does not exist or is not a directory: {args.path}")
        return 1

    repo_name = args.repo if args.repo else root.name

    # Check environment first based on present languages
    langs = set()
    for p in iter_files(root, max_depth=None):
        ext = p.suffix.lower()
        for adapter in ADAPTER_REGISTRY.values():
            if ext in adapter.extensions:
                langs.add(adapter.lang_id)
        if len(langs) == 4:
            break

    check_environment(root, langs)

    installed_langs = ensure_dependencies(root)
    try:
        entries = build_index(root, max_files=5000, max_depth=None, langs=langs)

        # Automatically sync to Synapse Portal PostgreSQL database
        sync_success = sync_to_portal(entries, repo_name)
        if sync_success:
            print(
                f"Successfully synced repository '{repo_name}' AST dependency graph to Synapse Portal PostgreSQL!"
            )
        else:
            print(
                "Warning: Synapse Portal sync failed. Check if Synapse Portal dev server is running."
            )
    finally:
        cleanup_dependencies(root, installed_langs)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
