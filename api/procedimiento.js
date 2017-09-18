(function(module, logger){
	'use strict';
	const Q = require('q');

	function saveVersion (models, ps) {
		if (!ps){

			return Q.all([]);
		}
		const procedimientos = Array.isArray(ps) ? ps : [ps];

		if (procedimientos.length === 0){

			return Q.all([]);
		}

		const clones = procedimientos.map(function(p){
			const clon = JSON.parse(JSON.stringify(p));
			Reflect.deleteProperty(clon, '_id');

			return clon;
		});
		const defer = Q.defer();
		models.historico().insertMany(clones, defer.makeNodeResolver());

		return defer.promise;
	}

	module.exports.hasChildred = function (req, res) {
		const procedimientomodel = req.metaenvironment.models.procedimiento(),
			codigo = req.params.codigo;
		if (req.user.permisoscalculados && (req.user.permisoscalculados.procedimientoslectura.indexOf(codigo) > -1 || req.user.permisoscalculados.superuser)) {

			procedimientomodel.count({'padre': codigo}, function(err, count) {
				if (err) {
					req.eh.callbackErrorHelper(res, err);
				} else {
					res.json({'count': count});
				}
			});
		} else {
			req.eh.unauthorizedHelper(res, 'No tiene permiso para consultar el número de hijos de este procedimiento');
		}
	};

	module.exports.createProcedimiento = function (req, res) {
		const models = req.metaenvironment.models,
			procedimientomodel = req.metaenvironment.models.procedimiento(),
			periodomodel = req.metaenvironment.models.periodo(),
			plantillaanualidadmodel = req.metaenvironment.models.plantillaanualidad(),
			jerarquiamodel = req.metaenvironment.models.jerarquia(),
			recalculate = req.metaenvironment.recalculate;

		if (!(req.user.permisoscalculados && req.user.permisoscalculados.superuser)){
			req.eh.unauthorizedHelper(res, 'Error. Sólo el administrador puede crear procedimientos');

			return;
		}

		if (req.body.idjerarquia && !isNaN(parseInt(req.body.idjerarquia, 10)) && req.body.denominacion && req.body.codigo && req.body.cod_plaza && parseInt(req.body.idjerarquia, 10) > 0){
			var procedimiento = new procedimientomodel();
			const idjerarquia = parseInt(req.body.idjerarquia, 10);

			procedimiento.idjerarquia = idjerarquia;
			procedimiento.denominacion = req.body.denominacion;
			procedimiento.codigo = req.body.codigo;
			procedimiento.fecha_creacion = new Date();
			if (req.body.cod_plaza){
				procedimiento.cod_plaza = req.body.cod_plaza;
			}
			if (req.body.padre){
				procedimiento.padre = String(req.body.padre);
			}

			//check jerarquia $exists
			jerarquiamodel.findOne({'id': idjerarquia}).then(function(jerarquia){
				if (jerarquia){
					//check codigo $exists:0
					procedimientomodel.count({'codigo': procedimiento.codigo}, function (err, count) {
						if (err){
							req.eh.callbackErrorHelper(res, err);

							return;
						} else if (count > 0) {
							req.eh.callbackErrorHelper(res, {'error': 'Ya existe un procedimiento con el mismo codigo, quizás esté eliminado'});

							return;
						}

						const deferPeriodos = periodomodel.find().limit(1).lean().exec();
						const deferPlantilla = plantillaanualidadmodel.find().limit(1).lean().exec();

						Q.all([deferPeriodos, deferPlantilla]).then(function(data){
							console.log(data[0], data[1]);
							const periodos = JSON.parse(JSON.stringify(data[0][0]));
							const plantilla = JSON.parse(JSON.stringify(data[1][0]));

							Reflect.deleteProperty(periodos, '_id');
							Reflect.deleteProperty(plantilla, '_id');

							procedimiento.periodos = {};
							for (const anualidad in periodos){
								if (!isNaN(parseInt(anualidad.replace('a', ''), 10))){
									procedimiento.periodos[anualidad] = JSON.parse(JSON.stringify(plantilla));
									procedimiento.periodos[anualidad].periodoscerrados = periodos[anualidad];
								}
							}
							procedimiento.periodos.a2013 = {
								'plazo_maximo_resolver': 0,
								'plazo_maximo_responder': null,
								'plazo_CS_ANS_naturales': null,
								'pendientes_iniciales': 0,
								'total_resueltos': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
								'periodoscerrados': periodos.a2013
							};

							procedimiento.save(function(erro) {
								if (erro){
									req.eh.callbackErrorHelper(res, erro);

									return;
								}
								recalculate.softCalculateProcedimiento(models, procedimiento).then(function(p) {
									recalculate.softCalculateProcedimientoCache(models, p).then(function(pr) {
										procedimiento.save(req.eh.cbWithDefaultValue(res, pr));
										/* posible aunque improbable condición de carrera */
										const api = req.metaenvironment.api;
										api.resetCache();
									}, req.eh.errorHelper(res, 'Error 102'));
								}, req.eh.errorHelper(res, 'Error 103'));
							});
						}).fail(req.eh.errorHelper(res, 'Error 147 guardando'));
					});
				} else {
					req.eh.callbackErrorHelper(res, {error: 'No se ha encontrado la jerarquia asociada'});
				}
			}, req.eh.errorHelper(res, 'Error 147 guardando'));
		} else {
			req.eh.callbackErrorHelper(res, {error: 'Error 113 guardando'});
		}
	};

	module.exports.procedimiento = function (req, res) {
		const procedimientomodel = req.metaenvironment.models.procedimiento(),
			restriccion = {};
		if (typeof req.params.codigo === 'string' && req.params.codigo.trim() !== ''){
			restriccion.codigo = req.params.codigo;
			
			if (!req.user.permisoscalculados.superuser){
				restriccion.idjerarquia = {'$in': req.user.permisoscalculados.jerarquialectura};
			}
			procedimientomodel.findOne(restriccion, req.eh.cb(res));

		} else {
			req.eh.missingParameterHelper(res, 'codigo');
		}
	};

	module.exports.deleteProcedimiento = function(req, res) {
		const models = req.metaenvironment.models,
			crawledmodel = models.crawled(),
			procedimientomodel = models.procedimiento(),
			recalculate = req.metaenvironment.recalculate,
			restriccion = {};

		if (typeof req.params.codigo === 'string' && req.params.codigo.trim() !== ''){
			restriccion.codigo = req.params.codigo;
		} else {
			req.eh.missingParameterHelper(res, 'codigo');

			return;
		}

		if (!req.user.permisoscalculados.superuser){
			restriccion.idjerarquia = {'$in': req.user.permisoscalculados.jerarquiaescritura};
		}

		procedimientomodel.findOne(restriccion).exec().then(function(original){
			if (original){
				const puedeEscribirSiempre = req.user.permisoscalculados.superuser;
				if (puedeEscribirSiempre) {
					original.eliminado = true;
					if (!isNaN(parseInt(original.codigo, 10))){
						crawledmodel.remove({'id': parseInt(original.codigo, 10)});
					}
				}
				procedimientomodel.count({'padre': original.codigo}).exec().then(function(count){
					if (count > 0) {
						res.status(400).end({error: 'No puede eliminar un procedimiento con hijos'});

						return;
					}
					recalculate.softCalculateProcedimiento(models, original).then(function (origin){
						recalculate.softCalculateProcedimientoCache(models, origin).then(function (orig) {
							saveVersion(models, orig).then(function(){
								orig.fecha_version = new Date();
								procedimientomodel.update({'codigo': orig.codigo}, JSON.parse(JSON.stringify(orig)), {'multi': false, 'upsert': false}).exec().then(function(){
									recalculate.fullSyncjerarquia(models).then(function(){
										const api = req.metaenvironment.api;
										api.resetCache();
										res.json(orig);
									}, req.eh.errorHelper(res));
								}, req.eh.errorHelper(res));
							}, req.eh.errorHelper(res));
						}, req.eh.errorHelper(res));
					}, req.eh.errorHelper(res));
				}, req.eh.errorHelper(res));
			} else {
				req.eh.notFoundHelper(res);
			}
		}, req.eh.errorHelper(res));
	};


	function ocultarHijos(procedimiento, models) {
		const defer = Q.defer();
		const procedimientomodel = models.procedimiento();
		
		procedimientomodel.find({padre: procedimiento.codigo}, function (err, procs) {
			if (err){
				defer.reject(err);
			}
			const promesasProcs = [];
			procs.forEach(function(proc){
				saveVersion(models, proc).then(function(){
					const deferProc = Q.defer();
					promesasProcs.push(deferProc.promise);
					procedimiento.fecha_version = new Date();
					procedimientomodel.update({codigo: proc.codigo}, {'$set': {'oculto': procedimiento.oculto}}, {multi: false, upsert: false}, function(erro){
						if (erro) {
							deferProc.reject(erro);
						} else {
							ocultarHijos(proc, models).then(deferProc.resolve, deferProc.reject);
						}
					});
				});
			});
			Q.all(promesasProcs).then(defer.resolve, defer.reject);
		});

		return defer.promise;
	}

	function registraPermisoYPersona(models, personalib, cfg, codPlaza, granttinguser){
		const defer = Q.defer(),
			permisomodel = models.permiso(),
			personamodel = models.persona();

		permisomodel.findOne({codplaza: codPlaza}).then(function(permiso) {
			if (permiso === null) {
				// si no existe permiso asociado creamos uno para el usuario.
				const nuevopermiso = {
					'codplaza': codPlaza,
					'login': null,
					'jerarquialectura': [],
					'jerarquiadirectalectura': [],
					'jerarquiaescritura': [],
					'jerarquiadirectaescritura': [],
					'procedimientoslectura': [],
					'procedimientosdirectalectura': [],
					'procedimientosescritura': [],
					'procedimientosdirectaescritura': [],
					'superuser': 0,
					'grantoption': 0,
					'descripcion': 'Permiso otorgado por ' + granttinguser.login,
					'caducidad': granttinguser.permisoscalculados.caducidad,
					'cod_plaza_grantt': granttinguser.login
				};
				permisomodel.create(nuevopermiso, defer.makeNodeResolver());
				/* TODO: REVISAR ESTO, SE RESOLVERÍA 2 VECES */
				personalib.registroPersonaWS(codPlaza, models, cfg).then(function(){

					personamodel.update({'codplaza': codPlaza}, {$set: {'habilitado': true}}, {multi: false, upsert: false}, function(erro){
						if (erro){
							logger.error('Error habilitando personas del codigo de plaza responsable');
						}
					});
					logger.log('La persona existía en el WS, lo ha buscado y encontrado');
				}, function(error) {

					personamodel.update({'codplaza': codPlaza}, {$set: {'habilitado': true}}, {multi: false, upsert: false}, function(erro){
						if (erro){
							logger.error('Error habilitando personas del codigo de plaza responsable');
						}
					});
					logger.log('La persona no existía en el WS o ha fallado el WS');
					logger.error(error);
				});
			} else {
				defer.resolve();
			}
		}, defer.reject);

		return defer.promise;
	}

	module.exports.updateProcedimiento = function (req, res) {
		const models = req.metaenvironment.models,
			recalculate = req.metaenvironment.recalculate,
			cfg = req.metaenvironment.cfg,
			personalib = req.metaenvironment.persona,
			procedimientomodel = models.procedimiento(),
			periodomodel = models.periodo(),
			crawledmodel = models.crawled(),
			restriccion = {};

		if (typeof req.params.codigo === 'string'){
			restriccion.codigo = req.params.codigo;
		}

		if (!req.user.permisoscalculados.superuser){
			restriccion.$or = [
				{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquiaescritura}},
				{'codigo': {'$in': req.user.permisoscalculados.procedimientosescritura}}
			];
		}

		const deferPeriodos = periodomodel.findOne().lean().exec();

		procedimientomodel.findOne(restriccion).exec().then(function(original){

			if (!original || typeof original !== 'object') {
				req.eh.callbackErrorHelper(res, {'error': 'Error en updateProcedimiento (Procedimiento.findOne, original === null)', 'restriccion': restriccion});
			
				return;
			}

			original.markModified('periodos');

			const procedimiento = req.body;
			//TODO: comprobar qué puede cambiar y qué no

			//suponemos que es un usuario normal, con permisos de escritura, en ese caso sólo podra modificar
			//los atributos que estan dentro de periodo, que no son array, y aquellos que siendo array no
			//son periodos cerrados ni corresponden a un periodo cerrado

			const puedeEscribirSiempre = req.user.permisoscalculados.superuser;
			let hayCambiarOcultoHijos = false;
			if (puedeEscribirSiempre) {
				if (original.idjerarquia !== procedimiento.idjerarquia) {
					original.idjerarquia = procedimiento.idjerarquia;
					const api = req.metaenvironment.api;
					api.resetCache();
				}
				original.padre = procedimiento.padre;
				// Actualiza estado oculto o eliminado
				if (original.oculto !== procedimiento.oculto) {
					hayCambiarOcultoHijos = true;
					if (!isNaN(parseInt(procedimiento.codigo, 10))){
						crawledmodel.update({'id': parseInt(procedimiento.codigo, 10)}, {'$set': {'oculto': original.oculto}}, {'multi': false, 'upsert': false}, logger.error);
					}
				}
				original.oculto = procedimiento.oculto;
			}


			//TODO: IMPEDIR EDICION DE ANUALIDADES MUY PRETÉRITAS
			const schema = models.getSchema('plantillaanualidad');
			let codplazaChanged = false;
			deferPeriodos.then(function(periodos){
				const periodosclon = JSON.parse(JSON.stringify(periodos));
				for (const anualidad in periodosclon) {
					if (parseInt(anualidad.replace('a', ''), 10) > 2013){
						const periodoscerrados = original.periodos[anualidad].periodoscerrados;

						if (puedeEscribirSiempre) {
							if (original.cod_plaza !== procedimiento.cod_plaza) {
								original.cod_plaza = procedimiento.cod_plaza;
								codplazaChanged = true;
							}
							original.denominacion = procedimiento.denominacion;
						}

						for (const attr in schema){
							if (attr === 'periodoscerrados'){
								continue;
							}
							if (typeof original.periodos[anualidad][attr] === 'object' && Array.isArray(original.periodos[anualidad][attr])){
								for (let mes = 0, meses = periodoscerrados.length; mes < meses; mes += 1){
									if (puedeEscribirSiempre || !periodoscerrados[mes]) {
										//el periodo no está cerrado y se puede realizar la asignacion
										original.periodos[anualidad][attr][mes] = procedimiento.periodos[anualidad][attr][mes] === null ? null : parseInt(procedimiento.periodos[anualidad][attr][mes], 10);
									}
								}
							} else {
								original.periodos[anualidad][attr] = procedimiento.periodos[anualidad][attr] === null ? null : parseInt(procedimiento.periodos[anualidad][attr], 10);
							}
						}
					}
				}

				original.periodos.a2013 = {
					'plazo_maximo_resolver': procedimiento.periodos.a2013.plazo_maximo_resolver,
					'plazo_maximo_responder': procedimiento.periodos.a2013.plazo_maximo_responder,
					'plazo_CS_ANS_naturales': procedimiento.periodos.a2013.plazo_CS_ANS_naturales,
					'pendientes_iniciales': procedimiento.periodos.a2013.pendientes_iniciales,
					'periodoscerrados': procedimiento.periodos.a2013.periodoscerrados
				};

				if (!Array.isArray(original.periodos.a2013.total_resueltos) || original.periodos.a2013.total_resueltos.length !== 12){
					original.periodos.a2013.total_resueltos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				}

				for (let mes = 0, meses = original.periodos.a2013.periodoscerrados.length; mes < meses; mes += 1) {
					original.periodos.a2013.total_resueltos[mes] = parseInt(procedimiento.periodos.a2013.total_resueltos[mes], 10);
				}

				recalculate.softCalculateProcedimiento(models, original).then(function(origin){
					recalculate.softCalculateProcedimientoCache(models, origin).then(function(orig){
						saveVersion(models, orig).then(function(){
							original.fecha_version = new Date();
							procedimientomodel.update({'codigo': orig.codigo}, JSON.parse(JSON.stringify(orig))).then(function(){
								const promesaProc = Q.defer();

								if (codplazaChanged) {
									registraPermisoYPersona(models, personalib, cfg, orig.cod_plaza, req.user).then(function(){
										return recalculate.fullSyncpermiso(models).then(promesaProc.resolve, promesaProc.reject);
									}, promesaProc.reject);
								} else {
									promesaProc.resolve();
								}

								promesaProc.promise.then(function(){
									if (hayCambiarOcultoHijos) {
										ocultarHijos(orig, models).then(function() {
											recalculate.fullSyncjerarquia(models).then(function(){
													res.json(original);
												}, req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 9'));
										}, req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 8'));
									} else {
										res.json(orig);
									}
								}).fail(req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 7'));
							}).fail(req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 6'));
						}).fail(req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 5'));
					}).fail(req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 4'));
				}).fail(req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 3'));
			}).fail(req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 2'));
		}).fail(req.eh.errorHelper(res, 500, 'Error en softCalculateProcedimiento 1'));
	};


	module.exports.procedimientosByResponsable = function(req, res){
		if (!(req.user.permisoscalculados && req.user.permisoscalculados.superuser)){
			req.eh.unauthorizedHelper(res);

			return;
		}

		if (typeof req.params.codplaza !== 'undefined' && req.params.codplaza !== '') {
			const restriccion = {'$and': [{'cod_plaza': req.params.codplaza}, {'$or': [{'oculto': {$exists: false}},	{'$and': [{'oculto': {'$exists': true}}, {'oculto': false}]}]}]};
			const procedimientomodel = req.metaenvironment.models.procedimiento();
			procedimientomodel.find(restriccion).exec().then(req.eh.okHelper(res), req.eh.errorHelper(res, 500, 'Invocación incorrecta listando procedimientos por responsable'));
		} else {
			req.eh.missingParameterHelper(res, 'codplaza');
		}
	};

	module.exports.procedimientoList = function(req, res) {
		const models = req.metaenvironment.models;
		const procedimientomodel = models.procedimiento();
		const restriccion = {'$and': [{'oculto': {'$ne': true}}, {'eliminado': {'$ne': true}}]};

		if (typeof req.params.idjerarquia === 'string' && parseInt(req.params.idjerarquia, 10) > 0){
			const idjerarquia = parseInt(req.params.idjerarquia, 10);
			if (typeof req.params.recursivo === 'string' && JSON.parse(req.params.recursivo)){
				restriccion.$and.push({'$or': [{'ancestros.id': idjerarquia}, {'idjerarquia': idjerarquia}]});
			} else {
				restriccion.$and.push({'idjerarquia': idjerarquia});
			}
		}

		if (!req.user.permisoscalculados.superuser){
			restriccion.$and.push({'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura}});
		}
		if (typeof req.query.id === 'string'){
			restriccion.$and.push({'_id': models.objectId(req.query.id)});
		}

		const query = procedimientomodel.find(restriccion);
		if (typeof req.query.fields === 'string' && req.query.fields.trim() !== ''){
			query.select(req.query.fields.trim());
		}
		query.exec(req.eh.cb(res));
	};

	module.exports.totalProcedimientos = function (req, res) {
		const procedimientomodel = req.metaenvironment.models.procedimiento();
		const restriccion = req.user.permisoscalculados.superuser ? {} : {'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura}};
		procedimientomodel.count(restriccion,
			function (err, count) {
				if (err){
					req.eh.callbackErrorHelper(res, err);
				} else {
					res.json({count: count});
				}
			});
	};

	module.exports.totalTramites = function (req, res) {
		const settings = req.metaenvironment.settings,
			models = req.metaenvironment.models,
			procedimientomodel = models.procedimiento(),
			anualidad = req.params.anualidad ? parseInt(req.params.anualidad, 10) : settings.anyo,
			pipeline = [];

		if (!req.user.permisoscalculados.superuser){
			pipeline.push({'$match': {idjerarquia: {$in: req.user.permisoscalculados.jerarquialectura}}});
		}
		pipeline.push({'$group': {_id: '', suma: {$sum: '$periodos.a' + anualidad + '.totalsolicitados'}}});

		procedimientomodel.aggregate(pipeline, function (err, result) {
			if (err) {
				req.eh.callbackErrorHelper(res, err);
			} else {
				res.json(result.length === 0 ? {} : result[0]);
			}
		});
	};

	module.exports.ratioResueltos = function (req, res) {
		const settings = req.metaenvironment.settings,
			models = req.metaenvironment.models,
			procedimientomodel = models.procedimiento(),
			anualidad = req.params.anualidad ? parseInt(req.params.anualidad, 10) : settings.anyo,
			pipeline = [];

		if (!req.user.permisoscalculados.superuser){
			pipeline.push({'$match': {idjerarquia: {$in: req.user.permisoscalculados.jerarquialectura}}});
		}
		pipeline.push({'$unwind': '$periodos.a' + anualidad + '.solicitados'},
			{'$group': {_id: '$_id', suma: {'$sum': '$periodos.a' + anualidad + '.solicitados'}, resueltos: {'$first': '$periodos.a' + anualidad + '.total_resueltos'}}},
			{'$unwind': '$resueltos'},
			{'$group': {_id: '$_id', suma: {'$first': '$suma'},	resueltos: {'$sum': '$resueltos'}}},
			{'$group': {_id: '', suma: {'$sum': '$suma'}, resueltos: {'$sum': '$resueltos'}}},
			{'$project': {'ratio': {'$divide': ['$resueltos', '$suma']}}});

		procedimientomodel.aggregate(pipeline).then(function(result){
			if (result.length === 0) {
				res.json({'ratio': 0});
			} else {
				result[0].ratio = result[0].ratio.toFixed(2);
				res.json(result[0]);
			}
		}, req.eh.errorHelper(res, 500, 'Invocación inválida en el ratio de expedientes resueltos'));
	};

	module.exports.procedimientosSinExpedientes = function (req, res) {
		const settings = req.metaenvironment.settings,
			models = req.metaenvironment.models,
			procedimientomodel = models.procedimiento(),
			anualidad = req.params.anualidad ? parseInt(req.params.anualidad, 10) : settings.anyo,
			pipeline = [];

		if (!req.user.permisoscalculados.superuser){
			pipeline.push({'$match': {idjerarquia: {$in: req.user.permisoscalculados.jerarquialectura}}});
		}
		pipeline.push({'$unwind': '$periodos.a' + anualidad + '.solicitados'},
			{'$group': {'_id': '$_id', suma: {'$sum': '$periodos.a' + anualidad + '.solicitados'}}},
			{'$match': {'suma': 0}},
			{'$group': {'_id': '', 'total': {'$sum': 1}}});

		procedimientomodel.aggregate(pipeline, function (err, result) {
			if (err) {
				req.eh.callbackErrorHelper(res, err);
			} else {
				res.json(result.length === 0 ? {} : result[0]);
			}
		});
	};

	function notFound(req, res){
		req.eh.notFoundHelper(res);
	}

	module.exports.mediaMesTramites = notFound;
	module.exports.setPeriodosCerrados = notFound;
	module.exports.saveVersion = saveVersion;

})(module, console);
