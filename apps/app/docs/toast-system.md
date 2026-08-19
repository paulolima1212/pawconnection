# Sistema de Toast/Alert

Um sistema moderno de notificações/alerts que segue perfeitamente a identidade visual do projeto.

## 🎨 Design

- **Cores do Projeto**: Integrado com a paleta (#f6a274, #e7c9fe, #58816d, #e57373)
- **Fonte Montserrat**: Consistente com todo o app
- **Animações Suaves**: Motion/React para entrada/saída
- **Bordas Características**: Border-3 preta, arredondamentos modernos
- **Progress Bar**: Indicador visual de tempo restante

## 📦 Componentes

### `Toast.tsx`
Componente principal de notificação com 4 tipos:
- ✅ **Success** - Verde (#58816d)
- ❌ **Error** - Vermelho (#e57373)
- ⚠️ **Warning** - Laranja (#f6a274)
- ℹ️ **Info** - Roxo (#e7c9fe)

### `useToast.ts`
Hook customizado para gerenciar toasts facilmente.

## 🚀 Como Usar

### 1. Setup Inicial

```tsx
import { useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/Toast";

function App() {
  const toast = useToast();

  return (
    <div>
      {/* Adicione o container uma vez no componente raiz */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Seu conteúdo aqui */}
    </div>
  );
}
```

### 2. Mostrar Toasts

#### Métodos Rápidos

```tsx
// Success
toast.success("Título", "Mensagem opcional");

// Error
toast.error("Erro!", "Algo deu errado");

// Warning
toast.warning("Atenção", "Revise suas mudanças");

// Info
toast.info("Info", "Nova atualização disponível");
```

#### Método Customizado

```tsx
toast.showToast({
  type: "success",
  title: "Custom Toast",
  message: "Mensagem detalhada",
  duration: 5000,        // 5 segundos (padrão: 3000)
  position: "bottom"     // "top", "bottom", "center" (padrão: "top")
});
```

### 3. Duração Customizada

```tsx
// Toast de 5 segundos
toast.success("Título", "Mensagem", 5000);

// Toast permanente (fechar manualmente)
toast.info("Título", "Mensagem", 0);
```

## 🎯 Exemplos Práticos

### Confirmar Ação
```tsx
const handleConfirm = () => {
  toast.success("Request Accepted!", "You are now friends with Pluto", 4000);
};
```

### Erro de Validação
```tsx
const handleSubmit = () => {
  if (!isValid) {
    toast.error("Validation Failed", "Please fill all required fields");
    return;
  }
  // Continuar...
};
```

### Aviso Antes de Deletar
```tsx
const handleDelete = () => {
  toast.warning("Item Deleted", "This action cannot be undone", 3000);
};
```

### Informação Geral
```tsx
const handleInfo = () => {
  toast.info("Photo Viewer", "Viewing profile photo");
};
```

## 🎨 Customização

### Posições Disponíveis
- `top` - Topo da tela (padrão)
- `bottom` - Fundo da tela
- `center` - Centro da tela

### Durações
- Curto: `2000ms` (2 segundos)
- Padrão: `3000ms` (3 segundos)
- Longo: `5000ms` (5 segundos)
- Permanente: `0` (requer fechar manualmente)

## 🔧 API Completa

### `useToast()` Hook

Retorna:
```typescript
{
  toasts: Array<ToastItem>,           // Lista de toasts ativos
  showToast: (options) => string,     // Mostra toast customizado
  removeToast: (id: string) => void,  // Remove toast específico
  success: (title, message?, duration?) => string,
  error: (title, message?, duration?) => string,
  warning: (title, message?, duration?) => string,
  info: (title, message?, duration?) => string,
}
```

### `Toast` Props

```typescript
{
  type: "success" | "error" | "warning" | "info",
  title: string,
  message?: string,
  duration?: number,
  isVisible: boolean,
  onClose: () => void,
  position?: "top" | "bottom" | "center"
}
```

## 💡 Dicas

1. **Posicione ToastContainer uma vez** no componente raiz do app
2. **Use títulos curtos** (1-3 palavras) para melhor legibilidade
3. **Mensagens descritivas** ajudam o usuário a entender o contexto
4. **Evite múltiplos toasts simultâneos** - eles empilham automaticamente
5. **Success/Error em ações críticas** - dê feedback claro ao usuário
6. **Info para dicas e avisos** - informações não urgentes
7. **Warning antes de ações destrutivas** - previna erros

## 🎪 Demo

Clique no botão **ℹ️** no header para testar todos os tipos de toast!

## 🏗️ Estrutura de Arquivos (React Native / Expo)

```
apps/app/
├── components/paw/toast.tsx      # Toast + ToastContainer
├── context/toast.tsx             # ToastProvider + useToast
├── context/paw-tooltip.tsx       # PawTooltipProvider (alias legado)
└── hooks/use-toast.ts            # Re-export do hook
```

O `PawTooltipProvider` em `app/_layout.tsx` já monta o `ToastContainer` globalmente. Código legado pode seguir com `usePawTooltip()`; código novo deve preferir `useToast()`.

## 🎨 Cores e Estilo

| Tipo    | Background | Border    | Icon/Text |
|---------|-----------|-----------|-----------|
| Success | #58816d   | #243b2f   | White     |
| Error   | #e57373   | #d32f2f   | White     |
| Warning | #f6a274   | #e08a5a   | #332015   |
| Info    | #e7c9fe   | #c49ee8   | #332015   |

---

**Desenvolvido com ❤️ mantendo a identidade visual do PawPost**
