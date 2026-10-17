# TextLink

> Gerado de `@uigovpe/components@1.1.40` por `npm run sync-ds`. Não edite à mão.

Componente de link estilizado, com suporte para links externos e navegação via onClick.

```tsx
import { TextLink } from '@uigovpe/components'
```

**Estende** `AnchorHTMLAttributes` de `react`. As props de lá também valem.

## Props próprias

| Prop | Tipo | Obrigatória | Descrição |
|---|---|---|---|
| `href` | `string` | não | URL do link. Opcional se `onClick` for usado como handler de navegação. |
| `children` | `ReactNode` | sim | Conteúdo interno (texto ou elementos). |
| `external` | `boolean` | não | Se true, o link será tratado como externo (abre em nova aba). Também é ativado automaticamente para URLs que começam com "http". |
| `onClick` | `(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void` | não | Função de callback ao clicar no link. |
