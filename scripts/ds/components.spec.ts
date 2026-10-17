import { test } from 'node:test'
import assert from 'node:assert/strict'

import { describeComponents } from './components.ts'
import type { ComponentDoc } from './components.ts'

const FILES: Record<string, string> = {
  '/pkg/index.d.ts': `
export { Button } from './Button.js';
export { C as CurrencyISO4217, I as InputCurrency } from './InputCurrency-abc.js';
export { Card } from './Card.js';
export { GovBar } from './GovBar.js';
export { Search, SearchProps } from './Search.js';
export { Table } from './Table.js';
export { LayoutProvider, useLayout } from './LayoutProvider.js';
export { InputText } from './InputText.js';
export { InputFile } from './InputFile.js';
export { Filter } from './Filter.js';
`,
  '/pkg/InputText.d.ts': `
import React__default from 'react';
import { InputTextProps as InputTextProps$1 } from 'primereact/inputtext';
interface InputTextProps extends Omit<InputTextProps$1, 'content'> {
    label?: string;
}
declare const InputText: React__default.ForwardRefExoticComponent<InputTextProps & React__default.RefAttributes<HTMLInputElement>>;
export { InputText };
`,
  '/pkg/InputFile.d.ts': `
import React__default from 'react';
interface InputFileProps extends Omit<React__default.ComponentProps<'input'>, 'onChange'> {
    mode?: 'default' | 'multiple';
}
declare const InputFile: React__default.ForwardRefExoticComponent<Omit<InputFileProps, "ref"> & React__default.RefAttributes<HTMLInputElement>>;
export { InputFile };
`,
  '/pkg/Filter.d.ts': `
import React__default from 'react';
interface FilterBaseProps { title?: string }
interface CheckboxFilterProps extends FilterBaseProps { checked?: boolean }
interface DropdownsFilterProps extends FilterBaseProps { value?: string }
type FilterProps = CheckboxFilterProps | DropdownsFilterProps | FilterBaseProps;
declare const Filter: React__default.FC<FilterProps>;
export { Filter };
`,
  '/pkg/Button.d.ts': `
import * as React from 'react';
import { ButtonProps, Button as Button$1 } from 'primereact/button';

interface ButtonUi extends ButtonProps {
    /** Fundo suave. */
    tonal?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonUi & React.RefAttributes<Button$1>>;

export { Button };
`,
  '/pkg/InputCurrency-abc.d.ts': `
import React__default from 'react';
import { InputTextProps } from 'primereact/inputtext';

type CurrencyISO4217 = 'BRL' | 'USD';
interface InputCurrencyProps extends InputTextProps {
    currency?: CurrencyISO4217;
    /** @deprecated use \`currency\` */
    moeda?: string;
}
declare const InputCurrency: React__default.FC<InputCurrencyProps>;

export { CurrencyISO4217 as C, InputCurrency as I, InputCurrencyProps as a };
`,
  '/pkg/Card.d.ts': `
import * as primereact_card from 'primereact/card';
import { Card as Card$1 } from 'primereact/card';
import React__default from 'react';

declare const Card: React__default.ForwardRefExoticComponent<primereact_card.CardProps & {
    elevation?: "medium" | "low" | "high" | undefined;
} & React__default.RefAttributes<Card$1>>;

export { Card };
`,
  '/pkg/GovBar.d.ts': `
import React__default from 'react';
import { S as StylesProps } from './StylesProps-x.js';

/**
 * Propriedades do componente \`GovBar\`.
 */
interface GovBarProps {
    /** Título da página. */
    title: string;
    /** Callback ao alternar o tema. */
    themeAction?: () => void;
    ui?: StylesProps;
}
/**
 * Barra institucional do Governo.
 */
declare const GovBar: React__default.FC<GovBarProps>;

export { GovBar };
`,
  '/pkg/StylesProps-x.d.ts': `
interface StylesProps { className?: string }
export type { StylesProps as S };
`,
  '/pkg/Search.d.ts': `
import React__default from 'react';
interface SearchProps { query?: string }
declare const Search: React__default.FC<SearchProps>;
export { Search, SearchProps };
`,
  '/pkg/Table.d.ts': `
import * as primereact_datatable from 'primereact/datatable';
import { DataTable } from 'primereact/datatable';
import React__default from 'react';

type TableExtraProps = {
    centered?: boolean;
};
declare const Table: React__default.ForwardRefExoticComponent<(primereact_datatable.DataTableProps<primereact_datatable.DataTableValueArray> & TableExtraProps) & React__default.RefAttributes<DataTable<primereact_datatable.DataTableValueArray>>>;

export { Table };
`,
  '/pkg/LayoutProvider.d.ts': `
import React__default, { ReactNode } from 'react';
declare const LayoutProvider: ({ children }: { children: ReactNode }) => React__default.JSX.Element;
declare const useLayout: () => { isMobile: boolean };
export { LayoutProvider, useLayout };
`,
}

const docs = describeComponents(FILES, '/pkg/index.d.ts')
const byName = (name: string): ComponentDoc => {
  const doc = docs.find(d => d.name === name)
  assert.ok(doc, `${name} missing from ${docs.map(d => d.name).join(', ')}`)
  return doc
}

test('lists only exported components, sorted', () => {
  assert.deepEqual(
    docs.map(d => d.name),
    ['Button', 'Card', 'Filter', 'GovBar', 'InputCurrency', 'InputFile', 'InputText', 'LayoutProvider', 'Search', 'Table'],
  )
})

test('interface extending a primereact type: own props and base', () => {
  const b = byName('Button')
  assert.deepEqual(b.bases, [{ name: 'ButtonProps', module: 'primereact/button' }])
  assert.deepEqual(b.props, [{ name: 'tonal', type: 'boolean', optional: true, doc: 'Fundo suave.', deprecated: false }])
})

test('follows a chunk re-export alias to the real declaration', () => {
  const c = byName('InputCurrency')
  assert.deepEqual(c.bases, [{ name: 'InputTextProps', module: 'primereact/inputtext' }])
  assert.equal(c.props.find(p => p.name === 'currency')?.type, 'CurrencyISO4217')
})

test('marks @deprecated props', () => {
  const moeda = byName('InputCurrency').props.find(p => p.name === 'moeda')
  assert.equal(moeda?.deprecated, true)
})

test('namespace-qualified base and inline type literal', () => {
  const c = byName('Card')
  assert.deepEqual(c.bases, [{ name: 'CardProps', module: 'primereact/card' }])
  assert.deepEqual(c.props.map(p => p.name), ['elevation'])
})

test('local type alias and generic qualified base, through parentheses', () => {
  const t = byName('Table')
  assert.deepEqual(t.bases, [{ name: 'DataTableProps', module: 'primereact/datatable' }])
  assert.deepEqual(t.props.map(p => p.name), ['centered'])
})

test('FC with no base: required props and the component doc', () => {
  const g = byName('GovBar')
  assert.deepEqual(g.bases, [])
  assert.equal(g.doc, 'Barra institucional do Governo.')
  const title = g.props.find(p => p.name === 'title')
  assert.equal(title?.optional, false)
  assert.equal(title?.doc, 'Título da página.')
})

test('a function component declared as an arrow type', () => {
  const l = byName('LayoutProvider')
  assert.deepEqual(l.props.map(p => p.name), ['children'])
})

test('Omit<Base, keys> keeps the base and names the omitted keys', () => {
  const t = byName('InputText')
  assert.deepEqual(t.bases, [{ name: 'InputTextProps', module: 'primereact/inputtext', omit: ['content'] }])
  assert.deepEqual(t.props.map(p => p.name), ['label'])
})

test('a native element base keeps its literal type argument', () => {
  const f = byName('InputFile')
  assert.deepEqual(f.bases, [{ name: "ComponentProps<'input'>", module: 'react', omit: ['ref', 'onChange'] }])
  assert.deepEqual(f.props.map(p => p.name), ['mode'])
})

test('a union of variants lists each prop once', () => {
  const f = byName('Filter')
  assert.deepEqual(f.props.map(p => p.name), ['title', 'checked', 'value'])
})

test('a deprecated prop with no doc keeps the @deprecated message', () => {
  const moeda = byName('InputCurrency').props.find(p => p.name === 'moeda')
  assert.equal(moeda?.doc, 'use `currency`')
})

test('bundler aliases of React read as React', () => {
  const props = byName('LayoutProvider').props
  assert.equal(props.find(p => p.name === 'children')?.type, 'ReactNode')
  const icon = describeComponents(
    { '/x/index.d.ts': "import React__default from 'react';\ninterface P { icon?: React__default.ReactNode }\ndeclare const X: React__default.FC<P>;\nexport { X };" },
    '/x/index.d.ts',
  )[0]!.props[0]!
  assert.equal(icon.type, 'React.ReactNode')
})
