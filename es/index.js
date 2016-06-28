import assert from 'assert';

import makeCacheable from 'make-cacheable';

/**
 * Uses the given configuration to cache all the specified services in the given container
 *
 * @example
 *
 * container.service('articleRepository', () => { return new ArticleRepository(); });
 * container.value('getSomethingExpensive', getSomethingExpensive);
 *
 * const config = {
 *   options: {
 *     ttl: 14400
 *   },
 *   entries: {
 *     'articleRepository.getArticle': { ttl: 3600 },
 *     'getSomethingExpensive': { ttl: 65000 }
 *   }
 * }
 *
 * const cacheClient = container.get('cacheClient');
 *
 * cacheBlisterDependencies({ container, cacheClient, config });
 *
 * @param  {BlisterContainer} options.container
 * @param  {catbox.Client} options.cacheClient
 * @param  {Object} options.config
 */
export default function cacheBlisterDependencies({
  container,
  cacheClient,
  config,
  decorator = makeCacheable
}) {
  const defaultOptions = Object.assign({}, config.options, { cacheClient });

  Object.keys(config.entries).forEach(entryId => {
    if (!config.entries[entryId]) {
      return;
    }

    let dependencyId = entryId;
    let methodName = null;

    if (!container.has(entryId)) {
      assert(entryId.indexOf('.') !== -1, `Could not find a function dependency ${entryId}`);

      const entryIdParts = entryId.split('.');
      dependencyId = entryIdParts.slice(0, -1).join('.');
      methodName = entryIdParts.slice(-1);

      assert(container.has(dependencyId),
        `Could not find a function dependency ${entryId} nor ${dependencyId}`);
    }

    const specificOptions = config.entries[entryId];
    container.extend(dependencyId, dependency => {
      const options = Object.assign({}, defaultOptions, specificOptions);

      if (methodName) {
        options.segment = options.segment || `${dependencyId}.${methodName}`;
        const method = dependency[methodName].bind(dependency);
        const decoratedMethod = decorator(method, options);
        dependency[methodName] = decoratedMethod;
        return dependency;
      }

      options.segment = options.segment || dependencyId;
      return decorator(dependency, options);
    });
  });
}
