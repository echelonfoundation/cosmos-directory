import ChainApis from "./chainApis.js";
import ChainAsset from './chainAsset.js'

function Chain(client, data) {
  const { path, chain, assetlist } = data;
  chain.name = chain.chain_name
  const assets = assetlist && assetlist.assets.map(el => ChainAsset(el));

  async function params() {
    return await client.json.get('chains:' + path, '$') || {}
  }

  async function apis(type){
    const health = await apiHealth(type)
    return ChainApis(chain.apis || {}, health)
  }
  
  async function apiHealth(type) {
    const healthPath = {}
    if(type){
      healthPath.path = [
        '$.' + type,
      ]
    }
    const health = await client.json.get('health:' + path, healthPath) || {}
    return type ? {[type]: health[0]} : health
  }

  function baseAsset(){
    return assets && assets[0]
  }

  function getDataset(dataset){
    dataset = ['path'].includes(dataset) ? undefined : dataset
    return dataset && data[dataset]
  }

  return {
    path: path,
    chainId: chain.chain_id,
    name: chain.name,
    prettyName: chain.pretty_name,
    denom: baseAsset()?.denom,
    symbol: baseAsset()?.symbol,
    assets,
    ...data,
    params,
    apis,
    baseAsset,
    getDataset
  };
}

export default Chain
