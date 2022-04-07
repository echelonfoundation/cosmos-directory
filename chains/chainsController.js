import Router from 'koa-router';
import { renderJson } from '../utils.js';

function ChainsController(registry) {
  async function chainResponse(chain, summarize) {
    const { chain_name, network_type, pretty_name, chain_id, status } = chain.chain;
    const baseAsset = chain.baseAsset()
    const response = {
      name: chain_name,
      path: chain.path,
      chain_name, 
      network_type,
      pretty_name,
      chain_id,
      status,
      symbol: baseAsset && baseAsset.symbol,
      coingecko_id: baseAsset && baseAsset.coingecko_id,
      image: baseAsset && baseAsset.image,
      height: await chain.getBlockHeight(),
      best_apis: {
        rest: await chain.apis.bestUrls('rest'),
        rpc: await chain.apis.bestUrls('rest')
      }
    };
    return summarize ? response : {...chain.chain, ...response}
  }

  async function repositoryResponse() {
    const repository = await registry.repository()
    const commit = await registry.commit()
    return {
      url: repository.url,
      branch: repository.branch,
      commit: commit.oid,
      timestamp: commit.commit.author.timestamp
    }
  }

  function routes() {
    const router = new Router();

    router.get('/', async (ctx, next) => {
      const chains = await registry.getChains()
      renderJson(ctx, {
        repository: await repositoryResponse(),
        chains: await Promise.all(chains.map(async chain => {
          return await chainResponse(chain, true);
        }))
      });
    });

    router.get('/:chain', async (ctx, next) => {
      const chain = await registry.getChain(ctx.params.chain);
      renderJson(ctx, chain && {
        repository: await repositoryResponse(),
        chain: await chainResponse(chain)
      });
    });

    router.get('/:chain/:dataset', async (ctx, next) => {
      const chain = await registry.getChain(ctx.params.chain);
      let dataset = ctx.params.dataset.replace(/\.[^.]*$/,'')
      dataset = ['path'].includes(dataset) ? undefined : dataset
      renderJson(ctx, chain && dataset && chain.data[dataset]);
    });

    return router.routes();
  }

  return {
    routes
  };
}

export default ChainsController