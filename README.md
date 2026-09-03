# Bíblia Avivar

App standalone de leitura da Bíblia + estudo por livro, com a identidade visual
do Ministério Avivar do Espírito. Independente do site principal — publicado
e instalado separadamente.

## Rodar localmente

```bash
npm install
npm run dev
```

## ⚠️ Antes de publicar — duas coisas para resolver

### 1. Sobre o texto da Bíblia (atualizado)

Comecei usando a abibliadigital.com.br, mas ela não estava carregando quando
você testou — pode ter sido instabilidade pontual do serviço, ou o site pode
estar fora do ar por mais tempo, não tenho como saber daqui (meu ambiente não
acessa internet).

Por isso, troquei a **fonte principal** para uma que não depende de cadastro
nem de nenhuma conta: um arquivo com o texto completo da Bíblia (projeto
aberto `thiagobodruk/biblia`, servido via jsdelivr, um serviço de
distribuição de arquivos bem estabelecido). O app baixa esse arquivo uma
única vez (alguns MB, na primeira leitura) e guarda em memória — as próximas
trocas de capítulo são instantâneas, sem baixar de novo.

A abibliadigital continua no código como plano B, caso um dia você queira
configurar um token e usar como reserva — não é mais obrigatório.

**Não digitei a Bíblia de memória** — continua vindo de uma fonte de texto
publicada, pelos mesmos motivos de antes (risco de erro de transcrição num
texto sagrado é grande demais).

**Importante, de novo, porque é a segunda vez que isso acontece:** não tenho
como testar essa integração daqui. Se ao abrir o app publicado a leitura
ainda não funcionar, me manda a mensagem de erro exata (ou um print) que eu
ajusto — pode ser algo simples como o nome de um livro não bater
exatamente com o arquivo de dados.

### 2. Estudos dos livros

Só entrei com um rascunho de estudo para 4 livros (Gênesis, Salmos, João,
Romanos) como exemplo do formato — histórico e introdutório, não uma posição
teológica fechada. Para os outros 62 livros, entre no modo admin (cadeado no
canto superior direito, senha `biblia-avivar-2026` — troque antes de
publicar) e preencha pela aba "Estudo" de cada livro. Dá pra revisar e editar
os 4 que já vieram prontos também.

### 3. Senha de admin

Mesma observação do site principal: `MASTER_ADMIN_PASSWORD` em `src/App.jsx`
é só um placeholder para teste, não é autenticação segura de verdade. Troque
antes de divulgar o app.

## Publicar como site (igual ao site principal)

Mesmo caminho: GitHub + Vercel (ou Netlify). Veja o README do projeto do site
principal se precisar relembrar o passo a passo.

## Publicar na Play Store (sem precisar de Android Studio)

Este app já está configurado como PWA (`manifest.json` + `sw.js`), instalável
direto do navegador. Para virar um pacote que a Play Store aceita:

1. Publique o app num link público (Vercel/Netlify), como já fizemos com o
   site principal
2. Acesse https://www.pwabuilder.com e cole o link do seu app publicado
3. A ferramenta analisa o PWA e gera um pacote Android (`.aab`) pronto para
   a Play Store — é gratuita e não exige instalar nada no computador
4. Crie uma conta de desenvolvedor no
   [Google Play Console](https://play.google.com/console) (taxa única de
   US$25, cobrada pelo Google, não por mim)
5. Suba o `.aab` gerado pelo PWABuilder, preencha a ficha da loja (descrição,
   capturas de tela, categoria — recomendo "Livros e Referência" ou
   "Estilo de vida"), e envie para revisão

Essas últimas etapas (conta, taxa, revisão do Google) são ações que só você
consegue fazer — nenhuma IA tem acesso à sua conta Google ou consegue pagar
por você. Mas o app em si, o pacote técnico, sai pronto do PWABuilder sem
precisar escrever uma linha de código Android.

Para iOS (App Store da Apple) o caminho é parecido, mas a Apple exige um Mac
com Xcode para o empacotamento final e uma conta de desenvolvedor Apple
(US$99/ano) — bem mais trabalhoso. Se for prioridade, me avisa que a gente
planeja esse caminho à parte.

## Estrutura

```
biblia-avivar/
├── src/
│   ├── App.jsx           → app inteiro (navegação, leitura, estudo, admin)
│   ├── lib/bibleData.js  → lista dos 66 livros e número de capítulos
│   ├── lib/seedStudies.js→ estudos de exemplo (4 livros)
│   └── lib/storage.js    → persistência (localStorage fora do Claude)
├── public/
│   ├── manifest.json     → configuração do PWA
│   ├── sw.js              → service worker (cache básico offline)
│   └── icon-*.png         → ícones do app
```
