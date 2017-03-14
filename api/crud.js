/*eslint no-underscore-dangle: [2, { "allow": ["_id"] }]*/

(function(module){
	'use strict';
	function Crud(models, classname){
		if (typeof models === 'undefined' && typeof classname === 'undefined'){
			throw new Error('In order to use crud library you must use a models parameter and bind it to a class type.');
		}
		this.models = models;
		this.classname = classname;
	}

	Crud.prototype.get = function(){
		const instance = this;

		return function (req, res) {
			const obj = instance.models[instance.classname]();
			const id = req.params._id;
			if (typeof id === 'string' && id !== ''){
				obj.findOne({'_id': req.metaenvironment.models.ObjectId(id)}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
			} else {
				obj.find({}, req.eh.cb(res));
			}
		};
	};
	Crud.prototype.update = function(){
		const instance = this;

		return function(req, res) {
			const obj = instance.models[instance.classname](),
				id = req.params._id,
				content = JSON.parse(JSON.stringify(req.body));
		
			if (typeof id === 'string' && id !== ''){
				delete content._id;
				obj.update({'_id': req.metaenvironment.models.ObjectId(id)}, content, {upsert: false}, req.eh.cbWithDefaultValue(res, req.body));
			} else {
				req.eh.notFoundHelper(res);
			}
		};
	};

	Crud.prototype.remove = function(){
		const instance = this;

		return function(req, res) {
			const obj = instance.models[instance.classname](),
				id = req.params._id,
				content = req.body;
			if (typeof id === 'string' && id !== ''){
				obj.remove({'_id': req.metaenvironment.models.ObjectId(id)}, req.eh.cbWithDefaultValue(res, content));
			} else {
				req.eh.notFoundHelper(res);
			}
		};
	};

	module.exports = Crud;
})(module);
