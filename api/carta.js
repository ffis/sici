(function(module, logger){
	/** @module carta */
	'use strict';
	var Q = require('q'),
		Crawler = require('crawler'),
		Expression = require('./expression');

	function tokenizer(str){
		var parts = [];
		parts = str.replace('(', '|').replace(')', '|').replace('/', '|').replace('=', '|').split('|');
		parts = parts.map(function(a){
			return a.trim();
		}).map(function(string) {
			return string.charAt(0).toUpperCase() + string.slice(1);
		}).filter(function(a){
			return a !== '';
		});

		return parts;
	}
/*
	function capitalizeFirst(a){

		return a.charAt(0).toUpperCase() + a.slice(1);
	}
	*/
	function uncapitalizeFirst(a){

		return a.charAt(0).toLowerCase() + a.slice(1);
	}

	function trytoparseFormula(formula, indicadores){

		const partes = tokenizer(formula.human).map(function(a){ return a.trim(); }).filter(function(a){ return a !== ''; });
		const frasesAReemplazar = [];
		
		for (let i = 0, j = partes.length; i < j; i += 1){
			for (let k = 0, l = indicadores.length; k < l; k += 1){
				if (partes[i] === indicadores[k].nombre){
					frasesAReemplazar.push({
						search: partes[i],
						replace: '/indicador/' + indicadores[k]._id + '/valores/[anualidad]/[mes]'
					});
					break;
				} else if (partes[i].toLowerCase() === 'x 100'){
					frasesAReemplazar.push({
						search: partes[i],
						replace: '* 100'
					});
					break;
				} else if (partes[i].toLowerCase() === 'x100'){
					frasesAReemplazar.push({
						search: partes[i],
						replace: '* 100'
					});
					break;
				} else if (partes[i].toLowerCase() === ') x 100'){
					frasesAReemplazar.push({
						search: partes[i],
						replace: ') * 100'
					});
					break;
				}
			}
		}

		if (frasesAReemplazar.length > 0){
			const ultimoseparador = Math.max.apply(null, ['=', '≥', '≤', '&ge;', '&le;'].map(function(s){

				return formula.human.lastIndexOf(s);
			}) );
			if (ultimoseparador > 0){
				const e = [];
				let formulacomputer = formula.human.substr(0, ultimoseparador);
				let fallo = false;

				for (let i = 0, j = frasesAReemplazar.length; i < j; i += 1){
					if (formulacomputer.indexOf(frasesAReemplazar[i].search) > -1){
						formulacomputer = formulacomputer.replace(frasesAReemplazar[i].search, '@');
					} else if (formulacomputer.indexOf(uncapitalizeFirst(frasesAReemplazar[i].search) ) > -1){
						formulacomputer = formulacomputer.replace(uncapitalizeFirst(frasesAReemplazar[i].search), '@');
					} else {
						fallo = true;
					}
				}
				if (!fallo){
					const arr = formulacomputer.split('@');

					for (let i = 0, j = arr.length - 1; i < j; i += 1){
						e.push(arr[i]);
						if (frasesAReemplazar.length === 0){
							fallo = true;
							break;
						}
						const o = frasesAReemplazar.shift();
						e.push(o.replace);
					}
					e.push(arr[arr.length - 1]);
					if (!fallo){
						formula.computer = JSON.stringify(e.filter(function(str){
							return str.trim() !== '';
						}));
					}
				}
			}
		}

		return formula;
	}

	function saveVersion(models, indicador){
		const historicoindicadormodel = models.historicoindicador();
		const v = JSON.parse(JSON.stringify(indicador));
		Reflect.deleteProperty(v, '_id');

		return historicoindicadormodel.create(v);
	}

	module.exports.objetivosStats = function(req, res){
		const objetivomodel = req.metaenvironment.models.objetivo();
		const ag = [{$group: {'_id': '$carta', 'count': {'$sum': 1}, 'formulas': {'$addToSet': '$formulas.computer'}}}];
		objetivomodel.aggregate(ag).exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
	};

	module.exports.usosIndicadores = function(req, res){
		if (req.user.permisoscalculados.superuser) {
			const objetivomodel = req.metaenvironment.models.objetivo();
			objetivomodel.aggregate([
				{'$unwind': '$formulas'},
				{'$unwind': '$formulas.indicadores'},
				{'$group': {'_id': '$formulas.indicadores', 'count': {'$sum': 1}}}
			]).exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res, 'Only superuser is allowed');
		}
	};

	module.exports.indicador = function(req, res){
		const indicadormodel = req.metaenvironment.models.indicador();
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const id = req.params.id;
			const restriccion = {'_id': req.metaenvironment.models.objectId(id)};
			if (!req.user.permisoscalculados.superuser) {
				restriccion.$or = [
					{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura}},
					{'responsable': req.user.login}
				];
			}

			const query = indicadormodel.findOne(restriccion);
			if (typeof req.query.fields === 'string' && req.query.fields !== ''){
				query.select(req.query.fields);
			}
			query.exec().then(req.eh.okHelper(res), req.eh.errorHelper);
			
		} else {
			let restriccion = {};
			if (!req.user.permisoscalculados.superuser) {
				restriccion.$or = [
					{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura}},
					{'responsable': req.user.login}
				];
			}
			if (typeof req.query.idjerarquia === 'string' && req.query.idjerarquia !== ''){
				if (typeof restriccion.$or === 'object'){
					var restriccionesaux = {};
					restriccionesaux.$and = [
						restriccion,
						{'idjerarquia': parseInt(req.query.idjerarquia, 10)}
					];
					restriccion = restriccionesaux;
				} else {
					restriccion.idjerarquia = parseInt(req.query.idjerarquia, 10);
				}
			}

			const query = indicadormodel.find(restriccion);
			if (typeof req.query.fields === 'string' && req.query.fields !== ''){
				query.select(req.query.fields);
			}
			query.exec().then(req.eh.okHelper(res), req.eh.errorHelper);
		}
	};

	module.exports.removeindicador = function(req, res){
		const models = req.metaenvironment.models;
		const id = req.params.id;
		const content = req.body;

		if (!req.user.permisoscalculados.superuser){
			req.eh.unauthorizedHelper(res);

			return;
		}

		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const indicadormodel = models.indicador();
			const objetivomodel = models.objetivo();

			indicadormodel.findOne({'_id': models.objectId(id)}).exec().then(function(indicador){
				if (!indicador){
					req.eh.notFoundHelper(res);

					return;
				}
				objetivomodel.find({'formulas.indicadores': models.objectId(id)}).exec().then(function(objetivos){
					if (objetivos && objetivos.length > 0){
						const vinculos = objetivos.map(function(o){ return o.denominacion; }).join(' | ');
						res.status(403).json({'error': 'No se permite eliminar un indicador vinculado a un objetivo', 'details': vinculos});
					} else {
						indicadormodel.remove({'_id': models.objectId(id)}, req.eh.cbWithDefaultValue(res, content));
					}
				}, req.eh.errorHelper(res));
			}, req.eh.errorHelper(res));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	function recalculateIndicador(indicador, actualizacion){
		const acumuladorestratables = ['sum', 'mean', 'max', 'min'];

		for (const anualidad in indicador.observaciones){
			if (Array.isArray(indicador.observaciones[anualidad])){
				indicador.observaciones[anualidad] = indicador.observaciones[anualidad].map(function(observacion){ return typeof observacion === 'string' ? observacion.trim() : ''; });
			} else {
				indicador.observaciones[anualidad] = ['', '', '', '', '', '', '', '', '', '', '', ''];
			}

			if (Array.isArray(actualizacion.observaciones[anualidad])){
				indicador.observaciones[anualidad] = actualizacion.observaciones[anualidad].map(function(observacion){ return typeof observacion === 'string' ? observacion.trim() : ''; });
			}
		}

		for (const anualidad in indicador.valores){
			if (typeof indicador.valoresacumulados[anualidad] === 'undefined'){
				indicador.valoresacumulados[anualidad] = [null, null, null, null, null, null, null, null, null, null, null, null, null];
			}

			for (let i = 0, j = indicador.valores[anualidad].length; i < j - 1; i += 1){
				if (actualizacion.valores[anualidad][i] === null || actualizacion.valores[anualidad][i] === ''){
					indicador.valores[anualidad][i] = null;
				} else {
					indicador.valores[anualidad][i] = isNaN(actualizacion.valores[anualidad][i]) ? null : parseFloat(actualizacion.valores[anualidad][i], 10);
					indicador.valores[anualidad][i] = isNaN(indicador.valores[anualidad][i]) ? null : indicador.valores[anualidad][i];
				}
			}
		}

		if (acumuladorestratables.indexOf(indicador.acumulador) < 0){

			return;
		}


		if (indicador.acumulador === 'sum'){
			for (const attr in indicador.valores){
				let suma = 0, j = indicador.valores[attr].length;
				for (let i = 0; i < j - 1; i += 1){
					if (!isNaN(actualizacion.valores[attr][i])){
						suma += indicador.valores[attr][i];
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][j - 1] = suma;
				indicador.valoresacumulados[attr][j - 1] = suma;
			}
		} else if (indicador.acumulador === 'mean'){

			for (const attr in indicador.valores){
				let suma = 0;
				let nindicadoresdistintosde0 = 0;
				for (let i = 0, j = indicador.valores[attr].length; i < j - 1; i += 1){
					if (!isNaN(actualizacion.valores[attr][i])){
						suma += indicador.valores[attr][i];
						if (!actualizacion.valores[attr][i] !== null && !isNaN(actualizacion.valores[attr][i])){
							nindicadoresdistintosde0++;
						}
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][indicador.valores[attr].length - 1] = (nindicadoresdistintosde0 > 0) ? (suma / nindicadoresdistintosde0) : 0;
				indicador.valoresacumulados[attr][indicador.valores[attr].length - 1] = suma;
			}

		} else if (indicador.acumulador === 'max'){
			for (const attr in indicador.valores){
				let max = 0;
				let suma = 0;
				for (let i = 0, j = indicador.valores[attr].length; i < j - 1; i += 1){
					if (!isNaN(actualizacion.valores[attr][i])){
						max = (max < indicador.valores[attr][i]) ? indicador.valores[attr][i] : max;
						suma += indicador.valores[attr][i];
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][indicador.valores[attr].length - 1] = max;
				indicador.valoresacumulados[attr][indicador.valores[attr].length - 1] = suma;
			}
		} else if (indicador.acumulador === 'min'){
			for (const attr in indicador.valores){
				let min = false;
				let suma = 0;
				for (let i = 0, j = indicador.valores[attr].length; i < j - 1; i += 1){
					if (!isNaN(actualizacion.valores[attr][i])){
						if (indicador.valores[attr][i] !== 0 && (!min || min > indicador.valores[attr][i])){
							min = indicador.valores[attr][i];
						}
						suma += indicador.valores[attr][i];
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][indicador.valores[attr].length - 1] = min;
				indicador.valoresacumulados[attr][indicador.valores[attr].length - 1] = suma;
			}
		}
	}

	module.exports.actualizaindicador = function(req, res){
		const models = req.metaenvironment.models,
			indicadormodel = models.indicador();

		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const id = req.params.id,
				actualizacion = req.body;
			indicadormodel.findOne({'_id': models.objectId(id)}).lean().exec().then(function(indicador){

				if (indicador){
					const permiso = req.user.permisoscalculados.superuser || req.user.permisoscalculados.jerarquiaescritura.indexOf(indicador.idjerarquia) !== -1;
					if (permiso){
						saveVersion(models, indicador).then(function(){
							indicador.nombre = actualizacion.nombre;
							indicador.resturl = actualizacion.resturl;
							indicador.vinculacion = actualizacion.vinculacion;
							indicador.acumulador = actualizacion.acumulador;
							indicador.tipo = actualizacion.tipo;
							indicador.frecuencia = actualizacion.frecuencia;
							indicador.pendiente = actualizacion.pendiente;

							if (typeof indicador.valoresacumulados === 'undefined'){
								indicador.valoresacumulados = {
									'a2015': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
									'a2016': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
									'a2017': [null, null, null, null, null, null, null, null, null, null, null, null, null] /* 13 elementos */
								};
							}

							recalculateIndicador(indicador, actualizacion);
							indicador.fechaversion = new Date();

							indicadormodel.update({'_id': models.objectId(id)}, JSON.parse(JSON.stringify(indicador)), req.eh.cbWithDefaultValue(res, indicador));
						}, req.eh.errorHelper(res));

					} else {
						req.eh.unauthorizedHelper(res);
					}
				} else {
					req.eh.notFoundHelper(res);
				}
			}, req.eh.errorHelper(res));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};


	/**
	 * Actualización de objetivo. Helper expressjs. Realiza comprobación de permisos.
	 * @param {string} req - Expressjs request like.
	 * @param {string} res - Expressjs response like.
	 */
	module.exports.actualizaobjetivo = function(req, res){
		if (req.user.permisoscalculados.superuser){
			if (typeof req.params.id === 'string' && req.params.id.trim() !== ''){
				const models = req.metaenvironment.models;
				const objetivomodel = models.objetivo();
				objetivomodel.findOne({'_id': req.metaenvironment.models.objectId(req.params.id)}).exec().then(function(objetivo){
					if (objetivo){
						if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.entidadobjetoescritura.indexOf(String(objetivo.carta)) !== -1){
							for (const attr in req.body){
								//TODO: change this naive update method
								if (typeof objetivo[attr] !== 'undefined'){
									objetivo[attr] = req.body[attr];
								}
							}
							if (typeof req.body.denominacion === 'string'){
								objetivo.denominacion = req.body.denominacion.trim();
							}
							objetivo.save(req.eh.cbWithDefaultValue(res, objetivo));
							//objetivomodel.update({'_id': models.objectId(objetivo._id)}, objetivo, req.eh.cbWithDefaultValue(res, objetivo));
						} else {
							req.eh.unauthorizedHelper(res);
						}
					} else {
						req.eh.notFoundHelper(res);
					}
				}, req.eh.errorHelper(res));
			} else {
				req.eh.missingParameterHelper(res, 'id');
			}
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	function fnPostEvalFormula(promise, objetivo, idformula){
		return function(err, val){
			if (err){
				promise.reject(err);

				return;
			}
			//disponible objeto con las anualidades
			const valoressimplicado = {};
			for (const anualidad in val){
				if (typeof valoressimplicado[anualidad] === 'undefined'){
					valoressimplicado[anualidad] = [];
				}
				for (const m in val[anualidad]){
					valoressimplicado[anualidad].push(val[anualidad][m]);
				}
			}
			objetivo.formulas[idformula].valores = valoressimplicado;
			promise.resolve();
		};
	}

	module.exports.objetivo = function(req, res){
		const models = req.metaenvironment.models;
		const objetivomodel = req.metaenvironment.models.objetivo();
		const carta = req.query.carta;

		if (typeof req.params.id === 'string'){
			const restriccion = {'_id': models.objectId(req.params.id)};
			objetivomodel.findOne(restriccion).exec().then(function(objetivo){

				if (objetivo && typeof objetivo === 'object'){

					if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.entidadobjetolectura.indexOf(String(objetivo.carta)) > -1){

						const expresion = new Expression(models);
						const promises = [];
						
						if (!Array.isArray(objetivo.formulas)){
							objetivo.formulas = [];
						}
						for (let i = 0, j = objetivo.formulas.length; i < j; i += 1){
							if (objetivo.formulas[i].computer.trim() !== ''){
								const defer = Q.defer();
								expresion.evalFormula(objetivo.formulas[i].computer, fnPostEvalFormula(defer, objetivo, i));
								promises.push(defer.promise);
							}
						}
						Q.all(promises).then(function(){
							objetivo.save(req.eh.cbWithDefaultValue(res, objetivo));
							//objetivomodel.update({'_id': models.objectId(objetivo._id)}, JSON.parse(JSON.stringify(objetivo)), );
						}).fail(function(error){
							//fallo con la formula
							logger.error(error);
							res.json(objetivo);
						});
					} else {
						req.eh.unauthorizedHelper(res);
					}
				} else {
					req.eh.notFoundHelper(res);
				}
			}).fail(req.eh.errorHelper(res));

		} else if (typeof req.query.carta === 'undefined'){

			const restriccion = {};
			if (!req.user.permisoscalculados.superuser){
				restriccion.carta = {'$in': req.user.permisoscalculados.entidadobjetolectura};
			}

			const query = objetivomodel.find(restriccion);
			if (typeof req.query.fields !== 'undefined' && req.query.fields.trim() !== ''){
				query.select(req.query.fields);
			}

			query.lean().exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));

		} else if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.entidadobjetolectura.indexOf(carta) > -1){
			objetivomodel.find({'carta': models.objectId(carta)}).sort({'index': 1}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};


	function registerIndicador(idjerarquia, txt, indicadormodel, counterIndicador){
		const indicador = {
			'idjerarquia': idjerarquia,
			'id': counterIndicador,
			'nombre': txt,
			'resturl': '/indicador/' + counterIndicador,
			'valores': {
				'a2015': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2016': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2017': [null, null, null, null, null, null, null, null, null, null, null, null, null] /* 13 elementos */
			},
			'observaciones': {
				'a2015': ['', '', '', '', '', '', '', '', '', '', '', '', ''],
				'a2016': ['', '', '', '', '', '', '', '', '', '', '', '', ''],
				'a2017': ['', '', '', '', '', '', '', '', '', '', '', '', '']
			},
			'valoresacumulados': {
				'a2015': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2016': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2017': [null, null, null, null, null, null, null, null, null, null, null, null, null] /* 13 elementos */
			},
			'fechaversion': new Date(),
			'medidas': {},
			'vinculacion': null,
			'unidad': '',
			'frecuencia': 'mensual',
			'tipo': 'Servicio',
			'pendiente': false,
			'acumulador': 'sum'
		};

		return indicadormodel.create(indicador);
	}

	function extraeMeta(str){
		const ultimoseparador = Math.max.apply(null, ['=', '≥', '≤'].map(function(s){
			return str.lastIndexOf(s) + 1;
		}));

		return (ultimoseparador > 0) ? parseInt(str.substr(ultimoseparador), 10) : 100;
	}

	function extraeIntervalos(valormeta){
		if (valormeta > 0){
			return [
				{'min': 0, 'max': valormeta / 4, 'mensaje': 'Peligro', 'color': '#C50200', 'alerta': 4},
				{'min': valormeta / 4, 'max': valormeta / 2, 'mensaje': 'Aviso', 'color': '#FF7700', 'alerta': 3},
				{'min': valormeta / 2, 'max': (valormeta / 4) + (valormeta / 2), 'mensaje': 'Normal', 'color': '#FDC702', 'alerta': 2},
				{'min': (valormeta / 4) + (valormeta / 2), 'max': valormeta, 'mensaje': 'Éxito', 'color': '#C6E497', 'alerta': 1},
				{'min': valormeta, 'max': valormeta < 1, 'mensaje': 'Superado éxito', 'color': '#8DCA2F', 'alerta': 0}
			];
		}

		return [];
	}

	function extractCompromisos($html, $, cartaid){
		const response = [];
		let encontrado = false;
		let contador = '1';
		let enunciado = '';
		let formulas = [];
		for (var i = 0, j = $html.length; i < j; i += 1){
			const $descripcion = $($html[i]);
			const detalle = $descripcion.text().trim();
			if (detalle.indexOf('COMPROMISOS DE CALIDAD E INDICADORES') >= 0){
				encontrado = true;
			} else if (encontrado && detalle.indexOf('DERECHOS DE LOS CIUDADANOS') >= 0){
				encontrado = false;
				if (enunciado !== '' && formulas.length > 0){
					response.push({
						'denominacion': enunciado.replace(String(contador), ''),
						'formulas': formulas,
						'carta': cartaid,
						'index': contador,
						'estado': 'Publicado',
						'objetivoestrategico': 1,
						'procedimientos': []
					});
					contador = String(parseInt(contador, 10) + 1);
					enunciado = detalle;
					formulas = [];
				}
			} else if (encontrado){
				if (detalle.indexOf(contador) === 0){
					enunciado = detalle;
					formulas = [];
				} else if (detalle.indexOf(String(parseInt(contador, 10) + 1)) === 0){
					if (formulas.length > 0){
						response.push({
							'denominacion': enunciado.replace(String(contador), ''),
							'formulas': formulas,
							'carta': cartaid,
							'index': contador,
							'estado': 'Publicado',
							'objetivoestrategico': 1,
							'procedimientos': []
						});
					}
					contador = String(parseInt(contador, 10) + 1);
					enunciado = detalle;
					formulas = [];
				} else if (detalle !== ''){
					const meta = extraeMeta(detalle);
					const intervalos = extraeIntervalos(meta);
					const formula = {
						'human': detalle,
						'computer': '',
						'frecuencia': 'mensual',
						'indicadores': [],
						'meta': meta,
						'direccion': '',
						'intervalos': intervalos,
						'valores': {
							'a2015': [
								{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
								{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}],
							'a2016': [
								{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
								{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}],
							'a2017': [
								{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
								{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}]
						}
					};
					formulas.push(formula);
				}
			}
		}

		return response;
	}

	function cbDownloadCarta(df, cartaid) {
		return function(error, result, jQuery) {
			if (error){
				df.reject({error: 'cb', e: error});

				return;
			}
			let compromisos = extractCompromisos(jQuery('.contenido em,.contenido h3,.contenido h4'), jQuery, cartaid);
			if (compromisos.length === 0){
				compromisos = extractCompromisos(jQuery('.contenido p,.contenido h3,.contenido h4'), jQuery, cartaid);
			}
			if (compromisos.length === 0){
				df.reject('No se han extraido compromisos');
			}
			df.resolve(compromisos);
		};
	}

	function downloadCarta(carta, settings){
		const deferred = Q.defer();
		if (!carta || !carta.url || carta.url.trim() === ''){
			deferred.reject({error: 'Cannot download carta ' + carta.denominacion + ' because is not available'});

			return deferred.promise;
		}
		
		const settCraw = {'maxConnections': 10, 'callback': cbDownloadCarta(deferred, carta._id), 'userAgent': settings.userAgent};
		const c = new Crawler(settCraw);
		c.queue(carta.url);

		return deferred.promise;
	}
	
	function registerAndSetIndicador(idjerarquia, txt, indicadormodel, cb){
		const defer = Q.defer();
		registerIndicador(idjerarquia, txt, indicadormodel, 1).then(function(indicador){
			cb(indicador);
			defer.resolve(indicador);
		}, defer.reject);

		return defer.promise;
	}

	function newIndicador(req, res){
		if (typeof req.user === 'object' && typeof req.user.permisoscalculados === 'object' && req.user.permisoscalculados.superuser){
			if (req.body && req.body.idjerarquia){
				const txt = req.body.nombre;
				const idjerarquia = parseInt(req.body.idjerarquia, 10);
				const indicadormodel = req.metaenvironment.models.indicador();
				registerIndicador(idjerarquia, txt, indicadormodel, 1).then(req.eh.okHelper(res), req.eh.errorHelper(res));
			} else {
				req.eh.missingParameterHelper(res, 'idjerarquia');
			}
		} else {
			req.eh.unauthorizedHelper(res);
		}
	}

	function cbSetIndicador(objetivos, idobjetivo, idformula, ordenindicador){

		return function(indicador){
			objetivos[idobjetivo].formulas[idformula].indicadores[ordenindicador] = indicador._id;
		};
	}

	function cbMap(formula){

		return function(s){

			return formula.lastIndexOf(s);
		};
	}

	function extractAndSaveIndicadores(idjerarquia, objetivos, indicadormodel){
		const defer = Q.defer();
		const promises = [];

		for (let i = 0, j = objetivos.length; i < j; i += 1){
			for (let k = 0, l = objetivos[i].formulas.length; k < l; k += 1){
				let formula = objetivos[i].formulas[k].human;

				const ultimoseparador = Math.max.apply(null, ['=', '≥', '≤', '&ge;', '&le;'].map(cbMap(formula)));
				if (ultimoseparador > 0){
					formula = formula.substr(0, ultimoseparador);
				}
				const partes = tokenizer(formula);
				let orden = 0;

				for (let n = 0, m = partes.length; n < m; n += 1){
					const parte = partes[n].trim();
					if (parte === ''){
						continue;
					}
					if (parte[0] >= '0' && parte[0] <= '9' ){
						continue;
					}
					if (parte[0] === '='){
						continue;
					}
					if (parte.indexOf('100') < 0){
						promises.push(registerAndSetIndicador(idjerarquia, parte, indicadormodel, cbSetIndicador(objetivos, i, k, orden)));
						orden += 1;
					}
				}
			}
		}
		Q.all(promises).then(function(indicadoresobtenidos){
			defer.resolve({objetivos: objetivos, indicadoresobtenidos: indicadoresobtenidos});
		}, defer.reject);

		return defer.promise;
	}

	module.exports.updateFormula = function(req, res){
		const idobjetivo = req.body.idobjetivo,
			models = req.metaenvironment.models,
			objetivomodel = models.objetivo();

		if (typeof idobjetivo === 'undefined' || idobjetivo === ''){
			req.eh.missingParameterHelper(res, 'idobjetivo');

			return;
		}

		if (typeof req.body.indiceformula === 'undefined' || isNaN(parseInt(req.body.indiceformula, 10))){
			req.eh.missingParameterHelper(res, 'indiceformula');

			return;
		}

		if (typeof req.body.formula === 'undefined'){
			req.eh.missingParameterHelper(res, 'formula');

			return;
		}

		const indiceformula = parseInt(req.body.indiceformula, 10);
		const formula = req.body.formula;
	
		objetivomodel.findOne({'_id': models.objectId(idobjetivo)}, {}).exec().then(function(objetivo){
			if (objetivo){
				if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.entidadobjetoescritura.indexOf(String(objetivo.carta))){
					if (typeof objetivo.formulas[indiceformula] === 'object'){
						objetivo.formulas[indiceformula].computer = formula;
						objetivo.markModified('formulas');
						objetivo.save(req.eh.cbWithDefaultValue(res, objetivo));
					} else {
						req.eh.notFoundHelper(res);
					}
				} else {
					req.eh.unauthorizedHelper(res);
				}
			} else {
				req.eh.notFoundHelper(res);
			}
		}, req.eh.errorHelper(res));
	};

	module.exports.dropCarta = function(req, res){
		const id = req.params.id,
			models = req.metaenvironment.models,
			indicadormodel = models.indicador(),
			objetivomodel = models.objetivo(),
			entidadobjetomodel = models.entidadobjeto();

		if (typeof id === 'string' && id.trim() !== ''){
			if (req.user.permisoscalculados.superuser){
				entidadobjetomodel.findOne({'_id': models.objectId(req.params.id)}).exec().then(function(carta){
					if (carta){
						const defer = Q.defer(),
							defer2 = Q.defer();

						indicadormodel.remove({'idjerarquia': carta.idjerarquia}, defer.makeNodeResolver());
						objetivomodel.remove({'carta': carta._id}, defer2.makeNodeResolver());
						Q.all([defer, defer2]).then(function(){ res.json('OK');	}, req.eh.errorHelper(res));
					} else {
						req.eh.notFoundHelper(res);
					}
				}, req.eh.errorHelper(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.testDownloadCarta = function(req, res){
		if (req.user.permisoscalculados.superuser){
			const models = req.metaenvironment.models,
				entidadobjeto = models.entidadobjeto(),
				indicadormodel = models.indicador(),
				objetivomodel = models.objetivo(),
				id = req.params.id,
				settings = req.metaenvironment.settings;

			if (typeof id === 'string' && id !== ''){
				entidadobjeto.findOne({'_id': models.objectId(id)}).exec().then(function(data){
					if (data){
						downloadCarta(data, settings).then(function(objetivos){
							if (objetivos.length === 0){
								res.status(500).json({'error': 'Empty page'});
							} else {
								extractAndSaveIndicadores(data.idjerarquia, objetivos, indicadormodel).then(function(objetivosConIndicadores){
									const objetivosAAlmacenar = objetivosConIndicadores.objetivos;
									const saving = [];
									for (let i = 0, j = objetivosAAlmacenar.length; i < j; i += 1){
										for (let k = 0, l = objetivosAAlmacenar[i].formulas.length; k < l; k += 1){
											objetivosAAlmacenar[i].formulas[k] = trytoparseFormula(objetivosAAlmacenar[i].formulas[k], objetivosConIndicadores.indicadoresobtenidos);
										}
										saving.push(objetivomodel.create(objetivosAAlmacenar[i]));
									}
									Q.all(saving).then(function(){
										res.json(objetivosConIndicadores);
									}, req.eh.errorHelper(res));
								}, req.eh.errorHelper(res));
							}
						}, req.eh.errorHelper(res));
					} else {
						req.eh.notFoundHelper(res);
					}
				}).fail(req.eh.errorHelper(res));
			} else {
				req.eh.missingParameterHelper(res, 'id');
			}
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.newFormula = function(req, res){
		if (req.user.permisoscalculados.superuser){
			if (typeof req.params.id === 'string' && req.params.id.trim() !== ''){
				const models = req.metaenvironment.models,
					objetivomodel = models.objetivo();

				objetivomodel.findOne({'_id': models.objectId(req.params.id)}).exec().then(function(objetivo){
					if (typeof objetivo === 'object'){
						const meta = extraeMeta('');
						const intervalos = extraeIntervalos(100);
						const formula = {
							'human': '',
							'computer': '',
							'frecuencia': 'mensual',
							'indicadores': [],
							'meta': meta,
							'direccion': '',
							'intervalos': intervalos,
							'valores': {
								'a2015': [
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}],
								'a2016': [
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}],
								'a2017': [
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}]
							}
						};

						objetivo.formulas.push(formula);
						objetivo.markModified('formulas');
						objetivo.save(req.eh.cbWithDefaultValue(res, objetivo));
					} else {
						req.eh.notFoundHelper(res);
					}
				}).fail(req.eh.errorHelper(res));

			} else {
				req.eh.missingParameterHelper(res, 'id');
			}
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.newObjetivo = function(req, res){
		if (req.user.permisoscalculados.superuser){
			if (typeof req.body.carta === 'string' && req.body.carta.trim() !== ''){
				const models = req.metaenvironment.models,
					entidadobjeto = models.entidadobjeto(),
					objetivomodel = models.objetivo();
				entidadobjeto.findOne({'_id': models.objectId(req.body.carta.trim())}).lean().exec().then(function(carta){
					if (typeof carta === 'object'){
						/* TODO: this is TOO naive */
						const compromiso = {
							'denominacion': req.body.denominacion.trim(),
							'formulas': [],
							'carta': models.objectId(req.body.carta.trim()),
							'index': parseInt(req.body.index, 10),
							'estado': 'Publicado',
							'objetivoestrategico': 1,
							'procedimientos': []
						};

						const meta = extraeMeta('');
						const intervalos = extraeIntervalos(100);
						const formula = {
							'human': '',
							'computer': '',
							'frecuencia': 'mensual',
							'indicadores': [],
							'meta': meta,
							'direccion': '',
							'intervalos': intervalos,
							'valores': {
								'a2015': [
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}],
								'a2016': [
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}],
								'a2017': [
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null},
									{'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}, {'formula': '', 'resultado': null}]
							}
						};

						compromiso.formulas.push(formula);

						objetivomodel.create(compromiso, req.eh.cbWithDefaultValue(res, compromiso));
					} else {
						req.eh.notFoundHelper(res);
					}

				}).fail(req.eh.errorHelper(res));

			}
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.statsCartas = function(req, res){
		req.eh.notImplementedHelper(res);
		/*
		const models = req.metaenvironment.models,
			entidadobjeto = models.entidadobjeto(),
			indicadormodel = models.indicador(),
			objetivomodel = models.objetivo();

		//indicadormodel.aggregate([{'$group': { '_id': "$idjerarquia", count: }}])

		req.eh.notFoundHelper(res);
		*/
	};

	module.exports.downloadCarta = downloadCarta;
	module.exports.extractAndSaveIndicadores = extractAndSaveIndicadores;
	module.exports.newIndicador = newIndicador;
	module.exports.recalculateIndicador = recalculateIndicador;
	module.exports.saveVersion = saveVersion;

})(module, console);
