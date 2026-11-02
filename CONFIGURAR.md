# Ativar o salvamento da ficha na Vercel

Este pacote contém o index.html revisado e a rota api/ficha.js. O banco precisa ser conectado para que a ficha acompanhe você entre aparelhos. Não basta substituir apenas o HTML.

## 1. Guarde a progressão atual

No navegador em que a ficha está mais atualizada, clique em Exportar. Guarde esse JSON até concluir a configuração.

## 2. Conecte o banco

No painel da Vercel, abra seu projeto e a seção Storage/Marketplace. Adicione uma integração **Upstash Redis** e conecte o banco ao projeto. Verifique o plano e os limites mostrados antes de concluir.

Em Settings → Environment Variables, confirme estas variáveis para Production:

| Variável | Valor |
| --- | --- |
| UPSTASH_REDIS_REST_URL | REST URL do banco Upstash |
| UPSTASH_REDIS_REST_TOKEN | REST token com permissão de escrita do banco |
| FICHA_EDIT_PASSWORD | Uma senha longa escolhida por você para editar a ficha |

A integração pode criar KV_REST_API_URL e KV_REST_API_TOKEN em vez dos dois primeiros nomes. O código também aceita esse par. Não use o token somente de leitura. As credenciais ficam nas configurações da Vercel, não dentro do HTML nem no GitHub.

## 3. Atualize o GitHub

Na raiz do projeto, onde está o index.html:

- Substitua index.html pelo deste pacote.
- Crie a pasta api e coloque ficha.js dentro dela.
- Faça commit e push para a branch de produção conectada à Vercel.

A pasta api deve ficar ao lado de index.html. Não envie apenas o ZIP. Não coloque uma pasta Ficha-Vicente-main extra entre a raiz configurada na Vercel e esses arquivos.

O projeto continua como site estático com uma função Node.js. Não exige npm install nem dependências extras. Se a Vercel estiver configurada para outro framework, use o preset Other e mantenha a saída na raiz do projeto, sem comando de build. Se já existir package.json com type: module, a função CommonJS precisará ser adaptada; esse arquivo não estava no projeto enviado.

Após configurar as variáveis, faça um novo deploy. Alterar as variáveis não modifica um deployment antigo.

## 4. Faça o primeiro salvamento

1. Abra https://soberaniadaschamas.vercel.app/api/ficha. Quando tudo estiver configurado e o banco estiver vazio, a resposta será {"data":null,"updated_at":null}.
2. Abra a ficha e clique em Modo editor. Use a senha definida em FICHA_EDIT_PASSWORD.
3. Se necessário, importe o JSON do backup. Aguarde a indicação **sincronizado com a nuvem**.
4. Abra o mesmo endereço em outro aparelho. Ele carrega a ficha salva. Para fazer alterações e sincronizá-las, entre no modo editor também nesse aparelho.

Fechar a página preserva a cópia local imediatamente. Para levar a última mudança a outro aparelho, espere o aviso de sincronização antes de fechar. Sem internet, a alteração fica pendente e o site tenta enviá-la novamente quando a conexão voltar.

## Versões diferentes

Se você editar em duas abas ou aparelhos, pode aparecer um aviso de conflito. Exporte a versão local antes de escolher entre carregar a nuvem ou manter este aparelho. A substituição na nuvem exige a senha de edição. Ao carregar a nuvem, o site guarda a cópia local anterior na chave vob-backup do armazenamento do navegador.

A ficha continua pública para leitura, como o site original. A senha protege alterações; não torna as anotações privadas. A senha permanece salva no navegador ao entrar em modo editor; use Sair do modo editor em computadores compartilhados.

## Diagnóstico

- 404 em /api/ficha: api/ficha.js não entrou no deployment ou a raiz/saída do projeto está incorreta.
- 503: confira as variáveis, conexão do banco e novo deployment.
- Senha incorreta: use o valor de FICHA_EDIT_PASSWORD do ambiente Production.
- Envio pendente: os dados seguem no navegador; verifique a conexão e aguarde a nova tentativa.

## Verificações realizadas

Passaram os testes de lógica da ficha, sintaxe JavaScript, persistência local imediata, reabertura, carregamento em outro cliente e conflito de versões. A API passou nos testes de autenticação, validação, leitura, gravação e conflito com armazenamento simulado. Não foi feito deploy nem teste contra sua conta Vercel/Upstash. A validação visual em navegador continua pendente.

Referências oficiais:
- https://vercel.com/docs/redis
- https://vercel.com/docs/functions/runtimes/node-js
- https://upstash.com/docs/redis/features/restapi
