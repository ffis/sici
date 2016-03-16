(function(module){
	'use strict';

	module.exports.create = function(models){
		return function(req, res){
			var AccionMejora = models.accionmejora(),
				content = req.body;
			new AccionMejora(content).save( function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				} else {
					res.json(content);
				}
			});
		};
	};

	module.exports.get = function (models) {
		return function (req, res) {
			var accionmejoramodel = models.accionmejora(),
				id = req.params.id;
			if (id){
				accionmejoramodel.findOne({'_id': models.ObjectId(id) }, function (err, data) {
					if (err) {
						res.status(500).send({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(data);
				});
			} else {

				accionmejoramodel.find({'plan': (req.query.plan) }).then(function(acciones){
					res.json(acciones);
				}, function(err){
					res.status(500).json({'error': 'An error has occurred', details: err});
				});
			}
		};
	};

	module.exports.update = function (models) {
		return function (req, res) {
			var accionmejora = models.accionmejora();
			var content = JSON.parse(JSON.stringify(req.body));
			var id = content._id;

			delete content._id;

			accionmejora.update({'_id': id}, content, {upsert: true}, function (e) {
				if (e) {
					res.status(500).send({'error': 'An error has occurred.', details: e});
				} else {
					res.send(req.body);
				}
			});
		};
	};

	module.exports.remove = function (models) {
		return function(req, res){
			var AccionMejora = models.accionmejora(),
				id = req.params.id;
			if (id) {
				AccionMejora.remove({'_id': models.ObjectId(req.params.id)}).then(function(){
					res.json({});
				}, function(erro){
					res.status(500).json({'error': 'Error during accionmejora.remove', details: erro});
				});
			} else {
				res.status(400).json({'error': 'Error during accionmejora.remove', details: 'Not found'});
			}
		};
	};

})(module);
