# Planet Swap code review

CoW Protocol frontend (Nx monorepo), with a few Planet Swap edits on top. Most of the tree is still CoW Swap. The custom work is the max-balance context and a handful of branding/deploy changes.

Check the findings first, then walk the swap path if you want to confirm them in the editor.

## Findings

| # | Severity | Where | What to check |
| --- | --- | --- | --- |
| 1 | High | `apps/cowswap-frontend/src/modules/trade/containers/TradeWidget/TradeWidgetForm.tsx` ~96 | `updateMax(...)` runs during render. That writes React state on every paint. Move it into `useEffect`, or drop the context and read the balance where the quote is built. |
| 2 | High | `UserContext` chain below | `max` is stored, passed into swap hooks, then ignored. `useSwapFlowContext(maxBal)` never reads `maxBal`. The quote and the signed order still use the amount in the input, not this value. |
| 3 | Medium | `apps/cowswap-frontend/src/legacy/hooks/useRefetchPriceCallback.tsx` | `getMaxQuote` and `handleResponse1` are unused. `handleResponse1` is a copy of `handleResponse` with `updateQuote` commented out. `MaxBal` from context is read and never used. `setMaxBallance` in `legacy/state/swap/actions.ts` has no callers (and the name is misspelled). |
| 4 | Medium | `apps/cowswap-frontend/src/modules/swap/hooks/useHandleSwap.ts` ~33–45 | `console.log("price1" \| "price2" \| "price4")` left on the live swap path. |
| 5 | Medium | `vercel.json` vs `apps/cowswap-frontend/project.json` | Vercel serves `dist/apps/planet-swap`. Nx writes the app to `build/cowswap`. A Vercel deploy of this config will not find the Vite build. The `builds` entry also uses `@vercel/node` on a static Vite app. |
| 6 | Low | `apps/widget-configurator/.../useWidgetParamsAndSettings.ts` | Widget `baseUrl` is hardcoded to `https://planetswap.org`. Localhost and preview branches are commented out, so the configurator never points at a local swap app. |
| 7 | Low | Menu vs routes | Limit and TWAP are commented out of `MENU_ITEMS` in `common/constants/routes.ts`, but `/limit` and `/advanced` are still routed in `RoutesApp.tsx`. |
| 8 | Low | Branding | `package.json` name is `cowswap-monorepo`. README, legal links, Discord, docs, and Dune still point at CoW. Logs in `legacy/utils/price.ts` say PLANETSWAP while the strategy key is still `'COWSWAP'`. Widget `appCode` is still `'CoW Widget: Configurator'`. |

`signEthFlowOrderStep.ts` imports `UserContext` and `useContext` inside a plain async function. Those imports are unused. Hooks cannot run there.

`nx.json` commits an Nx Cloud token whose payload ends in `|READ`. Confirm it is the public read-only token and not a write token before this repo is shared.

## Max-balance path (the custom code)

This is the only real fork logic. It does not change the order.

```
TradeWidgetForm render
  maxAmountSpend(balance) -> updateMax(raw)     // setState during render
       |
UserContext { max, updateMax }                  // cow-react/index.tsx
       |
SwapWidget reads context.max as maxBal
       |
useSwapButtonContext(maxBal)
  useSwapFlowContext(maxBal)                    // argument unused
  useHandleSwap(priceImpact, maxBal)            // argument unused
       |
swapFlow / ethFlow / safe bundle                // order uses the typed input amount
```

Dead siblings of the same idea:

- `legacy/utils/price.ts` → `getMaxQuote` (never called)
- `useRefetchPriceCallback.tsx` → `handleResponse1` (never called), `MaxBal` (never used)
- `legacy/state/swap/actions.ts` → `setMaxBallance` (never dispatched)

## Swap path (stock CoW, still the real trade)

App boots from `src/main.tsx` → `src/cow-react/index.tsx`.

Router is `HashRouter`, so URLs look like `/#/1/swap/TOKEN/TOKEN`.

| Step | File | What it does |
| --- | --- | --- |
| 1 | `modules/application/containers/App/RoutesApp.tsx` | `/` redirects to swap. `/:chainId/swap/...` renders `SwapPage`. |
| 2 | `pages/Swap/index.tsx` | If `chainId` is missing, redirects to the wallet chain. Mounts quote updaters and `SwapWidget`. |
| 3 | `modules/swap/containers/SwapWidget/index.tsx` | Balances, slippage, warnings, confirm modal, swap button. |
| 4 | `modules/trade/containers/TradeWidget/` | Shared shell for swap, limit, and TWAP: URL state, token select, max button, recipient. |
| 5 | `legacy/hooks/useRefetchPriceCallback.tsx` | Fast quote, then best quote, via `legacy/utils/price.ts` → orderbook API. |
| 6 | `modules/swap/hooks/useHandleSwap.ts` | Picks one flow: Safe bundle approval, Safe ETH, regular swap, or ETH flow. |
| 7 | `modules/swap/services/swapFlow/index.ts` | Price-impact confirm → permit → sign → post order. |
| 8 | `modules/swap/services/ethFlow/` | Native sell. On-chain `createOrder` in `steps/signEthFlowOrderStep.ts`. |

Limit and TWAP use the same `TradeWidget` and stay reachable by URL:

- Limit: `pages/LimitOrders` → `modules/limitOrders`
- TWAP: `pages/AdvancedOrders` → `modules/advancedOrders` and `modules/twap`

## Repo map

| Path | Role | Run |
| --- | --- | --- |
| `apps/cowswap-frontend` | Swap UI (the app to review) | `yarn start` → http://localhost:3000 |
| `apps/explorer` | Order explorer | `yarn start:explorer` → :4200 |
| `apps/cow-fi` | Marketing site (Next.js) | `yarn start:cowfi` → :3001 |
| `apps/widget-configurator` | Embed widget builder | `yarn start:widget` |
| `apps/cowswap-frontend-e2e` | Cypress | needs `INTEGRATION_TEST_PRIVATE_KEY` |
| `libs/*` | Shared packages (wallet, tokens, ui, widget-lib, abis, …) | imported as `@cowprotocol/...` |

Frontend modules that matter for a trade: `swap`, `trade`, `tradeQuote`, `limitOrders`, `twap`, `advancedOrders`, `permit`, `orders`, `wallet`, `tokens`, `appData`.

State is split. New code uses Jotai (`jotaiStore`). Older swap and quote code is still Redux (`legacy/state`).

Chains in this tree: Ethereum mainnet (`1`), Gnosis (`100`), Arbitrum (`42161`), Sepolia (`11155111`).

## Config to confirm before a deploy

| Variable | Used for |
| --- | --- |
| `REACT_APP_INFURA_KEY` or `REACT_APP_NETWORK_URL_<chainId>` | RPC |
| `REACT_APP_ORDER_BOOK_URLS` | Quotes and posting orders. JSON map of chain id → host. |
| `REACT_APP_BFF_BASE_URL` | Optional helper API. App still trades if this is down. |
| `REACT_APP_CMS_BASE_URL` | Optional content. App still trades if this is down. |

Build output today: `build/cowswap` (`yarn build`). Service worker is on unless `REACT_APP_SERVICE_WORKER=false`. Cache reset switch is `apps/cowswap-frontend/public/emergency.js` (`resetCacheInCaseOfEmergency`).

## File checklist

Open these in order. Each box is one file.

- [ ] `apps/cowswap-frontend/src/cow-react/index.tsx` — providers and `UserContext`
- [ ] `apps/cowswap-frontend/src/modules/trade/containers/TradeWidget/TradeWidgetForm.tsx` — `updateMax` during render
- [ ] `apps/cowswap-frontend/src/modules/swap/containers/SwapWidget/index.tsx` — reads `max`
- [ ] `apps/cowswap-frontend/src/modules/swap/hooks/useSwapButtonContext.ts` — passes `maxBal`
- [ ] `apps/cowswap-frontend/src/modules/swap/hooks/useSwapFlowContext.ts` — `maxBal` unused
- [ ] `apps/cowswap-frontend/src/modules/swap/hooks/useHandleSwap.ts` — flow switch and `console.log`
- [ ] `apps/cowswap-frontend/src/modules/swap/services/swapFlow/index.ts` — sign and post
- [ ] `apps/cowswap-frontend/src/legacy/hooks/useRefetchPriceCallback.tsx` — dead quote copy
- [ ] `apps/cowswap-frontend/src/legacy/utils/price.ts` — `getBestQuote` / unused `getMaxQuote`
- [ ] `apps/cowswap-frontend/src/common/constants/routes.ts` — menu vs routes
- [ ] `apps/cowswap-frontend/src/modules/application/containers/App/RoutesApp.tsx`
- [ ] `vercel.json` and `apps/cowswap-frontend/project.json` — output path mismatch
- [ ] `apps/widget-configurator/src/app/configurator/hooks/useWidgetParamsAndSettings.ts`

Existing design notes, still accurate for the stock modules:

- `docs/architecture-overview.md`
- `apps/cowswap-frontend/src/modules/trade/docs/trade-module.md`
- `apps/cowswap-frontend/src/modules/swap/services/swapFlow/README.md`
- `apps/cowswap-frontend/src/modules/swap/services/ethFlow/README.md`
