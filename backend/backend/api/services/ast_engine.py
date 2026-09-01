"""
ProtoPatch — AST Engine
Searches a GitHub repository for code that matches a detected bug.

Strategy (no vector DB required):
  1. Clone repo shallowly with dulwich
  2. For each JS/JSX/TS/CSS/Python file, use Tree-sitter to build AST
  3. Extract component/function/class names and CSS selectors
  4. Fuzzy-match against the bug's target_element using rapidfuzz
  5. Return top matches with file path, line number, and code snippet
"""
import logging
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Supported file extensions and their tree-sitter language names
LANGUAGE_MAP = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".py": "python",
    ".css": "css",
    ".html": "html",
}

# Max files to scan per repo (performance guard)
MAX_FILES = 150
# Max file size in bytes to parse (skip large generated files)
MAX_FILE_SIZE = 100_000


class FileMatch:
    """Represents a file/location matched by the AST engine."""

    def __init__(
        self,
        file_path: str,
        relative_path: str,
        start_line: int,
        end_line: int,
        snippet: str,
        score: float,
        match_type: str,
    ):
        self.file_path = file_path
        self.relative_path = relative_path
        self.start_line = start_line
        self.end_line = end_line
        self.snippet = snippet
        self.score = score
        self.match_type = match_type

    def to_dict(self) -> dict:
        return {
            "file_path": self.relative_path,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "snippet": self.snippet,
            "score": round(self.score, 3),
            "match_type": self.match_type,
        }


class ASTEngine:
    """
    Parses a target GitHub repository and finds the code location
    most likely responsible for the detected visual bug.
    """

    def __init__(self):
        self._ts_parsers: dict = {}

    def _clone_repo(self, repo_url: str, target_dir: Path) -> Path:
        """Clone repo shallowly using dulwich or zip download."""
        clone_path = target_dir / "repo"
        self._safe_rmtree(clone_path)
        clone_path.mkdir(parents=True, exist_ok=True)

        try:
            from dulwich import porcelain
            logger.info("Cloning repo: %s → %s", repo_url, clone_path)
            repo = porcelain.clone(
                repo_url,
                str(clone_path),
                depth=1,
                errstream=open(os.devnull, "wb"),
            )
            if hasattr(repo, "close"):
                repo.close()
            logger.info("Clone complete")
        except Exception as exc:
            logger.warning("dulwich clone failed: %s — attempting requests-based download", exc)
            self._download_repo_zip(repo_url, clone_path)

        return clone_path

    def _safe_rmtree(self, path: Path):
        """Safely delete directory handling Windows read-only git pack files."""
        import stat
        if not path.exists():
            return
        def onerror(func, p, exc_info):
            try:
                os.chmod(p, stat.S_IWRITE)
                func(p)
            except Exception:
                pass
        try:
            shutil.rmtree(str(path), onerror=onerror)
        except Exception as e:
            logger.debug("safe_rmtree error: %s", e)

    def _download_repo_zip(self, repo_url: str, target_dir: Path):
        """Fallback: download GitHub zip archive."""
        import requests
        import zipfile
        import io

        # Convert HTTPS URL to archive URL
        # https://github.com/user/repo → https://github.com/user/repo/archive/refs/heads/main.zip
        zip_url = repo_url.rstrip("/") + "/archive/refs/heads/main.zip"
        logger.info("Downloading repo zip: %s", zip_url)

        response = requests.get(zip_url, timeout=30, stream=True)
        response.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            zf.extractall(target_dir)

        # Move extracted folder contents up one level
        extracted = next(target_dir.iterdir())
        if extracted.is_dir():
            for item in extracted.iterdir():
                shutil.move(str(item), target_dir)
            extracted.rmdir()

    def _get_ts_parser(self, language: str):
        """Lazy-load tree-sitter parser for a language."""
        if language in self._ts_parsers:
            return self._ts_parsers[language]
        try:
            from tree_sitter_languages import get_parser
            parser = get_parser(language)
            self._ts_parsers[language] = parser
            return parser
        except ImportError:
            logger.debug("tree-sitter-languages not available — using regex fallback for %s", language)
            return None
        except Exception as exc:
            logger.debug("tree-sitter parser unavailable for %s: %s", language, exc)
            return None

    def _extract_identifiers_from_ast(self, source: str, language: str) -> list[tuple[str, int]]:
        """
        Extract named identifiers (functions, classes, components, selectors)
        from source code using tree-sitter.

        Returns list of (name, line_number) tuples.
        """
        identifiers = []
        parser = self._get_ts_parser(language)

        if parser:
            try:
                tree = parser.parse(bytes(source, "utf-8"))
                identifiers = self._walk_tree(tree.root_node, source)
            except Exception as exc:
                logger.debug("AST parse error: %s", exc)

        # Always augment with regex fallback (fast, covers CSS/HTML too)
        identifiers += self._regex_extract(source, language)

        # Deduplicate
        seen = set()
        unique = []
        for name, line in identifiers:
            key = (name.lower(), line)
            if key not in seen:
                seen.add(key)
                unique.append((name, line))

        return unique

    def _walk_tree(self, node, source: str) -> list[tuple[str, int]]:
        """Recursively walk tree-sitter AST and collect named nodes."""
        identifiers = []
        interesting_types = {
            "function_declaration", "function_definition",
            "arrow_function", "method_definition",
            "class_declaration", "class_definition",
            "jsx_element", "jsx_opening_element",
            "export_statement",
        }

        if node.type in interesting_types:
            for child in node.children:
                if child.type in ("identifier", "property_identifier", "type_identifier"):
                    name = source[child.start_byte:child.end_byte]
                    line = child.start_point[0] + 1
                    if len(name) > 1:
                        identifiers.append((name, line))

        for child in node.children:
            identifiers.extend(self._walk_tree(child, source))

        return identifiers

    def _regex_extract(self, source: str, language: str) -> list[tuple[str, int]]:
        """Regex-based identifier extraction as fallback/supplement."""
        identifiers = []
        lines = source.split("\n")

        patterns_by_language = {
            "javascript": [
                r"function\s+(\w+)",
                r"(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*?\)\s*=>)",
                r"class\s+(\w+)",
                r"<(\w+)\s*[\/>]",       # JSX component names
            ],
            "python": [
                r"def\s+(\w+)\s*\(",
                r"class\s+(\w+)\s*[\(:]",
            ],
            "css": [
                r"([\w-]+)\s*\{",        # CSS class selectors
                r"\.([\w-]+)\s*\{",      # .class
                r"#([\w-]+)\s*\{",       # #id
            ],
        }

        patterns = patterns_by_language.get(language, patterns_by_language["javascript"])

        for line_no, line in enumerate(lines, 1):
            for pattern in patterns:
                for match in re.finditer(pattern, line):
                    name = match.group(1)
                    if len(name) > 1 and not name.startswith("_"):
                        identifiers.append((name, line_no))

        return identifiers

    def _fuzzy_match(self, query: str, candidates: list[tuple[str, int]], threshold: float = 40.0) -> list[tuple[str, int, float]]:
        """Fuzzy match query against candidate identifiers."""
        if not query:
            return []

        try:
            from rapidfuzz import fuzz, process
            results = process.extract(
                query,
                [name for name, _ in candidates],
                scorer=fuzz.WRatio,
                limit=5,
                score_cutoff=threshold,
            )
            matched = []
            name_to_lines = {}
            for name, line in candidates:
                name_to_lines.setdefault(name, []).append(line)

            for name, score, _ in results:
                for line in name_to_lines.get(name, []):
                    matched.append((name, line, score))
            return sorted(matched, key=lambda x: -x[2])

        except ImportError:
            # rapidfuzz not available — use simple substring matching
            logger.debug("rapidfuzz not available — using substring matching")
            results = []
            q_lower = query.lower()
            for name, line in candidates:
                if q_lower in name.lower() or name.lower() in q_lower:
                    results.append((name, line, 80.0))
            return results

    def search_repo(
        self,
        repo_url: str,
        bug_analysis: dict,
        tmp_dir: Path,
    ) -> list[dict]:
        """
        Main entry point: clone repo and find files matching the bug.

        Args:
            repo_url:     GitHub HTTPS URL
            bug_analysis: Dict from VisionService with bug_description, target_element
            tmp_dir:      Temporary directory for clone

        Returns:
            List of FileMatch dicts sorted by relevance score
        """
        target_element = bug_analysis.get("target_element", "")
        bug_description = bug_analysis.get("bug_description", "")

        # Build search queries from bug analysis
        queries = []
        if target_element:
            # Strip CSS selector prefixes for component name matching
            clean_target = re.sub(r"^[.#]", "", target_element).replace("-", " ")
            queries.append(clean_target)
        if bug_description:
            # Extract likely component names from description (capitalized words)
            words = re.findall(r"\b[A-Z][a-z]+\b", bug_description)
            queries.extend(words[:3])

        if not queries:
            logger.warning("No search queries derived from bug analysis")
            return []

        # Clone repository
        try:
            repo_path = self._clone_repo(repo_url, tmp_dir)
        except Exception as exc:
            logger.error("Failed to clone repo: %s", exc)
            return []

        # Scan files
        all_matches: list[FileMatch] = []
        files_scanned = 0

        for file_path in self._iter_source_files(repo_path):
            if files_scanned >= MAX_FILES:
                break
            files_scanned += 1

            ext = file_path.suffix.lower()
            language = LANGUAGE_MAP.get(ext)
            if not language:
                continue

            try:
                source = file_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            identifiers = self._extract_identifiers_from_ast(source, language)
            lines = source.split("\n")

            for query in queries:
                matched = self._fuzzy_match(query, identifiers)
                for name, line_no, score in matched:
                    # Extract surrounding snippet (±5 lines)
                    start = max(0, line_no - 6)
                    end = min(len(lines), line_no + 5)
                    snippet = "\n".join(
                        f"{start + i + 1}: {ln}"
                        for i, ln in enumerate(lines[start:end])
                    )

                    all_matches.append(FileMatch(
                        file_path=str(file_path),
                        relative_path=str(file_path.relative_to(repo_path)),
                        start_line=line_no,
                        end_line=min(line_no + 1, len(lines)),
                        snippet=snippet,
                        score=score,
                        match_type=f"ast:{language}",
                    ))

        # Sort by score, deduplicate by file+line
        seen_locs = set()
        unique_matches = []
        for match in sorted(all_matches, key=lambda m: -m.score):
            key = (match.relative_path, match.start_line)
            if key not in seen_locs:
                seen_locs.add(key)
                unique_matches.append(match)
            if len(unique_matches) >= 5:
                break

        logger.info(
            "AST engine: scanned %d files, found %d matches for queries %s",
            files_scanned, len(unique_matches), queries
        )

        return [m.to_dict() for m in unique_matches]

    def _iter_source_files(self, root: Path):
        """Yield source files, skipping common non-source directories."""
        skip_dirs = {
            "node_modules", ".git", "dist", "build", "__pycache__",
            ".next", "vendor", "venv", ".venv", "coverage", ".pytest_cache",
        }
        for path in root.rglob("*"):
            if path.is_file():
                if any(part in skip_dirs for part in path.parts):
                    continue
                if path.suffix.lower() in LANGUAGE_MAP:
                    if path.stat().st_size <= MAX_FILE_SIZE:
                        yield path
