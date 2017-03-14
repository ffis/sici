(function(module){
	'use strict';
	const Q = require('q');

	module.exports.getPeriodo = function(req, res){
		const periodomodel = req.metaenvironment.models.periodo(),
			id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			periodomodel.findOne({'_id': req.metaenvironment.models.ObjectId(id)}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			periodomodel.find({}, req.eh.cb(res));
		}
	};

	module.exports.updatePeriodo = function(req, res) {
		const periodomodel = req.metaenvironment.models.periodo(),
			id = req.params.id,
			content = JSON.parse(JSON.stringify(req.body));
		if (typeof id === 'string' && id !== ''){
			Reflect.deleteProperty(content, '_id');

			periodomodel.update({'_id': id}, content, {upsert: false}, req.eh.cbWithDefaultValue(res, req.body));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.newPeriodo = function (req, res) {
		const periodomodel = req.metaenvironment.models.periodo(),
			content = req.body;
		periodomodel.create(content, req.eh.cbWithDefaultValue(res, content));
	};

	module.exports.removePeriodo = function (req, res) {
		const periodomodel = req.metaenvironment.models.periodo(),
			id = req.params.id,
			content = req.body;
		if (typeof id === 'string' && id !== ''){
			periodomodel.remove({'_id': req.metaenvironment.models.ObjectId(id)}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.nuevaAnualidad = function (req, res) {
		const anualidad = parseInt(req.params.anyo, 10);
		if (anualidad > 2014){
			const models = req.metaenvironment.models,
				plantillaanualidad = models.plantillaanualidad(),
				periodomodel = models.periodo(),
				procedimientomodel = models.procedimiento();

			Q.all([plantillaanualidad.findOne().lean().exec(), periodomodel.findOne().lean().exec()]).then(function(cargas){
				const plantilla = cargas[0],
					periodo = cargas[1];

				const periodoclone = JSON.parse(JSON.stringify(periodo));
				Reflect.removeProperty(periodoclone, '_id');

				const anualidades = Object.keys(periodoclone);

				let speriodonuevo = '';
				let max = 0;
				/* TODO: CHANGE TO REDUCE */
				for (let i = 0, j = anualidades.length; i < j; i += 1){
					if (!isNaN(parseInt(anualidades[i].replace('a', ''), 10))){
						let nperiodo = parseInt(anualidades[i].replace('a', ''), 10);
						nperiodo += 1;
						if (max < nperiodo) {
							max = nperiodo;
							speriodonuevo = 'a' + nperiodo;
						}
					}
				}

				if (speriodonuevo === '') {
					req.eh.notFoundHelper(res);
				} else {
					const nuevoperiodo = JSON.parse(JSON.stringify(plantilla));
					Reflect.deleteProperty(nuevoperiodo, '_id');

					const restriccion = {},
						restriccionPeriodo = {},
						setPeriodo = {},
						set = {'$set': {}},
						periodosPeriodo = 'periodos.' + speriodonuevo;

					restriccion[periodosPeriodo] = {'$exists': false};
					restriccionPeriodo[speriodonuevo] = {'$exists': false};

					set.$set[periodosPeriodo] = nuevoperiodo;

					setPeriodo.$set = {};
					setPeriodo.$set[speriodonuevo] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

					const deferActualizacionProcedimiento = procedimientomodel.update(restriccion, set, {upsert: false, multi: true}).exec();
					const deferActualizacionPeriodo = periodomodel.update(restriccionPeriodo, setPeriodo, {multi: false, upsert: false}).exec();
					Q.all([deferActualizacionProcedimiento, deferActualizacionPeriodo]).then(req.eh.okHelper(res), req.eh.errorHelper(res));
				}

			}, req.eh.errorHelper(res));

		} else {
			req.eh.notFoundHelper(res);
		}
	};

})(module);
