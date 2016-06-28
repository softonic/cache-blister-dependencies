import Container from 'blister';

import cacheBlisterDependencies from '../es/index';

describe('cacheBlisterDependencies({ container, cacheClient, config, decorator })', () => {

  it('should be a function', () => {
    expect(cacheBlisterDependencies).toEqual(jasmine.any(Function));
  });

  it('should extend dependencies that are functions', () => {
    const container = new Container();
    container.value('fooFn', () => {});
    spyOn(container, 'extend');

    const config = {
      entries: {
        fooFn: true
      }
    };

    cacheBlisterDependencies({ container, config });

    expect(container.extend).toHaveBeenCalledWith('fooFn', jasmine.any(Function));
  });

  it('should extend dependencies that are objects', () => {
    const container = new Container();
    container.value('fooSvc', { fooFn() {} });
    spyOn(container, 'extend');

    const config = {
      entries: {
        'fooSvc.fooFn': true
      }
    };

    cacheBlisterDependencies({ container, config });

    expect(container.extend).toHaveBeenCalledWith('fooSvc', jasmine.any(Function));
  });

  it('should prioritize dependencies that exactly match the configured ID', () => {
    const container = new Container();
    container.value('fooSvc', { fooFn() {} });
    container.value('fooSvc.fooFn', () => {});
    spyOn(container, 'extend');

    const config = {
      entries: {
        'fooSvc.fooFn': true
      }
    };

    cacheBlisterDependencies({ container, config });

    expect(container.extend).toHaveBeenCalledWith('fooSvc.fooFn', jasmine.any(Function));
  });

  it('should throw an error if a configured dependency is not found in the container', () => {
    const container = new Container();
    const config = {
      entries: {
        'fooSvc.fooFn': true
      }
    };

    expect(() => {
      cacheBlisterDependencies({ container, config });
    }).toThrow();
  });

  it('should ignore dependencies with falsy configuration values', () => {
    const container = new Container();
    spyOn(container, 'extend');

    const config = {
      entries: {
        'fooSvc.fooFn': false,
        'barSvc': null,
        'bazSvc': undefined
      }
    };

    cacheBlisterDependencies({ container, config });

    expect(container.extend).not.toHaveBeenCalled();
  });

  describe('the extended dependency', () => {
    it('should be cached using the given cache client', done => {
      const container = new Container();
      container.service('fooSvc', () => {});

      const cacheClient = {};

      const config = {
        entries: {
          fooSvc: true
        }
      };

      const decorator = function verifyDecoratorCall(fn, options) {
        expect(options.cacheClient).toBe(cacheClient);
        done();
      };

      cacheBlisterDependencies({ container, cacheClient, config, decorator });

      container.get('fooSvc');
    });

    it('should be cached merging the default options with the specific ones', done => {
      const container = new Container();
      container.service('fooSvc', () => {});

      const config = {
        options: {
          ttl: 1000,
          ttlRandomFactor: 0.2
        },
        entries: {
          fooSvc: {
            ttlRandomFactor: 0.1
          }
        }
      };

      const decorator = function verifyDecoratorCall(fn, options) {
        const expectedOptions = {
          ttl: 1000,
          ttlRandomFactor: 0.1
        };
        expect(options).toEqual(jasmine.objectContaining(expectedOptions));
        done();
      };

      cacheBlisterDependencies({ container, config, decorator });

      container.get('fooSvc');
    });

    it('should be cached using the entryId as default segment', done => {
      const fooService = {
        fooFn() {}
      };

      const container = new Container();
      container.service('fooSvc', () => fooService);

      const config = {
        entries: {
          'fooSvc.fooFn': true
        }
      };

      const decorator = function verifyDecoratorCall(fn, options) {
        expect(options.segment).toBe('fooSvc.fooFn');
        done();
      };

      cacheBlisterDependencies({ container, config, decorator });

      container.get('fooSvc');
    });

    describe('when it is a function', () => {
      it('should decorate it', done => {
        const fooService = () => {};

        const container = new Container();
        container.service('fooSvc', () => fooService);

        const config = {
          entries: {
            fooSvc: true
          }
        };

        const decorator = function verifyDecoratorCall(fn) {
          expect(fn).toBe(fooService);
          done();
        };

        cacheBlisterDependencies({ container, config, decorator });

        container.get('fooSvc');
      });
    });

    describe('when it is the method of an object', () => {
      it('should decorate that method, bound to the original object', done => {
        const fooService = jasmine.createSpyObj('fooService', ['fooFn']);

        const container = new Container();
        container.service('fooSvc', () => fooService);

        const config = {
          entries: {
            'fooSvc.fooFn': true
          }
        };

        const decorator = function verifyDecoratorCall(fn) {
          fn();
          expect(fooService.fooFn).toHaveBeenCalled();
          expect(fooService.fooFn.calls.mostRecent().object).toBe(fooService);
          done();
        };

        cacheBlisterDependencies({ container, config, decorator });

        container.get('fooSvc');
      });
    });
  });
});
