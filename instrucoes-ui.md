# 🛡️ Task: Refatoração Estrutural e Visual - i9 Biometria (V2.0)

## 1. Visão Geral e Identidade Visual
O objetivo é transformar a aplicação atual em uma **Estação de Trabalho Biométrica de Alta Tecnologia**. O estilo deve ser **Neo-Glassmorphism**, transmitindo segurança, precisão e modernidade.

**Paleta de Cores Corporativa:**
- **Azul Primário (Confiança):** `#0b3b66`
- **Vermelho Ação/Alerta:** `#FF2C2C` / `#ED2100`
- **Branco/Translúcido:** Para efeitos de vidro.
- **Ações de Sucesso:** Emerald-500 (Verde Neon para biometrias confirmadas).

---

## 2. Diretrizes de Design (Neo-Glassmorphism)
Para todos os elementos de UI, o agente deve aplicar:
- **Background:** `bg-white/10` ou `bg-slate-900/5` com `backdrop-blur-xl`.
- **Bordas:** `border border-white/20` (efeito de borda infinita).
- **Sombras:** `shadow-[0_8px_32px_0_rgba(11,59,102,0.15)]`.
- **Background Geral:** Substituir cinza sólido por um gradiente: `bg-gradient-to-br from-[#0b3b66] via-slate-50 to-[#FF2C2C]/10`.

---

## 3. Reestruturação de Layout e UX

### 3.1. Página de Login (Foco Total)
- **Mudança Estrutural:** Remover a Sidebar desta página. O login deve ser um **Card de Vidro centralizado**.
- **UX:** O formulário deve ser o centro das atenções. O logo `Biometria.ico` deve ser maior e ter um leve brilho (glow) azul atrás.
- **Ação:** O botão "Entrar" deve ser `w-full` (largura total) para facilitar a ergonomia.

### 3.2. Workspace do Funcionário (Dashboard Style)
Transformar o grid atual em um layout de **3 Blocos Inteligentes**:

1.  **Card de Perfil (Esquerda - Fixo):** - Design de "Crachá Digital".
  - Status de biometria deve ser um **Badge Neon** no topo da foto (Verde se OK, Vermelho se ausente).
2.  **Arena de Captura (Centro - Principal):**
  - O container de preview deve ser o maior elemento.
  - Adicionar um **Overlay de Scan** (linha de luz que sobe e desce) quando a câmera estiver ativa.
  - Se não houver foto, mostrar um ícone de face em wireframe translúcido.
3.  **Barra de Ações (Floating Toolbar):**
  - Mover os botões de "Capturar", "Enviar" e "Cancelar" para uma barra horizontal flutuante abaixo do preview, facilitando o fluxo de trabalho do operador.

### 3.3. Sidebar (Navegação Flutuante)
- Transformar a sidebar em um elemento `fixed` com margens (`m-4`), cantos muito arredondados (`rounded-3xl`) e efeito de vidro escurecido.
- O link ativo deve ter um indicador neon azul.

---

## 4. Micro-interações e Feedback
- **Feedback de Clique:** Botões devem ter efeito de "Active Scale" (encolher levemente ao clicar).
- **Loading Progress:** Durante o `saving()`, o container da foto deve mostrar um overlay "Processando Biometria..." com um efeito de pulso.
- **Modals:** Devem surgir com animação `scale-in` e o fundo deve ter um desfoque intenso (`backdrop-blur-2xl`).

---

## 5. Implementação Técnica (Angular Guardrails)

**⚠️ NÃO ALTERAR A LÓGICA EXISTENTE:**
- Manter todos os `Signals` (`signal`, `computed`, `effect`).
- Manter as lógicas de `Blob`, `File` e `AuthService`.
- Preservar as validações de formulário (`formGroup`, `mat-error`).

**CSS Customizado para Animação de Scan (Adicionar ao styles.css):**
```css
@keyframes scan {
  0% { top: 0%; opacity: 0; }
  50% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
.scan-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, #00ffff, transparent);
  box-shadow: 0 0 15px #00ffff;
  animation: scan 2s infinite ease-in-out;
  z-index: 10;
}
