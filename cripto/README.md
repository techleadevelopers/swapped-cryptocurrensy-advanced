# SWAPPY Token (BSC/Base/Polygon-friendly)

Contrato ERC-20 com taxa leve de 1%:
- 0.5% vai para a `treasury`.
- 0.5% é queimada.
- Sem mint, sem pause, sem blacklist.
- Owner pode: mudar `treasury`, definir isenções de taxa, e ligar/desligar um limite de tx.

## Arquivos
- `SWAPPY.sol` — contrato Solidity.

## Parametrização sugerida
- `initialSupply`: ex. `1_000_000e18`.
- `maxTxAmount`: ex. `20_000e18` (2% do supply). Use `0` para iniciar sem limite.
- `treasury`: carteira multisig do projeto (recomendado).

## Deploy rápido (Remix, BSC / Base / Polygon / Arbitrum)
1) Abra Remix, crie um workspace, importe `SWAPPY.sol`.
2) Em "Solidity compiler", use `0.8.20` ou superior, `Enable optimization: true`, `runs: 200`.
3) Em "Deploy & Run", selecione a rede (via MetaMask) e passe os construtor params:
   - `_treasury`: seu multisig.
   - `_initialSupply`: número em wei (ex.: `1000000` com `18` decimais vira `1000000e18`).
   - `_maxTxAmount`: valor em wei ou `0`.
4) Deploy. Anote o address.
5) Verifique o contrato no explorer (Verify & Publish) com o mesmo compilador/otimização.

## Criação do par e liquidez mínima (exemplo Pancake/Uniswap fork)
1) No router da DEX, escolha criar par `SWAPPY`/`USDC` (ou `BNB/ETH`).
2) Adicione liquidez: ex. US$50 + quantidade proporcional de SWAPPY para o preço inicial desejado.
3) Pegue o LP token e trave em um locker público (PinkLock/Unicrypt). Guarde o link.

## Taxa e funcionamento
- Taxa fixa de 1% em todas as transferências (exceto isentos).
- 0.5% para `treasury` e 0.5% queima reduzindo supply.
- `isFeeExempt`: owner e treasury já vêm isentos; pode adicionar routers, CEX wallets, etc.
- `maxTxEnabled`: útil só no lançamento; pode desligar via `toggleMaxTx(false, 0)`.

## Boas práticas pós-deploy
- Mudar `treasury` para multisig (se ainda não for).
- Desligar/maximizar o `maxTx` após fase inicial.
- Publicar endereço do contrato, do pool, do LP locker e do timelock/multisig.
- Considerar renunciar `owner` depois que tudo estiver estável, se quiser zero poderes.

## Ganho do projeto
- Taxa de 1%: 0.5% entra na treasury, 0.5% burn ajuda preço.
- Fees de LP: se o projeto manter parte do LP, coleta as trading fees do par.

## Riscos
- Sem auditoria: alto risco técnico; faça ao menos revisão de pares.
- Liquidez baixa: slippage alta e ataque de bots; trave LP e comunique limites iniciais.
