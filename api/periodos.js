'use strict';

exports.getPeriodo = function (models) {
	return function (req, res) {
		var periodo = models.periodo(),
			id = req.params._id;
		if (id)
		{
			periodo.findOne({'_id': id}, function (err, data) {
				if (err) {
					console.error(err);
					res.status(500).end();
					return;
				}
				res.json(data);
			});
		} else {
			periodo.find({}, function (err, data) {
				if (err) {
					console.error(err);
					res.status(500).end();
					return;
				}
				res.json(data);
			});
		}
	};
};


exports.updatePeriodo = function (models) {
	return function (req, res) {
		var periodo = models.periodo();
		var Procedimiento = models.procedimiento();
		var content = JSON.parse(JSON.stringify(req.body));
		var id = content._id;

		delete content._id;
		console.log(content);
		periodo.update({'_id': id}, content, {upsert: true}, function (e) {
			if (e) {
				res.send({'error': 'An error has occurred:' + e});
			} else {

				var set = {}, meses = {};
				for (var p in content) {
					meses[p] = content[p];
					set['periodos.' + p + '.periodoscerrados'] = meses[p];
				}
				console.log(set);
				//parche:
				//periodo 2014 tiene el valor a usar con todos los procedimientos:
				Procedimiento.update({}, {'$set': set}, {multi: true}, function (err) {
					if (err){
						console.error(err);
					}
					else{
						//se reenvía lo mismo que se recibió
						res.send(req.body);
					}
				});
			}
		});
	};
};

exports.newPeriodo = function (models) {
	return function (req, res) {
		var Periodo = models.periodo();
		var content = req.body;
		new Periodo(content).save(function (e) {
			//etiqueta.update({'_id':id}, content, { upsert: true }, function(e){
			if (e) {
				res.send({'error': 'An error has occurred'});
			} else {
				res.send(content);
			}
		});
	};
};

exports.removePeriodo = function (models) {
	return function (req, res) {
		var periodo = models.periodo(),
			id = req.params.id,
			content = req.body;
		periodo.remove({'_id': id}, function (e) {
			if (e) {
				res.send({'error': 'An error has occurred'});
			} else {
				res.send(content);
			}
		});
	};
};

exports.nuevaAnualidad = function (models) {
	return function (req, res) {
		var Plantillaanualidad = models.plantillaanualidad();
		var Procedimiento = models.procedimiento();
		Plantillaanualidad.findOne({}, function (err, plantilla) {
			if (err) {
				console.error(err);
				res.status(500).end();
				return;
			}
			var anualidad = req.params.anyo;
			var Periodo = models.periodo();
			console.log('Recuperada plantilla de año ' + anualidad);
			if (anualidad > 2014) {
				Periodo.findOne({}, function (erro, periodo) {
					if (erro) {
						console.error(erro);
						res.status(500).end();
						return;
					}
					periodo = JSON.parse(JSON.stringify(periodo));
					delete periodo._id;
					var anualidades = Object.keys(periodo);
					var speriodonuevo = '';
					var max = 0;
					for (var i = 0, j = anualidades.length; i < j; i++){
						if (!isNaN(parseInt(anualidades[i].replace('a', ''))))
						{
							var nperiodo = parseInt(anualidades[i].replace('a', ''));
							nperiodo++;
							if (max < nperiodo) {
								max = nperiodo;
								speriodonuevo = 'a' + nperiodo;
							}
						}
					}

					if (speriodonuevo !== '') {
						var nuevoperiodo = JSON.parse(JSON.stringify(plantilla));
						delete nuevoperiodo._id;

						var restriccion = {},
							set = {},
							periodos_periodo = 'periodos.' + speriodonuevo;

						restriccion[periodos_periodo] = {'$exists': false };
						set['$set'] = {};
						set['$set'][periodos_periodo] = nuevoperiodo;
						//BUG: Error de doble respuesta
						Procedimiento.update(restriccion, set, {upsert: false, multi: true}, function (erro) {
							if (erro) {
								console.error('nuevaAnualidad...');
								console.error(erro);
								res.status(500).end();
								return;
							} else {
								res.json({});
								console.log('Actualizados procedimientos de mentira');
							}
						});
						var restriccion_periodo = {};
						restriccion_periodo[speriodonuevo] = {'$exists': false};
						var set_periodo = {};
						set_periodo['$set'] = {};
						set_periodo['$set'][speriodonuevo] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
						Periodo.update(restriccion_periodo, set_periodo, {multi: false, upsert: false}, function (error) {
							if (error) {
								console.error('nuevaAnualidad...');
								console.error(error);
								res.status(500).end();
								return;
							} else {
								console.log('Actualizados periodos');
							}
						});
					}
				});
			}
		});
	};
};

