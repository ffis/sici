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

		var partes = tokenizer(formula.human).map(function(a){ return a.trim(); }).filter(function(a){ return a !== ''; });
		var frasesAReemplazar = [];
		var i = 0, j = 0;
		for (i = 0, j = partes.length; i < j; i++){
			for (var k = 0, l = indicadores.length; k < l; k++){
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
			var ultimoseparador = Math.max.apply(null, ['=', '≥', '≤', '&ge;', '&le;'].map(function(s){

				return formula.human.lastIndexOf(s);
			}) );
			if (ultimoseparador > 0){
				var formulacomputer = formula.human.substr(0, ultimoseparador);
				var e = [], fallo = false;

				for (i = 0, j = frasesAReemplazar.length; i < j; i++){
					if (formulacomputer.indexOf(frasesAReemplazar[i].search) > -1){
						formulacomputer = formulacomputer.replace(frasesAReemplazar[i].search, '@');
					} else if (formulacomputer.indexOf(uncapitalizeFirst(frasesAReemplazar[i].search) ) > -1){
						formulacomputer = formulacomputer.replace(uncapitalizeFirst(frasesAReemplazar[i].search), '@');
					} else {
						fallo = true;
					}
				}
				if (!fallo){
					var arr = formulacomputer.split('@');

					for (i = 0, j = arr.length - 1; i < j; i++){
						e.push(arr[i]);
						if (frasesAReemplazar.length === 0){
							fallo = true;
							break;
						}
						var o = frasesAReemplazar.shift();
						e.push(o.replace);
					}
					e.push(arr[ arr.length - 1]);
					if (!fallo){
						e = e.filter(function(str){
							return str.trim() !== '';
						});
						formula.computer = JSON.stringify(e);
					}
				}
			}
		}

		return formula;
	}

	function saveVersion(models, indicador){
		const Historico = models.historicoindicador();
		const v = JSON.parse(JSON.stringify(indicador));
		delete v._id;
		const version = new Historico(v);

		return version.save();
	}

	module.exports.objetivosStats = function(req, res){
		const objetivomodel = req.metaenvironment.models.objetivo();
		const ag = [{$group: {_id: '$carta', count: {$sum: 1}, formulas: {$addToSet: '$formulas.computer'}}}];
		objetivomodel.aggregate(ag).exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
	};

	module.exports.usosIndicadores = function(req, res){
		if (req.user.permisoscalculados.superuser) {
			const objetivomodel = req.metaenvironment.models.objetivo();
			objetivomodel.aggregate([
				{$unwind: '$formulas'},
				{$unwind: '$formulas.indicadores'},
				{$group: {_id: '$formulas.indicadores', count: {$sum: 1}}}
			]).exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res, 'Only superuser is allowed');
		}
	};

	module.exports.indicador = function(req, res){
		const indicadormodel = req.metaenvironment.models.indicador();
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const id = req.params.id;
			const restriccion = { _id: req.metaenvironment.models.objectId(id) };
			if (!req.user.permisoscalculados.superuser) {
				restriccion['$or'] = [
					{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquiaescritura.concat(req.user.permisoscalculados.jerarquialectura)}},
					{'responsable': req.user.login}
				];
			}
			indicadormodel.findOne(restriccion, req.eh.cb(res));
		} else {
			let restriccion = {};
			if (!req.user.permisoscalculados.superuser) {
				restriccion['$or'] = [
					{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquiaescritura.concat(req.user.permisoscalculados.jerarquialectura)}},
					{'responsable': req.user.login}
				];
			}
			if (typeof req.query.idjerarquia !== 'undefined'){
				if (typeof restriccion['$or'] !== 'undefined'){
					var restriccionesaux = {};
					restriccionesaux['$and'] = [
						restriccion,
						{'idjerarquia': parseInt(req.query.idjerarquia, 10)}
					];
					restriccion = restriccionesaux;
				} else {
					restriccion.idjerarquia = parseInt(req.query.idjerarquia, 10);
				}
			}
			indicadormodel.find(restriccion, req.eh.cb(res));
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

		if (typeof req.params.id === 'string'){
			const indicadormodel = models.indicador();
			const objetivomodel = models.objetivo();

			indicadormodel.findOne({_id: models.objectId(id)}).exec().then(function(indicador){
				objetivomodel.find({'formulas.indicadores': models.objectId(id)}).exec().then(function(objetivos){
					if (objetivos && objetivos.length > 0){
						const vinculos = objetivos.map(function(o){ return o.denominacion; }).join(' | ');
						res.status(403).json({'error': 'No se permite eliminar un indicador vinculado a un objetivo', details: vinculos});
					} else {
						indicadormodel.remove({'_id': models.ObjectId(id)}, req.eh.cbWithDefaultValue(res, content));
					}
				}, req.eh.errorHelper(res));
			}, req.eh.errorHelper(res));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	function recalculateIndicador(indicador, actualizacion){
		if (indicador.acumulador === 'sum'){
			for (const attr in indicador.valores){
				let suma = 0;

				if (typeof indicador.valoresacumulados[attr] === 'undefined'){
					indicador.valoresacumulados[attr] = [null, null, null, null, null, null, null, null, null, null, null, null, null];
				}
				for (let i = 0, j = indicador.valores[attr].length; i < j - 1; i += 1){
					if (actualizacion.valores[attr][i] === null || actualizacion.valores[attr][i] === ''){
						indicador.valores[attr][i] = null;
					} else {
						indicador.valores[attr][i] = isNaN(actualizacion.valores[attr][i]) ? 0 : parseFloat(actualizacion.valores[attr][i], 10);
						suma += indicador.valores[attr][i];
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][indicador.valores[attr].length - 1] = suma;
				indicador.valoresacumulados[attr][indicador.valores[attr].length - 1] = suma;
			}
		} else if (indicador.acumulador === 'mean'){
			for (const attr in indicador.valores){
				let suma = 0;
				let nindicadoresdistintosde0 = 0;
				if (typeof indicador.valoresacumulados[attr] === 'undefined'){
					indicador.valoresacumulados[attr] = [null, null, null, null, null, null, null, null, null, null, null, null, null];
				}
				for (let i = 0, j = indicador.valores[attr].length; i < j - 1; i += 1){
					if (actualizacion.valores[attr][i] === null || actualizacion.valores[attr][i] === ''){
						indicador.valores[attr][i] = null;
					} else {
						indicador.valores[attr][i] = isNaN(actualizacion.valores[attr][i]) ? 0 : parseFloat(actualizacion.valores[attr][i], 10);
						suma += indicador.valores[attr][i];
						if (!actualizacion.valores[attr][i] !== null && !isNaN(actualizacion.valores[attr][i]) && parseInt(actualizacion.valores[attr][i], 10) !== 0 ){
							nindicadoresdistintosde0++;
						}
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][indicador.valores[attr].length - 1] = (nindicadoresdistintosde0 > 0) ? suma / nindicadoresdistintosde0 : 0;
				indicador.valoresacumulados[attr][ indicador.valores[attr].length - 1 ] = suma;
			}
		} else if (indicador.acumulador === 'max'){
			for (const attr in indicador.valores){
				let max = 0;
				let suma = 0;
				if (typeof indicador.valoresacumulados[attr] === 'undefined'){
					indicador.valoresacumulados[attr] = [null, null, null, null, null, null, null, null, null, null, null, null, null];
				}
				for (let i = 0, j = indicador.valores[attr].length; i < j - 1; i += 1){
					if (actualizacion.valores[attr][i] === null || actualizacion.valores[attr][i] === ''){
						indicador.valores[attr][i] = null;
					} else {
						indicador.valores[attr][i] = actualizacion.valores[attr][i] === null || isNaN(actualizacion.valores[attr][i]) ? 0 : parseFloat(actualizacion.valores[attr][i]);
						max = (max < indicador.valores[attr][i]) ? indicador.valores[attr][i] : max;
						suma += indicador.valores[attr][i];
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][indicador.valores[attr].length - 1] = max;
				indicador.valoresacumulados[attr][ indicador.valores[attr].length - 1 ] = suma;
			}
		} else if (indicador.acumulador === 'min'){
			for (const attr in indicador.valores){
				let min = false;
				let suma = 0;
				if (typeof indicador.valoresacumulados[attr] === 'undefined'){
					indicador.valoresacumulados[attr] = [null, null, null, null, null, null, null, null, null, null, null, null, null];
				}
				for (let i = 0, j = indicador.valores[attr].length; i < j - 1; i += 1){
					if (actualizacion.valores[attr][i] === null || actualizacion.valores[attr][i] === ''){
						indicador.valores[attr][i] = null;
					} else {
						indicador.valores[attr][i] = actualizacion.valores[attr][i] === null || isNaN(actualizacion.valores[attr][i]) ? 0 : parseFloat(actualizacion.valores[attr][i]);
						if (indicador.valores[attr][i] !== 0 && (!min || min > indicador.valores[attr][i])){
							min = indicador.valores[attr][i];
						}
						suma += indicador.valores[attr][i];
					}
					indicador.valoresacumulados[attr][i] = suma;
				}
				indicador.valores[attr][indicador.valores[attr].length - 1] = min;
				indicador.valoresacumulados[attr][ indicador.valores[attr].length - 1 ] = suma;
			}
		}
		for (const attr in indicador.observaciones){
			for (let i = 0, j = indicador.observaciones[attr].length; i < j; i += 1){
				indicador.observaciones[attr][i] = actualizacion.observaciones[attr][i].trim();
			}
		}
	}

	module.exports.actualizaindicador = function(req, res){
		const models = req.metaenvironment.models,
			indicadormodel = models.indicador();

		if (typeof req.params.id !== 'string'){
			const id = req.params.id,
				actualizacion = req.body;

			indicadormodel.findOne({_id: models.objectId(id)}).exec().then(function(indicador){
				if (indicador) {
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
							indicador.markModified('valores');
							indicador.markModified('valoresacumulados');
							indicador.markModified('observaciones');
							indicador.markModified('medidas');
							indicador.fechaversion = new Date();

							indicador.save(req.eh.cb(res));
						}, req.eh.errorHelper(res));

					} else {
						req.eh.unauthorizedHelper(res);
					}
				} else {
					req.eh.notFoundHelper(res);
				}
			}, req.eh.errorHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};


	/**
	 * Actualización de objetivo. Helper expressjs. Realiza comprobación de permisos.
	 * @param {string} id - Identificador del registro mongodb.
	 */
	module.exports.actualizaobjetivo = function(req, res){
		if (typeof req.params.id !== 'undefined'){
			const objetivomodel = req.metaenvironment.models.objetivo();
			objetivomodel.findOne({ '_id': req.metaenvironment.models.objectId(req.params.id)}).exec().then(function(objetivo){
				if (objetivo){
					if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.entidadobjetoescritura.indexOf('' + objetivo.carta) !== -1){
						for (const attr in req.body){
							//TODO: change this naive update method
							if (typeof objetivo[attr] !== 'undefined'){
								objetivo[attr] = req.body[attr];
							}
						}
						objetivomodel.update({ _id: objetivo._id}, objetivo, req.eh.cbWithDefaultValue(res, objetivo));
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

	module.exports.objetivo = function(req, res){
		const models = req.metaenvironment.models;
		const objetivomodel = req.metaenvironment.models.objetivo();
		const carta = req.query.carta;

		if (typeof req.params.id !== 'undefined'){
			const restriccion = { '_id': models.ObjectId(req.params.id) };
			objetivomodel.findOne(restriccion).exec().then(function(objetivo){

				if (!(req.user.permisoscalculados.superuser || req.user.permisoscalculados.entidadobjetoescritura.indexOf('' + objetivo.carta) !== -1)){
					req.eh.unauthorizedHelper(res);

					return;
				}
				if (!objetivo){ res.json(objetivo); return; }
				var expresion = new Expression(models);
				var promises = [];
				var fn = function(promise, idformula){
					return function(err, val){
						//logger.log(250, err, val);
						if (err){
							promise.reject(err);
							return;
						}
						//disponible objeto con las anualidades
						var valoressimplicado = {};
						for (var anualidad in val){
							if (typeof valoressimplicado[anualidad] === 'undefined'){
								valoressimplicado[anualidad] = [];
							}
							for (var m in val[anualidad]){
								valoressimplicado[anualidad].push(val[anualidad][m]);
							}
						}
						objetivo.formulas[idformula].valores = valoressimplicado;
						objetivo.markModified('formulas');
						promise.resolve();
					};
				};
				for (var i = 0, j = objetivo.formulas.length; i < j; i++){
					if (objetivo.formulas[i].computer !== ''){
						var defer = Q.defer();
						expresion.evalFormula(objetivo.formulas[i].computer, fn(defer, i));
						promises.push(defer.promise);
					}
				}
				Q.all(promises).then(function(){
					//logger.log('calculo OK', objetivo);

					objetivomodel.update({ _id: objetivo._id }, objetivo, function (err){
						if (err){
							logger.error(err);
							res.status(500).json({'error': 'An error has occurred', details: err });
						} else {
							res.json(objetivo);
						}
					});
				}, function(error){
					//fallo con la formula
					logger.error(error);
					res.json(objetivo);
					//res.status(500).json({'error': 'An error has occurred', details: error });
				});
			}, req.eh.errorHelper(res));

			return;
		} else if (typeof req.query.carta === 'undefined'){
			req.eh.missingParameterHelper(res, 'carta');

			return;
		}

		objetivomodel.find({ 'carta': models.objectId(carta)}).sort({'index': 1}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
	};


	function registerIndicador(idjerarquia, txt, indicadormodel, counterIndicador){
		const defer = Q.defer();
		const indicador = {
			idjerarquia: idjerarquia,
			id: counterIndicador,
			nombre: txt,
			resturl: '/indicador/' + counterIndicador,
			valores: {
				'a2015': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2016': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2017': [null, null, null, null, null, null, null, null, null, null, null, null, null] /* 13 elementos */
			},
			observaciones: {
				'a2015': ['', '', '', '', '', '', '', '', '', '', '', '', ''],
				'a2016': ['', '', '', '', '', '', '', '', '', '', '', '', ''],
				'a2017': ['', '', '', '', '', '', '', '', '', '', '', '', '']
			},
			valoresacumulados: {
				'a2015': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2016': [null, null, null, null, null, null, null, null, null, null, null, null, null], /* 13 elementos */
				'a2017': [null, null, null, null, null, null, null, null, null, null, null, null, null] /* 13 elementos */
			},
			fechaversion: new Date(),
			medidas: {},
			vinculacion: null,
			unidad: null,
			frecuencia: 'mensual',
			tipo: 'Servicio',
			pendiente: false,
			acumulador: 'sum'
		};
		new indicadormodel(indicador).save(defer.makeNodeResolver());

		return defer.promise;
	}

	function extraeMeta(str){
		const ultimoseparador = Math.max.apply(null, ['=', '≥', '≤'].map(function(s){
			return str.lastIndexOf(s) + 1;
		}));
		if (ultimoseparador > 0){
			return parseInt(str.substr(ultimoseparador), 10);
		}
		return 100;
	}

	function extraeIntervalos(valormeta){
		const intervaloscalculados = [];
		if (valormeta > 0){
			intervaloscalculados = [
				{'min': 0, 'max': valormeta / 4, 'mensaje': 'Peligro', 'color': '#C50200', 'alerta': 4},
				{'min': valormeta / 4, 'max': valormeta / 2, 'mensaje': 'Aviso', 'color': '#FF7700', 'alerta': 3},
				{'min': valormeta / 2, 'max': (valormeta / 4) + (valormeta / 2), 'mensaje': 'Normal', 'color': '#FDC702', 'alerta': 2},
				{'min': (valormeta / 4) + valormeta / 2, 'max': valormeta, 'mensaje': 'Éxito', 'color': '#C6E497', 'alerta': 1},
				{'min': valormeta, 'max': valormeta < 1, 'mensaje': 'Superado éxito', 'color': '#8DCA2F', 'alerta': 0}
			];
		}

		return intervaloscalculados;
	}

	function extractCompromisos($html, $, cartaid){
		const response = [];
		let encontrado = false;
		let contador = '1';
		let enunciado = '';
		let formulas = [];
		for (var i = 0, j = $html.length; i < j; i++){
			var $descripcion = $($html[i]);
			var detalle = $descripcion.text().trim();
			if (detalle.indexOf('COMPROMISOS DE CALIDAD E INDICADORES') >= 0){
				encontrado = true;
			} else if (encontrado && detalle.indexOf('DERECHOS DE LOS CIUDADANOS') >= 0){
				encontrado = false;
				if (enunciado !== '' && formulas.length > 0){
					response.push({
						denominacion: enunciado.replace('' + contador, ''),
						formulas: formulas,
						carta: cartaid,
						index: contador,
						estado: 'Publicado',
						objetivoestrategico: 1,
						procedimientos: []
					});
					contador = '' + (parseInt(contador, 10) + 1);
					enunciado = detalle;
					formulas = [];
				}
			} else if (encontrado){
				if (detalle.indexOf(contador) === 0){
					enunciado = detalle;
					formulas = [];
				} else if (detalle.indexOf( '' + (parseInt(contador, 10) + 1) ) === 0){
					if (formulas.length > 0){
						response.push({
							denominacion: enunciado.replace('' + contador, ''),
							formulas: formulas,
							carta: cartaid,
							index: contador,
							estado: 'Publicado',
							objetivoestrategico: 1,
							procedimientos: []
						});
					}
					contador = '' + (parseInt(contador, 10) + 1);
					enunciado = detalle;
					formulas = [];
				} else if (detalle !== ''){
					var meta = extraeMeta(detalle);
					var intervalos = extraeIntervalos(meta);
					var formula = {
						'human': detalle,
						'computer': '',
						'frecuencia': 'mensual',
						'indicadores': [],
						'meta': meta,
						'direccion': '',
						'intervalos': intervalos,
						'valores': {
							'a2015': [
								{formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null},
								{formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}],
							'a2016': [
								{formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null},
								{formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}],
							'a2017': [
								{formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null},
								{formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}, {formula: '', resultado: null}]
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

	/** Descarga de la url asociada a una carta sus objetivos e indicadores. */
	module.exports.downloadCarta = function(carta){
		const deferred = Q.defer();
		if (!carta || !carta.url){
			deferred.reject({error: 'Cannot download carta ' + carta.denominacion + ' because is not available'});

			return deferred.promise;
		}
		
		const settCraw = {'maxConnections': 10, 'callback': cbDownloadCarta(deferred, carta._id), 'userAgent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36' };
		const c = new Crawler(settCraw);
		c.queue(carta.url);

		return deferred.promise;
	};
	
	function registerAndSetIndicador(idjerarquia, txt, indicadormodel, cb){
		const defer = Q.defer();
		registerIndicador(idjerarquia, txt, indicadormodel, counterIndicador).then(function(indicador){
			cb(indicador);
			defer.resolve(indicador);
		}, defer.reject);

		return defer.promise;
	}

	function newIndicador(req, res){
		if (typeof req.user !== 'undefined' && typeof req.user.permisoscalculados !== 'undefined' && req.user.permisoscalculados.superuser){
			if (req.body && req.body.idjerarquia){
				const txt = req.body.nombre;
				const idjerarquia = parseInt(req.body.idjerarquia, 10);
				const indicadormodel = req.metaenvironment.models.indicador();
				registerIndicador(idjerarquia, txt, indicadormodel, counterIndicador).then(req.eh.okHelper(res), req.eh.errorHelper(res));
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

	module.exports.extractAndSaveIndicadores = function(idjerarquia, objetivos, indicadormodel){
		const defer = Q.defer();
		const promises = [];

		for (let i = 0, j = objetivos.length; i < j; i++){
			for (const k = 0, l = objetivos[i].formulas.length; k < l; k++){
				let formula = objetivos[i].formulas[k].human;

				const ultimoseparador = Math.max.apply(null, ['=', '≥', '≤', '&ge;', '&le;'].map(cbMap(formula)));
				if (ultimoseparador > 0){
					formula = formula.substr(0, ultimoseparador);
				}
				const partes = tokenizer(formula);
				let orden = 0;

				for (let n = 0, m = partes.length; n < m; n +=1 ){
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
					if (parte.indexOf('100') === -1){
						var promiseIndicador = registerAndSetIndicador(idjerarquia, parte, indicadormodel, cbSetIndicador(objetivos, i, k, orden));
						orden += 1;
						promises.push(promiseIndicador);
					}
				}
			}
		}
		Q.all(promises).then(function(indicadoresobtenidos){
			defer.resolve({objetivos: objetivos, indicadoresobtenidos: indicadoresobtenidos});
		}, defer.reject);

		return defer.promise;
	};

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

		const indiceformula = parseInt(indiceformula, 10);
		const formula = req.body.formula;
	
		objetivomodel.findOne({'_id': models.objectId(idobjetivo)}, function(objetivo){
			if (objetivo){
				if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.entidadobjetoescritura.indexOf('' + objetivo.carta)){
					if (typeof objetivo.formulas[indiceformula] !== 'undefined'){
						objetivo.formulas[indiceformula].computer = formula;
						objetivo.markModified('formulas');
						objetivomodel.update({'_id': models.objectId(objetivo._id)}, objetivo).exec().then(req.eh.cbWithDefaultValue(res, objetivo), req.eh.errorHelper(res));
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

		if (typeof id === 'undefined' || id === ''){
			req.eh.missingParameterHelper(res, 'id');

			return;
		}

		/*  || req.user.permisoscalculados.entidadobjetoescritura.indexOf(id) */
		if (req.user.permisoscalculados.superuser){
			entidadobjetomodel.findOne({'_id': models.objectId(req.params.id) }).exec().then(function(carta){
				if (carta){
					const defer = Q.defer(),
						defer2 = Q.defer();

					indicadormodel.remove({idjerarquia: carta.idjerarquia}, defer.makeNodeResolver());
					objetivomodel.remove({carta: carta._id}, defer2.makeNodeResolver());
					Q.all([defer, defer2]).then(function(){ res.json('OK');	}, req.eh.errorHelper(res));
				} else {
					req.eh.notFoundHelper(res);
				}
			}, req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.testDownloadCarta = function(req, res){
		if (req.user.permisoscalculados.superuser){
			const entidadobjeto = req.metaenvironment.models.entidadobjeto(),
				id = req.params.id,
				indicadormodel = req.metaenvironment.models.indicador(),
				objetivomodel = req.metaenvironment.models.objetivo();
			if (typeof id === 'string' && id !== ''){
				entidadobjeto.findOne({'_id': id}).exec().then(function(data){
					if (data){
						module.exports.downloadCarta(data, Crawler).then(function(objetivos){
							if (objetivos.length === 0){
								res.status(500).json({'error': 'Empty page'});
							} else {
								module.exports.extractAndSaveIndicadores(data.idjerarquia, objetivos, indicadormodel).then(function(objetivosConIndicadores){
									const objetivosAAlmacenar = objetivosConIndicadores.objetivos;
									for (const i = 0, j = objetivosAAlmacenar.length; i < j; i++){
										for (const k = 0, l = objetivosAAlmacenar[i].formulas.length; k < l; k++){
											objetivosAAlmacenar[i].formulas[k] = trytoparseFormula(objetivosAAlmacenar[i].formulas[k], objetivosConIndicadores.indicadoresobtenidos);
										}
										new objetivomodel(objetivosAAlmacenar[i]).save();
										/* TODO: wait? */
									}
									res.json(objetivosConIndicadores);
								}, req.eh.errorHelper(res));
							}
						}, req.eh.errorHelper(res));
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

	module.exports.newIndicador = newIndicador;
	module.exports.saveVersion = saveVersion;

})(module, console);
