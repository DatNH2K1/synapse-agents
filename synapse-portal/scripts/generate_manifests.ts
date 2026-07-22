import * as fs from 'fs';
import * as path from 'path';

// Helper to escape values for CSV RFC 4180 style
function toCsvField(val: string | undefined): string {
    if (!val) return '""';
    // Replace all types of newlines and consecutive whitespace with a single space to avoid breaking the portal's line-by-line CSV parser
    const clean = val.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    return `"${clean.replace(/"/g, '""')}"`;
}

// Helper to extract a markdown section content
function extractSection(content: string, header: string): string {
    const regex = new RegExp(`## ${header}\\r?\\n([\\s\\S]*?)(?:\\r?\\n##|$)`);
    const match = content.match(regex);
    return match ? match[1].trim() : '';
}

function parseFrontmatter(content: string): { [key: string]: string } {
    const frontmatterRegex = /^---\r?\n([\s\S]+?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    const result: { [key: string]: string } = {};
    if (match) {
        const lines = match[1].split('\n');
        let currentKey = '';
        let currentValue = '';
        for (const line of lines) {
            // A line starts a new key-value pair only if it contains ':' and does not start with whitespace
            if (line.includes(':') && !/^\s/.test(line)) {
                if (currentKey) {
                    result[currentKey] = currentValue.trim();
                }
                const index = line.indexOf(':');
                currentKey = line.substring(0, index).trim();
                currentValue = line.substring(index + 1);
            } else {
                currentValue += '\n' + line;
            }
        }
        if (currentKey) {
            result[currentKey] = currentValue.trim();
        }
        // Remove YAML block scalar headers (e.g. | or >)
        for (const key of Object.keys(result)) {
            result[key] = result[key].replace(/^[|>](\+|\-|\d)*\r?\n?/, '').trim();
        }
    }
    return result;
}

// Generic CSV Parser that handles double-quoted strings
function parseCsv<T>(content: string): T[] {
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const results: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const row: string[] = [];
        let cur = "";
        let inQuote = false;

        for (let j = 0; j < line.length; j++) {
            if (line[j] === '"') {
                if (inQuote && j + 1 < line.length && line[j + 1] === '"') {
                    cur += '"';
                    j++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (line[j] === "," && !inQuote) {
                row.push(cur.trim());
                cur = "";
            } else {
                cur += line[j];
            }
        }
        row.push(cur.trim());

        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
            obj[h] = row[idx] || "";
        });

        results.push(obj as T);
    }

    return results;
}

function main() {
    const workspaceRoot = path.resolve(__dirname, '..', '..');
    const manifestsDir = path.join(workspaceRoot, 'synapse-portal', 'manifests');

    // Ensure output directory exists
    if (!fs.existsSync(manifestsDir)) {
        fs.mkdirSync(manifestsDir, { recursive: true });
    }

    console.log(`Generating manifests in: ${manifestsDir}`);

    // ==========================================
    // 1. Generate skill-manifest.csv
    // ==========================================
    const skillsDir = path.join(workspaceRoot, 'synapse-plugin', '.agents', 'skills');
    const skillRecords: string[] = ['canonicalId,name,description,module,path'];

    function findSkillMdFiles(dir: string): string[] {
        let results: string[] = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(findSkillMdFiles(filePath));
            } else if (file === 'SKILL.md') {
                results.push(filePath);
            }
        }
        return results;
    }

    if (fs.existsSync(skillsDir)) {
        const skillPaths = findSkillMdFiles(skillsDir);
        for (const skillPath of skillPaths) {
            const content = fs.readFileSync(skillPath, 'utf-8');
            const meta = parseFrontmatter(content);
            const relativeFolder = path.relative(skillsDir, path.dirname(skillPath)).replace(/\\/g, '/');
            const folderName = path.basename(path.dirname(skillPath));
            const relPath = `synapse-plugin/.agents/skills/${relativeFolder}/SKILL.md`;
            
            let desc = meta.description || '';
            const cutIndex = desc.search(/mandatory:|trigger immediately for:/i);
            if (cutIndex !== -1) {
                desc = desc.substring(0, cutIndex).trim();
            }

            skillRecords.push([
                toCsvField(meta.name || folderName),
                toCsvField(meta.name || folderName),
                toCsvField(desc),
                toCsvField('synapse-plugin'),
                toCsvField(relPath)
            ].join(','));
        }
    }
    fs.writeFileSync(path.join(manifestsDir, 'skill-manifest.csv'), skillRecords.join('\n') + '\n', 'utf-8');
    console.log(`Generated skill-manifest.csv with ${skillRecords.length - 1} entries.`);

    // ==========================================
    // 2. Generate agent-manifest.csv
    // ==========================================
    const agentsDir = path.join(workspaceRoot, 'synapse-plugin', '.agents', 'agents');
    const agentRecords: string[] = ['name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId'];

    if (fs.existsSync(agentsDir)) {
        const folders = fs.readdirSync(agentsDir);
        for (const folder of folders) {
            const skillPath = path.join(agentsDir, folder, 'SKILL.md');
            if (fs.existsSync(skillPath)) {
                const content = fs.readFileSync(skillPath, 'utf-8');
                const meta = parseFrontmatter(content);
                const relPath = `synapse-plugin/.agents/agents/${folder}/SKILL.md`;

                // Extract displayName from H1 heading
                const h1Match = content.match(/^#\s+(.+)$/m);
                const displayName = h1Match ? h1Match[1].trim() : folder;

                // Extract sections
                const overview = extractSection(content, 'Overview');
                const identity = extractSection(content, 'Identity');
                const commStyle = extractSection(content, 'Communication Style');
                const rawPrinciples = extractSection(content, 'Principles');
                const principles = (() => {
                    if (!rawPrinciples) return "";
                    const lines = rawPrinciples.split("\n");
                    const list: string[] = [];
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                            const cleanText = trimmed.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim();
                            if (cleanText) {
                                list.push(cleanText);
                            }
                        }
                    }
                    return list.length > 0 ? list.join("; ") : rawPrinciples.trim();
                })();
                const rawCapabilities = extractSection(content, 'Capabilities');
                const capabilities = (() => {
                    if (!rawCapabilities) return "";
                    const lines = rawCapabilities.split("\n");
                    const caps: string[] = [];
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("|")) {
                            if (trimmed.includes("---") || trimmed.toLowerCase().includes("code")) continue;
                            const parts = trimmed.split("|").map(p => p.trim()).filter(p => p !== "");
                            if (parts.length >= 2) {
                                const cleanDesc = parts[1].replace(/\*\*/g, "").trim();
                                if (cleanDesc) {
                                    caps.push(cleanDesc);
                                }
                            }
                        }
                    }
                    return caps.length > 0 ? caps.join("; ") : rawCapabilities.trim();
                })();

                // Determine clean role description
                let role = meta.description || '';
                if (overview) {
                    const firstSentence = overview.split(/[.!?]/)[0];
                    if (firstSentence.includes('provides a')) {
                        role = firstSentence.split('provides a')[1].trim();
                    } else if (firstSentence.includes('provides an')) {
                        role = firstSentence.split('provides an')[1].trim();
                    }
                }

                // Get title and icon from frontmatter metadata with fallbacks
                const title = meta.title || displayName;
                const icon = meta.icon || 'User';

                agentRecords.push([
                    toCsvField(meta.name || folder),
                    toCsvField(displayName),
                    toCsvField(title),
                    toCsvField(icon),
                    toCsvField(capabilities),
                    toCsvField(role),
                    toCsvField(identity),
                    toCsvField(commStyle),
                    toCsvField(principles),
                    toCsvField('synapse-plugin'),
                    toCsvField(relPath),
                    toCsvField(meta.name || folder)
                ].join(','));
            }
        }
    }
    fs.writeFileSync(path.join(manifestsDir, 'agent-manifest.csv'), agentRecords.join('\n') + '\n', 'utf-8');
    console.log(`Generated agent-manifest.csv with ${agentRecords.length - 1} entries.`);

    // ==========================================
    // 3. Generate tool-manifest.csv
    // ==========================================
    const mcpToolsDir = path.join(workspaceRoot, 'synapse-mcp', 'tools');
    const toolRecords: string[] = ['name,description,module,path'];

    function scanPythonFiles(dir: string): string[] {
        let results: string[] = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                if (file !== 'tests' && file !== '__pycache__' && file !== 'skills_logic') {
                    results = results.concat(scanPythonFiles(filePath));
                }
            } else if (file.endsWith('.py') && file !== '__init__.py') {
                results.push(filePath);
            }
        }
        return results;
    }

    const pyFiles = scanPythonFiles(mcpToolsDir);
    for (const pyFile of pyFiles) {
        const content = fs.readFileSync(pyFile, 'utf-8');
        const relPath = path.relative(workspaceRoot, pyFile).replace(/\\/g, '/');

        // Match python functions with docstrings: def name(...):\n    """docstring"""
        // Python docstrings can be single or triple double quotes
        const funcRegex = /def\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*\r?\n\s+(?:"""|''')([\s\S]*?)(?:"""|''')/g;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            const docstring = match[2].trim();
            // Get first line of docstring as the short description
            const shortDesc = docstring.split('\n')[0].trim();

            toolRecords.push([
                toCsvField(funcName),
                toCsvField(shortDesc),
                toCsvField('synapse-mcp'),
                toCsvField(relPath)
            ].join(','));
        }
    }

    fs.writeFileSync(path.join(manifestsDir, 'tool-manifest.csv'), toolRecords.join('\n') + '\n', 'utf-8');
    console.log(`Generated tool-manifest.csv with ${toolRecords.length - 1} entries.`);

    // ==========================================
    // 4. Generate personal-manifest.csv
    // ==========================================
    const personalsCsvPath = path.join(workspaceRoot, 'synapse-plugin', '.agents', 'agents', 'synapse-agent-user', 'personals.csv');
    const personalRecords: string[] = ['id,displayName,region,description,cultural_traits,tech_literacy,pain_points'];

    if (fs.existsSync(personalsCsvPath)) {
        const content = fs.readFileSync(personalsCsvPath, 'utf-8');
        const rows = parseCsv<Record<string, string>>(content);
        for (const row of rows) {
            if (!row.id) continue;
            personalRecords.push([
                toCsvField(row.id),
                toCsvField(row.displayName),
                toCsvField(row.region),
                toCsvField(row.description),
                toCsvField(row.cultural_traits || row.culturalTraits),
                toCsvField(row.tech_literacy || row.techLiteracy),
                toCsvField(row.pain_points || row.painPoints)
            ].join(','));
        }
    } else {
        console.warn(`Warning: personals.csv not found at ${personalsCsvPath}`);
    }
    fs.writeFileSync(path.join(manifestsDir, 'personal-manifest.csv'), personalRecords.join('\n') + '\n', 'utf-8');
    console.log(`Generated personal-manifest.csv with ${personalRecords.length - 1} entries.`);
}

main();
