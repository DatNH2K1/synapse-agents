package main

import (
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io"
	"os"
)

type Symbol struct {
	Name  string `json:"name"`
	Kind  string `json:"kind"`
	Range string `json:"range"`
}

type Import struct {
	Name string `json:"name"`
	From string `json:"from"`
}

type Output struct {
	Exports []Symbol `json:"exports"`
	Imports []Import `json:"imports"`
}

func main() {
	var src interface{}
	var filename = ""

	if len(os.Args) < 2 || os.Args[1] == "-" {
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading from Stdin: %v\n", err)
			os.Exit(1)
		}
		src = data
		filename = "<stdin>"
	} else {
		filename = os.Args[1]
	}

	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, filename, src, parser.ParseComments)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing Go file: %v\n", err)
		os.Exit(1)
	}

	output := Output{
		Exports: []Symbol{},
		Imports: []Import{},
	}

	for _, imp := range file.Imports {
		pathVal := ""
		if imp.Path != nil {
			pathVal = imp.Path.Value
			if len(pathVal) > 2 {
				pathVal = pathVal[1 : len(pathVal)-1]
			}
		}
		nameVal := ""
		if imp.Name != nil {
			nameVal = imp.Name.Name
		}
		output.Imports = append(output.Imports, Import{
			Name: nameVal,
			From: pathVal,
		})
	}

	for _, decl := range file.Decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			if d.Name != nil && ast.IsExported(d.Name.Name) {
				pos := fset.Position(d.Pos())
				end := fset.Position(d.End())
				output.Exports = append(output.Exports, Symbol{
					Name:  d.Name.Name,
					Kind:  "function",
					Range: fmt.Sprintf("%d:%d-%d:%d", pos.Line, pos.Column, end.Line, end.Column),
				})
			}
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				switch s := spec.(type) {
				case *ast.TypeSpec:
					if s.Name != nil && ast.IsExported(s.Name.Name) {
						pos := fset.Position(s.Pos())
						end := fset.Position(s.End())
						output.Exports = append(output.Exports, Symbol{
							Name:  s.Name.Name,
							Kind:  "type",
							Range: fmt.Sprintf("%d:%d-%d:%d", pos.Line, pos.Column, end.Line, end.Column),
						})
					}
				case *ast.ValueSpec:
					for _, name := range s.Names {
						if name != nil && ast.IsExported(name.Name) {
							pos := fset.Position(name.Pos())
							end := fset.Position(name.End())
							output.Exports = append(output.Exports, Symbol{
								Name:  name.Name,
								Kind:  "variable",
								Range: fmt.Sprintf("%d:%d-%d:%d", pos.Line, pos.Column, end.Line, end.Column),
							})
						}
					}
				}
			}
		}
	}

	res, err := json.MarshalIndent(output, "", "  ")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshalling JSON: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(res))
}
