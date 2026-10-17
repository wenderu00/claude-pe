import ts from 'typescript'

export type Base = { name: string; module: string; omit?: string[] }
export type Prop = { name: string; type: string; optional: boolean; doc: string; deprecated: boolean }
export type ComponentDoc = { name: string; doc: string; bases: Base[]; props: Prop[] }

type Out = { bases: Base[]; props: Prop[] }

// Component types whose first type argument is the props.
const WRAPPERS = new Set([
  'ForwardRefExoticComponent',
  'FC',
  'FunctionComponent',
  'ComponentType',
  'NamedExoticComponent',
  'MemoExoticComponent',
])

const isRelative = (spec: string): boolean => spec.startsWith('.')

function programOf(files: Record<string, string>, entry: string): ts.Program {
  const options: ts.CompilerOptions = {
    noLib: true,
    types: [],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
  }
  const norm = (f: string) => f.replace(/\\/g, '/')
  const host: ts.CompilerHost = {
    getSourceFile: (name, version) => {
      const text = files[norm(name)]
      return text === undefined ? undefined : ts.createSourceFile(name, text, version, true)
    },
    getDefaultLibFileName: () => '/lib.d.ts',
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: f => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: f => norm(f) in files,
    readFile: f => files[norm(f)],
  }
  return ts.createProgram([entry], options, host)
}

// The string literal keys of `Omit`'s second argument: `'a' | 'b'`.
function keysOf(node: ts.TypeNode | undefined): string[] {
  if (!node) return []
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(keysOf)
  if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return [node.literal.text]
  return []
}

class Reader {
  private readonly checker: ts.TypeChecker

  constructor(checker: ts.TypeChecker) {
    this.checker = checker
  }

  private textOf(node: ts.Node): string {
    return node.getText().replace(/\s+/g, ' ').replace(/\bReact__default\b/g, 'React').trim()
  }

  private deprecationOf(node: ts.Node): string {
    const tag = ts.getJSDocDeprecatedTag(node)
    return tag ? (ts.getTextOfJSDocComment(tag.comment) ?? '').trim() : ''
  }

  private docOf(node: ts.Node): string {
    const sym = this.checker.getSymbolAtLocation(node)
    return sym ? ts.displayPartsToString(sym.getDocumentationComment(this.checker)).trim() : ''
  }

  propsTypeOf(type: ts.TypeNode): ts.TypeNode | undefined {
    if (ts.isFunctionTypeNode(type)) return type.parameters[0]?.type
    if (ts.isTypeReferenceNode(type)) {
      const last = ts.isQualifiedName(type.typeName) ? type.typeName.right : type.typeName
      if (WRAPPERS.has(last.text)) return type.typeArguments?.[0]
    }
    return undefined
  }

  collect(node: ts.TypeNode, out: Out, omit: string[] = []): void {
    if (ts.isParenthesizedTypeNode(node)) return this.collect(node.type, out, omit)
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
      return node.types.forEach(t => this.collect(t, out, omit))
    }
    if (ts.isTypeLiteralNode(node)) return this.members(node.members, out, omit)
    if (ts.isTypeReferenceNode(node)) return this.reference(node.typeName, node.typeArguments, out, omit)
  }

  private members(members: ts.NodeArray<ts.TypeElement>, out: Out, omit: string[]): void {
    for (const m of members) {
      if (!(ts.isPropertySignature(m) || ts.isMethodSignature(m)) || !m.name) continue
      const name = m.name.getText()
      if (omit.includes(name)) continue
      out.props.push({
        name,
        type: ts.isPropertySignature(m) ? (m.type ? this.textOf(m.type) : 'any') : this.textOf(m).replace(/^[^(]*/, ''),
        optional: m.questionToken !== undefined,
        doc: this.docOf(m.name) || this.deprecationOf(m),
        deprecated: ts.getJSDocDeprecatedTag(m) !== undefined,
      })
    }
  }

  private base(name: string, args: ts.NodeArray<ts.TypeNode> | undefined, module: string, omit: string[]): Base {
    const literal = args && args.length > 0 && args.every(a => ts.isLiteralTypeNode(a))
    const full = literal ? `${name}<${args.map(a => a.getText()).join(', ')}>` : name
    return omit.length > 0 ? { name: full, module, omit } : { name: full, module }
  }

  private reference(
    name: ts.EntityName | ts.Expression,
    args: ts.NodeArray<ts.TypeNode> | undefined,
    out: Out,
    omit: string[],
  ): void {
    if (ts.isIdentifier(name) && name.text === 'Omit' && args?.[0]) {
      return this.collect(args[0], out, [...omit, ...keysOf(args[1])])
    }
    if (ts.isQualifiedName(name) || ts.isPropertyAccessExpression(name)) {
      const left = ts.isQualifiedName(name) ? name.left : name.expression
      const right = ts.isQualifiedName(name) ? name.right : name.name
      if (right.text === 'RefAttributes') return
      const decl = this.checker.getSymbolAtLocation(left)?.declarations?.[0]
      const importOf = decl && (ts.isNamespaceImport(decl) ? decl.parent.parent : ts.isImportClause(decl) ? decl.parent : undefined)
      if (importOf) {
        const spec = (importOf.moduleSpecifier as ts.StringLiteral).text
        if (!isRelative(spec)) out.bases.push(this.base(right.text, args, spec, omit))
      }
      return
    }
    if (!ts.isIdentifier(name) || name.text === 'RefAttributes') return
    let sym = this.checker.getSymbolAtLocation(name)
    if (!sym) return
    const first = sym.declarations?.[0]
    if (first && ts.isImportSpecifier(first)) {
      const spec = (first.parent.parent.parent.moduleSpecifier as ts.StringLiteral).text
      if (!isRelative(spec)) {
        out.bases.push(this.base((first.propertyName ?? first.name).text, args, spec, omit))
        return
      }
    }
    if (sym.flags & ts.SymbolFlags.Alias) sym = this.checker.getAliasedSymbol(sym)
    for (const decl of sym.declarations ?? []) {
      if (ts.isInterfaceDeclaration(decl)) {
        for (const clause of decl.heritageClauses ?? []) {
          for (const t of clause.types) this.reference(t.expression, t.typeArguments, out, omit)
        }
        this.members(decl.members, out, omit)
      } else if (ts.isTypeAliasDeclaration(decl)) {
        this.collect(decl.type, out, omit)
      }
    }
  }

  component(exported: ts.Symbol): ComponentDoc | undefined {
    const sym = exported.flags & ts.SymbolFlags.Alias ? this.checker.getAliasedSymbol(exported) : exported
    const decl = sym.valueDeclaration
    if (!decl || !ts.isVariableDeclaration(decl) || !decl.type) return undefined
    const propsType = this.propsTypeOf(decl.type)
    if (!propsType) return undefined
    const out: Out = { bases: [], props: [] }
    this.collect(propsType, out)
    const once = <T>(list: T[], key: (t: T) => string): T[] =>
      list.filter((t, i) => list.findIndex(u => key(u) === key(t)) === i)
    return {
      name: exported.name,
      doc: ts.displayPartsToString(sym.getDocumentationComment(this.checker)).trim(),
      bases: once(out.bases, b => `${b.module}:${b.name}`),
      props: once(out.props, p => p.name),
    }
  }
}

// Every exported React component of the package whose type entry is `entry`, sorted by name.
export function describeComponents(files: Record<string, string>, entry: string): ComponentDoc[] {
  const program = programOf(files, entry)
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(entry)
  const moduleSym = source && checker.getSymbolAtLocation(source)
  if (!moduleSym) throw new Error(`no module at ${entry}`)
  const reader = new Reader(checker)
  return checker
    .getExportsOfModule(moduleSym)
    .filter(s => /^[A-Z]/.test(s.name))
    .map(s => reader.component(s))
    .filter((d): d is ComponentDoc => d !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// For each primereact module a component extends: the @uigovpe components to use instead.
export function wrappers(docs: ComponentDoc[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const doc of docs) {
    for (const base of doc.bases) {
      if (!base.module.startsWith('primereact/')) continue
      out[base.module] = [...new Set([...(out[base.module] ?? []), doc.name])].sort()
    }
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
}
