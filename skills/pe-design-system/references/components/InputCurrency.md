# InputCurrency

> Gerado de `@uigovpe/components@1.1.40` por `npm run sync-ds`. Não edite à mão.

```tsx
import { InputCurrency } from '@uigovpe/components'
```

**Estende** `InputTextProps` de `primereact/inputtext`, exceto `value`, `onChange`. As props de lá também valem.

## Props próprias

| Prop | Tipo | Obrigatória | Descrição |
|---|---|---|---|
| `label` | `string` | não |  |
| `suportText` | `string` | não | **Obsoleta.** use `supportText` |
| `supportText` | `string` | não |  |
| `value` | `number` | não |  |
| `onChange` | `(e: { value: number; }) => void` | não |  |
| `currency` | `CurrencyISO4217` | não |  |
| `locale` | `string` | não |  |
| `minimumFractionDigits` | `number` | não |  |
| `maximumFractionDigits` | `number` | não |  |

## Storybook

- [Docs](https://ligadigital.pe.gov.br/storybook/index.html?path=/docs/componentes-inputcurrency--docs)
- [Default](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-inputcurrency--default)
- [Input Currency Disabled](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-inputcurrency--input-currency-disabled)
- [Input Currency Invalid](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-inputcurrency--input-currency-invalid)
- [Input Currency Locale](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-inputcurrency--input-currency-locale)
