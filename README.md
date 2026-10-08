# Unidac Industries

Sistema pensado para o dia a dia da cantina: menos papel, menos “achismo” e mais controle do que entra, sai e se perde.

Nasceu da necessidade de unir estoque, compras, desperdício, financeiro e produção em um só lugar — simples de usar e com dados ao vivo.

---

## O que o sistema faz

Depois do login, cada pessoa acessa o ambiente conforme o seu cargo. O painel mostra o que importa no momento: estoque, movimentações, alertas e indicadores.

Dá para:

- controlar estoque (entrada, saída e histórico)
- registrar compras e acompanhar pedidos
- anotar desperdício e acompanhar o impacto
- lançar movimentações financeiras
- acompanhar validades e metas
- confirmar produção na cozinha
- gerar relatórios em PDF
- cadastrar usuários com acesso por função

Tudo grava no Firebase. Quando alguém lança uma informação, ela aparece no sistema sem precisar atualizar a página na mão.

---

## Como está organizado

Estrutura direta, sem pastas demais:

```text
/
  index.html          → login
  dashboard.html      → painel principal
  *.html              → demais telas
  css/                → estilos
  js/                 → lógica e Firebase
```

Assim fica mais fácil manter, publicar no GitHub Pages e evoluir o projeto.

---

## Tecnologia

- HTML, CSS e JavaScript
- Firebase Authentication (login com e-mail e senha)
- Cloud Firestore (banco em tempo real)
- Geração de relatórios em PDF no navegador

Não precisa instalar servidor próprio para rodar o essencial: com o Firebase configurado e o site no ar, o fluxo principal já funciona.

---

## Login e segurança

O acesso é por e-mail e senha. Se alguém errar, o sistema avisa com clareza. Também é possível recuperar a senha pelo e-mail e, logado, alterar a senha pelo perfil.

A sessão fica no navegador. Ao sair, o sistema encerra o acesso naquele dispositivo.

---

## Em resumo

A Unidac Industries é uma ferramenta para organizar a cantina de verdade: registrar o que acontece, enxergar os números e tomar decisão com base no que está no banco — não no que “parece” estar certo.

Feito para ser usado no cotidiano, não só para demonstração.