# FlexContainer

> Gerado de `@uigovpe/components@1.1.40` por `npm run sync-ds`. Não edite à mão.

Um container flexível e reutilizável, com suporte a direção, espaçamento, alinhamento e quebra de linha.

```tsx
import { FlexContainer } from '@uigovpe/components'
```

**Estende** `HTMLAttributes` de `react`, exceto `children`, `className`. As props de lá também valem.

## Props próprias

| Prop | Tipo | Obrigatória | Descrição |
|---|---|---|---|
| `children` | `ReactNode` | sim | Elementos filhos que serão renderizados dentro do container flexível. |
| `direction` | `'row' \| 'col'` | não | Direção do eixo principal. Define o fluxo dos itens. - 'row': da esquerda para a direita (padrão) - 'col': de cima para baixo |
| `gap` | `'0' \| '1' \| '2' \| '3' \| '4' \| '5' \| '6' \| '7' \| '8' \| '9' \| '10' \| '12' \| '14' \| '16' \| '20' \| '24' \| '32'` | não | Espaçamento (gap) entre os itens. O valor corresponde a uma escala predefinida em `rem`. Exemplo: '4' equivale a 1rem. |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | não | Justificação dos itens no eixo principal. - 'start': alinhados ao início - 'center': centralizados - 'end': alinhados ao fim - 'between': espaçados uniformemente com o primeiro no início e o último no fim - 'around': com espaçamento ao redor de todos os itens - 'evenly': com espaçamento igual entre todos os itens, incluindo extremidades |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | não | Alinhamento dos itens no eixo transversal. - 'start': alinhados ao topo ou à esquerda - 'center': centralizados - 'end': alinhados à base ou à direita - 'stretch': esticados para preencher o container (padrão) |
| `wrap` | `'nowrap' \| 'wrap' \| 'wrap-reverse'` | não | Comportamento de quebra de linha. - 'nowrap': todos os itens em uma única linha (padrão) - 'wrap': permite quebra de linha para múltiplas linhas - 'wrap-reverse': quebra de linha invertida |
| `className` | `string` | não | Classe adicional personalizada para aplicar estilos extras. |
