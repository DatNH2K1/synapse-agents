<?php
$filePath = null;
if ($argc < 2 || $argv[1] === '-') {
    $code = file_get_contents("php://stdin");
} else {
    $filePath = $argv[1];
    $code = file_get_contents($filePath);
    if ($code === false) {
        fwrite(STDERR, "Could not read file: $filePath\n");
        exit(1);
    }
}

// Resolve vendor/autoload.php — walk up from file dir or cwd
$searchDir = ($filePath && $filePath !== '-') ? dirname(realpath($filePath)) : getcwd();
$autoloadFile = null;
$dir = $searchDir;
while ($dir && $dir !== '/' && $dir !== dirname($dir)) {
    $vendorAutoload = $dir . '/vendor/autoload.php';
    if (file_exists($vendorAutoload)) {
        $autoloadFile = $vendorAutoload;
        break;
    }
    $dir = dirname($dir);
}

if ($autoloadFile) {
    require_once $autoloadFile;
}

$exports = [];
$imports = [];

if (class_exists('PhpParser\ParserFactory')) {
    try {
        $factory = new PhpParser\ParserFactory();
        if (method_exists($factory, 'createForNewestSupportedVersion')) {
            $parser = $factory->createForNewestSupportedVersion();
        } else {
            $parser = $factory->create(PhpParser\ParserFactory::PREFER_PHP7);
        }
        $ast = $parser->parse($code);
        collectSymbols($ast, $exports, $imports);
        findClassConstReferences($ast, $imports);
    } catch (Exception $e) {
        runTokenizerFallback($code, $exports, $imports);
    }
} else {
    runTokenizerFallback($code, $exports, $imports);
}

// Extract views and configs references
extractViewsAndConfigs($code, $imports);

echo json_encode(["exports" => $exports, "imports" => $imports], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// Compatible helper: extract string from Name node (v4 uses ->parts array, v5 uses ->name string)
function nameToString($name) {
    if ($name === null) return '';
    if (is_string($name)) return $name;
    // v5: Name has ->name as string
    if (isset($name->name) && is_string($name->name)) return $name->name;
    // v4: Name has ->parts as array
    if (isset($name->parts) && is_array($name->parts)) return implode('\\', $name->parts);
    // fallback: cast to string (PhpParser\Node\Name has __toString)
    return (string)$name;
}

// Compatible helper: get last part of a Name node (for aliases)
function nameLastPart($name) {
    $str = nameToString($name);
    $parts = explode('\\', $str);
    return end($parts);
}

function collectSymbols($nodes, &$exports, &$imports, $namespace = '') {
    if (!$nodes) return;
    foreach ($nodes as $node) {
        if ($node instanceof PhpParser\Node\Stmt\Namespace_) {
            $ns = $node->name ? nameToString($node->name) : '';
            collectSymbols($node->stmts, $exports, $imports, $ns);
        } elseif ($node instanceof PhpParser\Node\Stmt\Class_ || $node instanceof PhpParser\Node\Stmt\Interface_ || $node instanceof PhpParser\Node\Stmt\Trait_ || $node instanceof PhpParser\Node\Stmt\Enum_) {
            $name = $node->name ? $node->name->name : '';
            if ($name) {
                $fullName = $namespace ? $namespace . '\\' . $name : $name;
                $kind = "class";
                if ($node instanceof PhpParser\Node\Stmt\Interface_) {
                    $kind = "interface";
                } elseif ($node instanceof PhpParser\Node\Stmt\Trait_) {
                    $kind = "trait";
                } elseif ($node instanceof PhpParser\Node\Stmt\Enum_) {
                    $kind = "enum";
                }
                $exports[] = [
                    "name" => $fullName,
                    "kind" => $kind,
                    "range" => $node->getStartLine() . ":0-" . $node->getEndLine() . ":0"
                ];
            }
        } elseif ($node instanceof PhpParser\Node\Stmt\Function_) {
            $name = $node->name ? $node->name->name : '';
            if ($name) {
                $fullName = $namespace ? $namespace . '\\' . $name : $name;
                $exports[] = [
                    "name" => $fullName,
                    "kind" => "function",
                    "range" => $node->getStartLine() . ":0-" . $node->getEndLine() . ":0"
                ];
            }
        } elseif ($node instanceof PhpParser\Node\Stmt\Use_) {
            foreach ($node->uses as $use) {
                $from = nameToString($use->name);
                $alias = $use->alias ? $use->alias->name : nameLastPart($use->name);
                $imports[] = [
                    "name" => $alias,
                    "from" => $from
                ];
            }
        }
    }
}

function findClassConstReferences($nodes, &$imports) {
    if (!$nodes) return;
    if (is_array($nodes)) {
        foreach ($nodes as $node) {
            findClassConstReferences($node, $imports);
        }
        return;
    }
    if (!is_object($nodes)) return;

    if ($nodes instanceof PhpParser\Node\Expr\ClassConstFetch) {
        if ($nodes->name instanceof PhpParser\Node\Identifier && strtolower($nodes->name->name) === 'class') {
            $from = nameToString($nodes->class);
            if ($from && !in_array(strtolower($from), ['self', 'static', 'parent'])) {
                $imports[] = [
                    "name" => nameLastPart($nodes->class),
                    "from" => $from
                ];
            }
        }
    }

    foreach ($nodes as $key => $val) {
        if ($val instanceof PhpParser\Node) {
            findClassConstReferences($val, $imports);
        } elseif (is_array($val)) {
            findClassConstReferences($val, $imports);
        }
    }
}


function runTokenizerFallback($code, &$exports, &$imports) {
    $tokens = token_get_all($code);
    $count = count($tokens);
    for ($i = 0; $i < $count; $i++) {
        $token = $tokens[$i];
        if (is_array($token)) {
            $id = $token[0];
            $text = $token[1];
            $line = $token[2];

            if ($id === T_CLASS || $id === T_INTERFACE || (defined('T_TRAIT') && $id === T_TRAIT) || (defined('T_ENUM') && $id === T_ENUM)) {
                for ($j = $i + 1; $j < $count; $j++) {
                    if (is_array($tokens[$j])) {
                        if ($tokens[$j][0] === T_STRING) {
                            $kind = "class";
                            if ($id === T_INTERFACE) {
                                $kind = "interface";
                            } elseif (defined('T_TRAIT') && $id === T_TRAIT) {
                                $kind = "trait";
                            } elseif (defined('T_ENUM') && $id === T_ENUM) {
                                $kind = "enum";
                            }
                            $exports[] = [
                                "name" => $tokens[$j][1],
                                "kind" => $kind,
                                "range" => "$line:0-" . $tokens[$j][2] . ":0"
                            ];
                            break;
                        }
                    }
                }
            } elseif ($id === T_FUNCTION) {
                for ($j = $i + 1; $j < $count; $j++) {
                    if (is_array($tokens[$j])) {
                        if ($tokens[$j][0] === T_STRING) {
                            $exports[] = [
                                "name" => $tokens[$j][1],
                                "kind" => "function",
                                "range" => "$line:0-" . $tokens[$j][2] . ":0"
                            ];
                            break;
                        }
                    }
                }
            } elseif ($id === T_DOUBLE_COLON) {
                $classKeywordToken = null;
                for ($j = $i + 1; $j < $count; $j++) {
                    $nextT = $tokens[$j];
                    if (is_array($nextT)) {
                        if ($nextT[0] === T_WHITESPACE) continue;
                        if ($nextT[0] === T_CLASS || strtolower($nextT[1]) === 'class') {
                            $classKeywordToken = $nextT;
                        }
                        break;
                    } else {
                        if (strtolower($nextT) === 'class') {
                            $classKeywordToken = $nextT;
                        }
                        break;
                    }
                }
                if ($classKeywordToken !== null) {
                    $classNameTokens = [];
                    for ($j = $i - 1; $j >= 0; $j--) {
                        $prevT = $tokens[$j];
                        if (is_array($prevT)) {
                            $prevId = $prevT[0];
                            if ($prevId === T_WHITESPACE) {
                                if (empty($classNameTokens)) {
                                    continue;
                                } else {
                                    break;
                                }
                            }
                            if ($prevId === T_STRING || $prevId === T_NS_SEPARATOR || 
                                (defined('T_NAME_QUALIFIED') && $prevId === T_NAME_QUALIFIED) || 
                                (defined('T_NAME_FULLY_QUALIFIED') && $prevId === T_NAME_FULLY_QUALIFIED)) {
                                $classNameTokens[] = $prevT[1];
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    if (!empty($classNameTokens)) {
                        $classNameTokens = array_reverse($classNameTokens);
                        $className = implode('', $classNameTokens);
                        $cleanClassName = ltrim($className, '\\');
                        if ($cleanClassName && !in_array(strtolower($cleanClassName), ['self', 'static', 'parent'])) {
                            $parts = explode('\\', $cleanClassName);
                            $imports[] = [
                                "name" => end($parts),
                                "from" => $cleanClassName
                            ];
                        }
                    }
                }
            } elseif ($id === T_USE) {
                $importName = "";
                for ($j = $i + 1; $j < $count; $j++) {
                    $t = $tokens[$j];
                    if (is_array($t)) {
                        if ($t[0] === T_STRING || $t[0] === T_NS_SEPARATOR || (defined('T_NAME_QUALIFIED') && $t[0] === T_NAME_QUALIFIED) || (defined('T_NAME_FULLY_QUALIFIED') && $t[0] === T_NAME_FULLY_QUALIFIED)) {
                            $importName .= $t[1];
                        }
                    } else {
                        if ($t === ';') {
                            $i = $j;
                            break;
                        }
                        if ($t === ',') {
                            if ($importName) {
                                $parts = explode('\\', $importName);
                                $imports[] = [
                                    "name" => end($parts),
                                    "from" => $importName
                                ];
                            }
                            $importName = "";
                        }
                    }
                }
                if ($importName) {
                    $parts = explode('\\', $importName);
                    $imports[] = [
                        "name" => end($parts),
                        "from" => $importName
                    ];
                }
            }
        }
    }
}

function extractViewsAndConfigs($code, &$imports) {
    // 1. Matches view('some.view') or View::make('some.view') or response()->view('some.view')
    if (preg_match_all('/(?:view|View::make)\s*\(\s*[\'"]([^\'"]+)[\'"]/i', $code, $matches)) {
        foreach ($matches[1] as $viewName) {
            if ($viewName && strpos($viewName, '$') === false) {
                $imports[] = [
                    "name" => "view",
                    "from" => "view:" . $viewName
                ];
            }
        }
    }

    // 2. Matches config('some.key') or Config::get('some.key')
    if (preg_match_all('/(?:config|Config::get)\s*\(\s*[\'"]([^\'"]+)[\'"]/i', $code, $matches)) {
        foreach ($matches[1] as $configName) {
            if ($configName && strpos($configName, '$') === false) {
                $imports[] = [
                    "name" => "config",
                    "from" => "config:" . $configName
                ];
            }
        }
    }

    // 3. Matches Blade directives like @extends, @include, @includeIf, etc.
    $bladeDirectives = ['extends', 'include', 'includeIf', 'includeWhen', 'includeUnless', 'each', 'livewire'];
    foreach ($bladeDirectives as $directive) {
        if (preg_match_all('/@' . $directive . '\s*\(\s*[\'"]([^\'"]+)[\'"]/i', $code, $matches)) {
            foreach ($matches[1] as $viewName) {
                if ($viewName && strpos($viewName, '$') === false) {
                    $imports[] = [
                        "name" => "view",
                        "from" => "view:" . $viewName
                    ];
                }
            }
        }
    }

    // 4. Matches Blade components like <x-alert ...> or <x-navigation.link-detail ...>
    if (preg_match_all('/<x-([a-zA-Z0-9\-\._:]+)/i', $code, $matches)) {
        foreach ($matches[1] as $componentName) {
            if ($componentName !== 'slot') {
                $imports[] = [
                    "name" => "component",
                    "from" => "component:" . $componentName
                ];
            }
        }
    }
}
