# GovBar

> Gerado de `@uigovpe/components@1.1.40` por `npm run sync-ds`. Não edite à mão.

Barra institucional com link para o Governo de Pernambuco e controles de acessibilidade.

```tsx
import { GovBar } from '@uigovpe/components'
```

## Props próprias

| Prop | Tipo | Obrigatória | Descrição |
|---|---|---|---|
| `themeAction` | `() => void` | não | Callback disparado ao alternar o tema (ex.: claro ⇄ escuro). |
| `cookiesAction` | `() => void` | não | Callback disparado ao interagir com o controlador de cookies. |
| `ui` | `GovBarUiProps` | não | Personalização de classes e estilos por área da barra. |
| `showCookies` | `boolean` | não | Exibição do botão de cookies. |
| `showFontSizeController` | `boolean` | não | Exibição dos botões que controlam o tamanho da fonte geral da aplicação. |
| `showThemeController` | `boolean` | não | Exibição do botão de alterar tema entre light e dark. |
| `isFixed` | `Boolean` | não | Determina se a barra do governo é fixa na página. |

## Storybook

- [Docs](https://ligadigital.pe.gov.br/storybook/index.html?path=/docs/componentes-govbar--docs)
- [Default](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-govbar--default)
- [Gov Bar Default](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-govbar--gov-bar-default)
- [Gov Bar Cookies Action](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-govbar--gov-bar-cookies-action)
- [Gov Bar Font Size](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-govbar--gov-bar-font-size)
- [Gov Bar Theme Action](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-govbar--gov-bar-theme-action)
- [Gov Bar Custom](https://ligadigital.pe.gov.br/storybook/index.html?path=/story/componentes-govbar--gov-bar-custom)
