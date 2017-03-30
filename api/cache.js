(function(module, logger){
	'use strict';
	const Q = require('q');

	function Cache(model, attr){
		const instance = this;
		const defer = Q.defer();
		this.loaded = defer.promise;
		model.find().lean().exec().then(function(instances){

			instance.instances = instances.reduce(function(prev, instance){
				if (typeof instance[attr] === 'string' && instance[attr] !== ''){
					const key = instance[attr];
					if (typeof prev[key] === 'undefined'){
						prev[key] = [];
					}
					prev[key].push(instance);
				}

				return prev;
			}, {});
			defer.resolve();
		}).fail(function(err){
			logger.error(err);
		});
	}

	Cache.prototype.get = function(value){

		return this.instances[value];
	};


	module.exports = Cache;
})(module, console);

