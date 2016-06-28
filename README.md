# cache-blister-dependencies

Uses a configuration to cache all the specified services in a container.

Active maintainer: [ruben.norte@softonic.com](mailto:ruben.norte@softonic.com?subject=cache-blister-dependencies)

## Installation

```bash
npm install cache-blister-dependencies
```

## Usage

```javascript
import cacheBlisterDependencies from 'cache-blister-dependencies';

container.service('articleRepository', () => { return new ArticleRepository(); });
container.value('getSomethingExpensive', getSomethingExpensive);

const config = {
  options: {
    ttl: '4h'
  },
  entries: {
    'articleRepository.getArticle': { ttl: '1h' },
    'getSomethingExpensive': { ttl: '2d' }
  }
};

const cacheClient = container.get('cacheClient');

cacheBlisterDependencies({ container, cacheClient, config });
```

## Testing

Clone the repository and execute:

```bash
npm test
```

## Contribute

1. Fork it: `git clone ssh://git@stash.redtonic:7999/NODE/cache-blister-dependencies.git`
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Added some feature'`
4. Check the build: `npm run build`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D
