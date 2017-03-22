(function(module){
	'use strict';
	const Q = require('q');

	/* TODO: explicar esto, es poco intuitivo y eso aparenta ocultar errores */
	function getPermisosByLoginPlaza(params, models, login, codPlaza){
		const permisomodel = models.permiso(),
			df = Q.defer();

		let restriccion = {};

		if (!login && params.login && params.login !== '-'){
			login = params.login;
		}

		if (!codPlaza && params.cod_plaza && params.cod_plaza !== '-'){
			codPlaza = params.cod_plaza;
		}

		if (login && login !== '-' && codPlaza && codPlaza !== '-'){
			restriccion = {'$or': [{'login': login}, {'codplaza': codPlaza}]};
		} else if (login && login !== '-'){
			restriccion.login = login;
		} else if (codPlaza && codPlaza !== '-'){
			restriccion.codplaza = codPlaza;
		}

		if (login !== '-' || codPlaza !== '-'){
			permisomodel.find(restriccion).exec().then(df.resolve, df.reject);
		} else {
			df.resolve([]);
		}

		return df.promise;
	}

	module.exports.delegarpermisosEntidadObjeto = function(req, res){
		const models = req.metaenvironment.models,
			permisomodel = models.permiso(),
			eopermitidos = req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura);

		if (typeof req.params.entidadobjeto === 'string' && req.params.entidadobjeto !== ''){
			const eo = req.params.entidadobjeto;

			if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && eopermitidos.indexOf(eo) >= 0)){

				const entidadobjetomodel = models.entidadobjeto();
				entidadobjetomodel.findOne({'codigo': eo}).exec().then(function(entidadobjeto){
					const idjerarquia = entidadobjeto.idjerarquia;
					const ep = {};
					if (req.params.cod_plaza && req.params.cod_plaza !== '-' && req.params.cod_plaza !== ''){
						ep.codplaza = req.params.cod_plaza;
					}
					if (req.params.login && req.params.login !== '-' && req.params.login !== ''){
						ep.login = req.params.login;
					}
					ep.jerarquialectura = [idjerarquia];
					ep.jerarquiaescritura = [];
					ep.jerarquiadirectalectura = [idjerarquia];
					ep.jerarquiadirectaescritura = [];
					ep.procedimientosescritura = [];
					ep.procedimientoslectura = [];
					ep.procedimientosdirectalectura = [];
					ep.procedimientosdirectaescritura = [];
					ep.entidadobjetolectura = [entidadobjeto.codigo];
					ep.entidadobjetoescritura = [entidadobjeto.codigo];
					ep.entidadobjetodirectalectura = [entidadobjeto.codigo];
					ep.entidadobjetodirectaescritura = [entidadobjeto.codigo];
					ep.superuser = 0;
					ep.cod_plaza_grantt = req.user.login;
					ep.descripcion = 'Permisos delegados por ' + ep.cod_plaza_grantt;
					ep.grantoption = false;

					permisomodel.find({'$or': [{'entidadobjetoescritura': entidadobjeto.codigo}, {'entidadobjetodirectaescritura': entidadobjeto.codigo}]}).exec().then(function(permisos){
						const caducidad = new Date();
						caducidad.setFullYear(caducidad.getFullYear() + 2);

						ep.caducidad = permisos.reduce(function(prev, permiso){
							return (permiso.caducidad && permiso.caducidad.getTime() > prev.getTime()) ? permiso.caducidad : prev;
						}, caducidad);

						permisomodel.create(ep, req.eh.cb(res));
					}, req.eh.errorHelper(res));
				}, req.eh.errorHelper(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'entidadobjeto');
		}
	};

	module.exports.delegarpermisosProcedimiento = function(req, res){
		const models = req.metaenvironment.models;
		const proc = req.params.procedimiento;
		const procedimientospermitidos = req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura);

		if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && procedimientospermitidos.indexOf(proc) >= 0)){

			const permisomodel = models.permiso();
			const procedimientomodel = models.procedimiento();
			procedimientomodel.findOne({'codigo': proc}).exec().then(function(procedimiento){
				if (!procedimiento){
					req.eh.notFoundHelper(res);

					return;
				}

				const idjerarquia = procedimiento.idjerarquia;
				const ep = {};
				if (req.params.cod_plaza && req.params.cod_plaza !== '-' && req.params.cod_plaza !== ''){
					ep.codplaza = req.params.cod_plaza;
				}
				if (req.params.login && req.params.login !== '-' && req.params.login !== ''){
					ep.login = req.params.login;
				}
				ep.jerarquialectura = [idjerarquia];
				ep.jerarquiaescritura = [];
				ep.jerarquiadirectalectura = [idjerarquia];
				ep.jerarquiadirectaescritura = [];
				ep.procedimientosescritura = [procedimiento.codigo];
				ep.procedimientoslectura = [procedimiento.codigo];
				ep.procedimientosdirectalectura = [procedimiento.codigo];
				ep.procedimientosdirectaescritura = [procedimiento.codigo];
				ep.entidadobjetolectura = [];
				ep.entidadobjetoescritura = [];
				ep.entidadobjetodirectalectura = [];
				ep.entidadobjetodirectaescritura = [];
				ep.superuser = 0;
				ep.cod_plaza_grantt = req.user.login;
				ep.descripcion = 'Permisos delegados por ' + ep.cod_plaza_grantt;
				ep.grantoption = false;


				/* cálculo de la caducidad, de existir se pone la mayor posible sino hasta dentro de 2 años */
				const restriccion = {'$or': [{'procedimientosescritura': procedimiento.codigo}, {'procedimientosdirectaescritura': procedimiento.codigo}]};
				permisomodel.find(restriccion).exec().then(function(permisos){
					
					const caducidad = new Date();
					caducidad.setFullYear(caducidad.getFullYear() + 2);

					ep.caducidad = permisos.reduce(function(prev, permiso){
						return (permiso.caducidad && permiso.caducidad.getTime() > prev.getTime()) ? permiso.caducidad : prev;
					}, caducidad);

					permisomodel.create(ep, req.eh.cb(res));

				}, req.eh.errorHelper(res));
			}, req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	function permisosPostSave(op, defer, models, recalculate){
		return function(err, p){
			if (err) {
				defer.reject(err);
			} else {
				recalculate.softCalculatePermiso(models, p).then(defer.resolve, defer.reject);
			}
		};
	}


	module.exports.delegarpermisos = function(req, res){
		if (!(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser)){
			req.eh.unauthorizedHelper(res);

			return;
		}

		const models = req.metaenvironment.models,
			recalculate = req.metaenvironment.recalculate,
			Permiso = models.permiso();


		 getPermisosByLoginPlaza(req.params, models, req.user.login, req.user.codplaza).then(function(permisos){
			const paux = [];
			const promesasPermisos = [];

			for (let i = 0; i < permisos.length; i += 1){
				const p = JSON.parse(JSON.stringify(permisos[i]));

				if (paux.indexOf(p._id) !== -1){
					continue;
				} else {
					paux.push(p._id);
				}

				Reflect.deleteProperty(p, '_id');

				if (req.params.login && req.params.login !== '-'){
					p.login = req.params.login;
				}
				if (req.params.cod_plaza && req.params.cod_plaza !== '-'){
					p.codplaza = req.params.cod_plaza;
				}
				p.cod_plaza_grantt = (permisos[i].codplaza ? permisos[i].codplaza : permisos[i].login);
				p.grantoption = false;

				const defer = Q.defer();
				promesasPermisos.push(defer.promise);

				const op = new Permiso(p);
				op.save(permisosPostSave(op, defer, models, recalculate));
			}

			Q.all(promesasPermisos).then(req.eh.okHelper(res), req.eh.errorHelper(res));
		}, req.eh.errorHelper(res));
	};

	module.exports.permisosByLoginPlaza = function(req, res) {
		const models = req.metaenvironment.models;
		getPermisosByLoginPlaza(req.params, models).then(req.eh.okHelper(res), req.eh.errorHelper(res));
	};

	module.exports.removePermisoCarta = function(req, res) {

		if (typeof req.params.identidadobjeto === 'string' && req.params.identidadobjeto !== ''){
			if (typeof req.params.idpermiso === 'string' && req.params.idpermiso !== ''){
				const models = req.metaenvironment.models,
					recalculate = req.metaenvironment.recalculate,
					permisomodel = models.permiso(),
					idpermiso = req.params.idpermiso,
					identidadobjeto = req.params.identidadobjeto,
					eopermitidos = req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura);

				if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && eopermitidos.indexOf(identidadobjeto) >= 0)){
					permisomodel.findOne({'_id': models.objectId(idpermiso)}).exec().then(function(permiso){
						if (permiso === null){
							req.eh.notFoundHelper(res);

							return;
						}

						const indexR = permiso.entidadobjetolectura.indexOf(identidadobjeto);
						const indexW = permiso.entidadobjetodirectaescritura.indexOf(identidadobjeto);

						if (indexR !== -1){
							permiso.entidadobjetolectura.splice(indexR, 1);
						}
						if (indexW !== -1){
							permiso.entidadobjetodirectaescritura.splice(indexW, 1);
						}

						recalculate.softCalculatePermiso(models, permiso).then(function(permi){
							if (permi.entidadobjetodirectalectura.length === 0 && (typeof permi.jerarquiadirectalectura === 'undefined' || permi.jerarquiadirectalectura.length === 0)){
								permisomodel.remove({'_id': models.objectId(idpermiso)}, req.eh.cbWithDefaultValue(res, {}));
							} else {
								permisomodel.update({'_id': models.objectId(idpermiso)}, permi, {'upsert': false}, req.eh.cbWithDefaultValue(res, permi));
							}
						}, req.eh.errorHelper(res));
					}, req.eh.errorHelper(res));
				} else {
					req.eh.unauthorizedHelper(res);
				}
			} else {
				req.eh.missingParameterHelper(res, 'idpermiso');
			}
		} else {
			req.eh.missingParameterHelper(res, 'identidadobjeto');
		}
	};

	module.exports.removePermisoProcedimiento = function(req, res) {

		if (typeof req.params.idprocedimiento !== 'undefined' && req.params.idprocedimiento !== ''){
			if (typeof req.params.idpermiso !== 'undefined' && req.params.idpermiso !== ''){

				const models = req.metaenvironment.models,
					recalculate = req.metaenvironment.recalculate,
					permisomodel = models.permiso(),
					idpermiso = req.params.idpermiso,
					idprocedimiento = req.params.idprocedimiento,
					procedimientospermitidos = req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura);

				if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && procedimientospermitidos.indexOf(idprocedimiento) >= 0)){
					permisomodel.find({'_id': models.objectId(idpermiso)}).exec().then(function(permiso){
						if (permiso){

							const indexR = permiso.procedimientoslectura.indexOf(idprocedimiento);
							const indexW = permiso.procedimientosdirectaescritura.indexOf(idprocedimiento);

							if (indexR !== -1){
								permiso.procedimientosdirectalectura.splice(indexR, 1);
							}
							if (indexW !== -1){
								permiso.procedimientosdirectaescritura.splice(indexW, 1);
							}

							recalculate.softCalculatePermiso(models, permiso).then(function(permi){
								if (permi.procedimientosdirectalectura.length === 0 && (typeof permi.jerarquiadirectalectura === 'undefined' || permi.jerarquiadirectalectura.length === 0)){
									permisomodel.remove({'_id': models.objectId(idpermiso)}, req.eh.cbWithDefaultValue(res, {}));
								} else {
									permisomodel.update({'_id': models.objectId(idpermiso)}, permi, {'upsert': false}, req.eh.cbWithDefaultValue(permi));
								}
							}, req.eh.errorHelper(res));
						} else {
							req.eh.notFoundHelper(res);
						}
					}, req.eh.errorHelper(res));
				} else {
					req.eh.unauthorizedHelper(res);
				}
			} else {
				req.eh.missingParameterHelper(res, 'idpermiso');
			}
		} else {
			req.eh.missingParameterHelper(res, 'idprocedimiento');
		}
	};

	module.exports.removePermisoJerarquia = function(req, res) {

		if (typeof req.params.idjerarquia === 'string' && parseInt(req.params.idjerarquia, 10) > 0){
			const idjerarquia = parseInt(req.params.idjerarquia, 10);
			if (typeof req.params.idpermiso === 'string' && req.params.idpermiso !== ''){
				const models = req.metaenvironment.models,
					recalculate = req.metaenvironment.recalculate,
					permisomodel = models.permiso();

				const idpermiso = req.params.idpermiso;
				const jerarquiaspermitidas = req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura);

				if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && jerarquiaspermitidas.indexOf(idjerarquia) >= 0)){
					permisomodel.find({'_id': models.objectId(idpermiso)}).exec().then(function(permiso){
						if (permiso){
							const indexR = permiso.jerarquiadirectalectura.indexOf(idjerarquia);
							const indexW = permiso.jerarquiadirectaescritura.indexOf(idjerarquia);

							if (indexR !== -1){
								permiso.jerarquiadirectalectura.splice(indexR, 1);
							}
							if (indexW !== -1){
								permiso.jerarquiadirectaescritura.splice(indexW, 1);
							}

							recalculate.softCalculatePermiso(models, permiso).then(function(permi){
								if (permi.jerarquiadirectalectura.length === 0 && (typeof permi.procedimientosdirectalectura === 'undefined' || permi.procedimientosdirectalectura.length === 0)){
									permisomodel.remove({'_id': models.objectId(idpermiso)}, req.eh.cbWithDefaultValue(res, {}));
								} else {
									permi.save(req.eh.cbWithDefaultValue(res, permi));
								}
							}, req.eh.errorHelper(res));
						} else {
							req.eh.notFoundHelper(res);
						}
					}, req.eh.errorHelper(res));
				} else {
					req.eh.unauthorizedHelper(res);
				}
			} else {
				req.eh.missingParameterHelper(res, 'idpermiso');
			}
		} else {
			req.eh.missingParameterHelper(res, 'idjerarquia');
		}
	};


	/**
	* Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía
	* indicado o sobre alguno de sus descendientes (si el parámetro de petición "recursivo" es 1),
	* así como los permisos directos sobre los procedimientos que cuelgan de tales jerarquías
	*/
	module.exports.permisosList = function(req, res){
		const models = req.metaenvironment.models;
		const permisomodel = models.permiso();
		const jerarquiamodel = models.jerarquia();
		const procedimientomodel = models.procedimiento();
		const dpermisos = Q.defer();
		const recursivo = (typeof req.params.recursivo === 'string' && parseInt(req.params.recursivo, 10) === 1);
		const heredado = (typeof req.params.recursivo === 'string' && parseInt(req.params.recursivo, 10) === 2);
		const jerarquiaspermitidas = req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura);

		if (typeof req.params.idjerarquia === 'string') {
			const idj = parseInt(req.params.idjerarquia, 10);

			if (isNaN(idj)){
				dpermisos.reject({'error': 'Error. Id jerarquía no válido'});

			} else if (jerarquiaspermitidas.indexOf(idj) < 0){
				dpermisos.reject({'error': 'Error. Id jerarquía no permitido'});

			} else if (heredado){
				permisomodel.find({'jerarquialectura': parseInt(req.params.idjerarquia, 10)}, function(err, permisos){
					if (err){
						dpermisos.reject(err);
					} else {
						dpermisos.resolve({'procedimientos': [], 'permisos': permisos, 'totallength': permisos.length});
					}
				});

			} else {
				// obtenemos todos los permisos otorgados sobre esta jerarquía y sus descendientes.
				jerarquiamodel.findOne({'id': idj}).exec().then(function(jerarquia){
					// configuramos una búsqueda de la jerarquía actual más los descendientes

					let jerarquiasBuscadas = recursivo ? jerarquia.descendientes : [];

					if (!Array.isArray(jerarquiasBuscadas)){
						jerarquiasBuscadas = [];
					}
					jerarquiasBuscadas.push(idj);


					const fields = {'cod_plaza': 1, 'codigo': 1, 'responsables': 1, 'idjerarquia': 1, 'denominacion': 1};
					procedimientomodel.find({'idjerarquia': {'$in': jerarquiasBuscadas}}, fields).exec().then(function(procedimientos){
						const idsprocedimientos = procedimientos.map(function(p){ return p.codigo; });
						
						const restriccion = {
							'$or': [
								{'jerarquiadirectalectura': {'$in': jerarquiasBuscadas}},
								{'procedimientosdirectalectura': {'$in': idsprocedimientos}}
							]
						};

						const respuesta = {'procedimientos': procedimientos};

						//console.log(JSON.stringify(restriccion));
						permisomodel.find(restriccion).sort({'codplaza': 1, 'login': 1}).exec().then(function(permisos){
							respuesta.permisos = permisos;
							respuesta.totallength = procedimientos.length + permisos.length;
							dpermisos.resolve(respuesta);
						}, dpermisos.reject);
					}, dpermisos.reject);
				}, dpermisos.reject);

			}

			dpermisos.promise.then(res.json, req.eh.errorHelper(res));

		} else {
			permisomodel.find({}, req.eh.cb(res));
		}
	};

	//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía indicado
	/* TODO: revisar el porqué no se usa */
	module.exports.permisosDirectosList = function(req, res){
		if (typeof req.params.idjerarquia === 'string' && !isNaN(parseInt(req.params.idjerarquia, 10))) {
			const permisomodel = req.metaenvironment.models.permiso();
			const idj = parseInt(req.params.idjerarquia, 10);
			const jerarquiaspermitidas = req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura);

			if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && jerarquiaspermitidas.indexOf(idj) >= 0)){
				permisomodel.find({'jerarquiadirectalectura': idj}, req.eh.cb(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'idjerarquia');
		}
	};

	/* Devuelve las instancias de permiso que tienen concedido permiso directo sobre la entidadobjeto indicada */
	module.exports.permisosDirectosEntidadObjetoList = function(req, res){
		if (typeof req.params.codigoentidadobjeto === 'string' && req.params.codigoentidadobjeto !== '') {
			const permisomodel = req.metaenvironment.models.permiso();
			const idp = req.params.codigoentidadobjeto;
			const eopermitidos = req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura);
			if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && eopermitidos.indexOf(idp) >= 0)){
				permisomodel.find({'entidadobjetodirectalectura': idp}, req.eh.cb(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'codigoentidadobjeto');
		}
	};

	/* Devuelve las instancias de permiso que tienen concedido permiso directo sobre el procedimiento indicado */
	module.exports.permisosDirectosProcedimientoList = function(req, res){
		if (typeof req.params.codigoprocedimiento === 'string' && req.params.codigoprocedimiento !== '') {
			const permisomodel = req.metaenvironment.models.permiso();
			const idp = req.params.codigoprocedimiento;
			const procedimientospermitidos = req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura);
			if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && procedimientospermitidos.indexOf(idp) >= 0)){
				permisomodel.find({'procedimientosdirectalectura': idp}, req.eh.cb(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'codigoprocedimiento');
		}
	};


	/* Devuelve las instancias de permiso que tienen concedido permiso sobre la entidadobjeto indicada */
	module.exports.permisosEntidadObjetoList = function(req, res){

		const permisomodel = req.metaenvironment.models.permiso();
		if (typeof req.params.codigoentidadobjeto === 'string' && req.params.codigoentidadobjeto !== '') {
			const idp = req.params.codigoentidadobjeto;
			const eopermitidos = req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura);

			if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && eopermitidos.indexOf(idp) >= 0)){
				permisomodel.find({'entidadobjetolectura': idp}, req.eh.cb(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'codigoentidadobjeto');
		}
	};

	//// Devuelve las instancias de permiso que tienen concedido permiso sobre el procedimiento indicado
	module.exports.permisosProcedimientoList = function(req, res){
		const models = req.metaenvironment.models;
		const permisomodel = models.permiso();

		if (typeof req.params.codigoprocedimiento === 'string' && req.params.codigoprocedimiento !== '') {
			const idp = req.params.codigoprocedimiento;
			const procedimientospermitidos = req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura);
			if (req.user.permisoscalculados.superuser || (req.user.permisoscalculados.grantoption && procedimientospermitidos.indexOf(idp) >= 0)){
				permisomodel.find({'procedimientoslectura': idp}, req.eh.cb(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'permisosProcedimientoList');
		}
	};

	module.exports.update = function(req, res) {
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const models = req.metaenvironment.models,
				recalculate = req.metaenvironment.recalculate,
				permisomodel = models.permiso(),
				newpermiso = req.body;

			permisomodel.findOne({'_id': models.objectId(req.params.id)}, function(err, permiso){
				if (err){
					req.eh.callbackErrorHelper(res, err);
				} else if (permiso){
					permiso.codplaza = newpermiso.codplaza;
					permiso.descripcion = newpermiso.descripcion;
					permiso.jerarquiaescritura = newpermiso.jerarquiaescritura;
					permiso.jerarquialectura = newpermiso.jerarquialectura;
					permiso.jerarquiadirectaescritura = newpermiso.jerarquiadirectaescritura;
					permiso.jerarquiadirectalectura = newpermiso.jerarquiadirectalectura;
					permiso.procedimientoslectura = newpermiso.procedimientoslectura;
					permiso.procedimientosescritura = newpermiso.procedimientosescritura;
					permiso.procedimientosdirectalectura = newpermiso.procedimientosdirectalectura;
					permiso.procedimientosdirectaescritura = newpermiso.procedimientosdirectaescritura;
					permiso.login = newpermiso.login;
					permiso.caducidad = newpermiso.caducidad;
					permiso.grantoption = newpermiso.grantoption;
					if (req.user.permisos.superuser){
						permiso.superuser = newpermiso.superuser;
					}

					recalculate.softCalculatePermiso(models, permiso).then(function(p){
						p.save(req.eh.cb(res));
					}, req.eh.errorHelper(res));

				} else {
					req.eh.notFoundHelper(res);
				}
			});
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	function createPermission(req, res, permiso){
		const models = req.metaenvironment.models,
				recalculate = req.metaenvironment.recalculate;

		recalculate.softCalculatePermiso(models, permiso).then(function(permis){
			models.permiso().create(permis, req.eh.cbWithDefaultValue(permis));
		}, req.eh.errorHelper(res));
	}

	module.exports.create = function(req, res){
 
		const models = req.metaenvironment.models,
			personamodel = models.persona();
		const argPermiso = req.body;
		const permiso = {
			login: argPermiso.login,
			codplaza: argPermiso.codplaza,
			jerarquialectura: (typeof argPermiso.jerarquialectura === 'undefined' ? [] : argPermiso.jerarquialectura),
			jerarquiaescritura: (typeof argPermiso.jerarquiaescritura === 'undefined' ? [] : argPermiso.jerarquiaescritura),
			jerarquiadirectalectura: (typeof argPermiso.jerarquiadirectalectura === 'undefined' ? [] : argPermiso.jerarquiadirectalectura),
			jerarquiadirectaescritura: (typeof argPermiso.jerarquiadirectaescritura === 'undefined' ? [] : argPermiso.jerarquiadirectaescritura),
			procedimientoslectura: (typeof argPermiso.procedimientoslectura === 'undefined' ? [] : argPermiso.procedimientoslectura),
			procedimientosescritura: (typeof argPermiso.procedimientosescritura === 'undefined' ? [] : argPermiso.procedimientosescritura),
			procedimientosdirectalectura: (typeof argPermiso.procedimientosdirectalectura === 'undefined' ? [] : argPermiso.procedimientosdirectalectura),
			procedimientosdirectaescritura: (typeof argPermiso.procedimientosdirectaescritura === 'undefined' ? [] : argPermiso.procedimientosdirectaescritura),
			entidadobjetolectura: (typeof argPermiso.entidadobjetolectura === 'undefined' ? [] : argPermiso.entidadobjetolectura),
			entidadobjetoescritura: (typeof argPermiso.entidadobjetoescritura === 'undefined' ? [] : argPermiso.entidadobjetoescritura),
			entidadobjetodirectalectura: (typeof argPermiso.entidadobjetodirectalectura === 'undefined' ? [] : argPermiso.entidadobjetodirectalectura),
			entidadobjetodirectaescritura: (typeof argPermiso.entidadobjetodirectaescritura === 'undefined' ? [] : argPermiso.entidadobjetodirectaescritura),
			caducidad: req.user.permisoscalculados.caducidad,
			descripcion: 'Permisos concedidos por ' + req.user.login,
			grantoption: Boolean(argPermiso.grantoption),
			superuser: argPermiso.superuser ? 1 : 0,
			cod_plaza_grantt: req.user.login
		};

		var restriccion = {};
		if (permiso.codplaza) {
			restriccion.codplaza = permiso.codplaza;
		} else {
			restriccion.login = permiso.login;
		}

		personamodel.findOne(restriccion).then(function(persona){
			if (!persona){
				req.eh.notFoundHelper(res);

				return;
			}
			
			if (persona.habilitado){
				createPermission(req, res, permiso);
				
				
			} else {
				persona.habilitado = true;
				personamodel.update({'_id': models.objectId(persona._id)}, {$set: {habilitado: true}}, {'upsert': false, 'multi': false}).exec().then(function(){
					createPermission(req, res, permiso);
				}, req.eh.errorHelper(res));
				
			}
		}, req.eh.errorHelper(res));
	};

	/* TODO: check for permissions, this is too naive */
	module.exports.get = function(req, res) {
		const models = req.metaenvironment.models;
		if (typeof req.params.id !== 'undefined' && req.params.id !== ''){
			const permisomodel = models.permiso();
			permisomodel.findOne({'_id': req.metaenvironment.models.objectId(req.params.id)}, req.eh.cb(res));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	/* TODO: check for permissions, this is too naive */
	module.exports.removePermiso = function(req, res) {
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const permisomodel = req.metaenvironment.models.permiso();
			permisomodel.remove({'_id': req.metaenvironment.models.objectId(req.params.id)}, req.eh.cb(res));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

})(module);
