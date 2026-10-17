#!/usr/bin/env bash
# Prepara o WSL (Ubuntu) para rodar Claude Code + terminal-browser dentro do kitty (WSLg).
# Uso: wsl -d Ubuntu -- bash /mnt/c/projects/claude-pe/scripts/spike-wsl.sh
set -euo pipefail

if [ -z "${WAYLAND_DISPLAY:-}${DISPLAY:-}" ]; then
  echo "WSLg não está ativo (sem WAYLAND_DISPLAY/DISPLAY). O kitty precisa dele." >&2
  exit 1
fi

echo "== kitty (apt, pede sudo)"
sudo apt-get update
sudo apt-get install -y kitty fonts-dejavu-core
kitty --version

echo "== Claude Code (instalador nativo, sem sudo)"
if ! command -v claude >/dev/null; then
  curl -fsSL https://claude.ai/install.sh | bash
fi
export PATH="$HOME/.local/bin:$PATH"
claude --version

echo "== terminal-browser"
if ! command -v terminal-browser >/dev/null; then
  curl -fsSL https://terminal-browser.sh/install | bash
fi
export PATH="$HOME/.local/bin:$HOME/.terminal-browser/bin:$PATH"
terminal-browser capabilities

echo "== plugins upstream (para o spike)"
claude plugin marketplace add hellosverre/claude-skins
claude plugin install skins@hellosverre-mods
claude plugin marketplace add johnnyvizz/claude-kit
claude plugin install savvy-progress@claude-kit
claude plugin marketplace add data-goblin/claude-code-filetree
claude plugin install filetree@claude-code-filetree
claude plugin marketplace add zenbu-labs/terminal-browser
claude plugin install terminal-browser@terminal-browser

mkdir -p "$HOME/spike-pe" && cd "$HOME/spike-pe" && git init -q 2>/dev/null || true

cat <<'MSG'

Pronto. Agora, no WSL:
  kitty &
Dentro do kitty:
  cd ~/spike-pe && CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude
  (faça login na primeira vez)

Confira e anote cada item (ok / falhou + o que viu):
  1. /skin abre e troca o tema
  2. /tui fullscreen  -> a árvore de arquivos (filetree) aparece ao lado
  3. Peça: "crie 3 tarefas e conclua uma por uma" -> barra de progresso acima do prompt
  4. /agents-info abre o painel de agentes
  5. /browser abre o navegador dentro do kitty e carrega uma página
  6. Com o navegador aberto: a tela do Claude fica legível (sem lixo gráfico)?
MSG
