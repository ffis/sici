/*eslint no-underscore-dangle: [2, { "allow": ["_id"] }]*/

(function(module, logger){
	'use strict';
	function Crud(models, classname){
		if (typeof models === 'undefined' && typeof classname === 'undefined'){
			throw new Error('In order to use crud library you must use a models parameter and bind it to a class type.');
		}
		this.models = models;
		this.classname = classname;
	}

	Crud.prototype.get = function () {
		return function (req, res) {
			var obj = this.models[this.classname](),
				id = req.params['_id'];
			if (typeof id !== 'undefined' && id !== '' && id !== 0){
				obj.findOne({'_id': id}, function (err, data) {
					if (err) {
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(data);
				});
			} else {
				obj.find({}, function (err, data) {
					if (err) {
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(data);
				});
			}
		};
	};
	Crud.prototype.update = function(){
		return function(req, res) {
			var obj = this.models[this.classname](),
				id = req.params._id,
				content = JSON.parse(JSON.stringify(req.body));
			delete content._id;
			if (typeof id !== 'undefined' && id !== '' && id !== 0){
				obj.update({'_id': id}, content, { upsert: true }, function(err){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
					} else {
						res.json(content);
					}
				});
			} else {
				res.status(404).json({'error': 'Not found'});
			}
		};
	};

	Crud.prototype.remove = function(){
		return function(req, res) {
			var obj = this.models[this.classname](),
				id = req.params._id,
				content = req.body;
			if (typeof id !== 'undefined' && id !== '' && id !== 0){
				obj.remove({'_id': id}, function(err){
					if (err){
						logger.error(err);
						res.status(500).json({'error': 'An error has occurred', details: err});
					} else {
						res.json(content);
					}
				});
			} else {
				res.status(404).json({'error': 'Not found'});
			}
		};
	};

	module.exports = Crud;
})(module, console);
