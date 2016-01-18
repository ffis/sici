(function(module){
	'use strict';
	var Expression = require('./expression');

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

	function capitalizeFirst(a){
		return a.charAt(0).toUpperCase() + a.slice(1);
	}
	function uncapitalizeFirst(a){
		return a.charAt(0).toLowerCase() + a.slice(1);
	}

	function trytoparseFormula(formula, indicadores){

		var partes = tokenizer(formula.human).map(function(a){ return a.trim(); }).filter(function(a){ return a != '';});

		var frasesAReemplazar = [];
		for(var i = 0, j = partes.length; i < j; i++){
			for(var k = 0, l = indicadores.length; k < l; k++){
				if (partes[i] === indicadores[k].nombre){
					frasesAReemplazar.push({
						search: partes[i],
						replace: '/indicador/' + indicadores[k]._id + '/valores/[anualidad]/[mes]'
					});
					break;
				}else if (partes[i].toLowerCase() === 'x 100'){
					frasesAReemplazar.push({
						search: partes[i],
						replace: '* 100'
					});
					break;
				}else if (partes[i].toLowerCase() === 'x100'){
					frasesAReemplazar.push({
						search: partes[i],
						replace: '* 100'
					});
					break;
				}else if (partes[i].toLowerCase() === ') x 100'){
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

				for(var i = 0, j = frasesAReemplazar.length; i < j; i++){
					if (formulacomputer.indexOf(frasesAReemplazar[i].search) > -1){
						formulacomputer = formulacomputer.replace(frasesAReemplazar[i].search, '@');
					}else if (formulacomputer.indexOf(uncapitalizeFirst(frasesAReemplazar[i].search) ) > -1){
						formulacomputer = formulacomputer.replace(uncapitalizeFirst(frasesAReemplazar[i].search), '@');
					}else{
						fallo = true;
						console.log('No encontrado |' + frasesAReemplazar[i].search + '| en ' + formulacomputer);
					}
				}
				if (!fallo){
					var arr = formulacomputer.split('@');

					for(var i = 0, j = arr.length - 1; i < j; i++){
						e.push(arr[i]);
						if (frasesAReemplazar.length == 0){
							fallo = true;
							break;
						}
						var o = frasesAReemplazar.shift();
						e.push(o.replace);
					}
					e.push(arr[ arr.length - 1]);
					if (!fallo){
						e = e.filter(function(str){
							return str.trim() != '';
						});
						formula.computer = JSON.stringify(e);
					}
				}
			}
		}
		return formula;
	}

	module.exports.indicador = function(models){
		return function(req, res){
			
			var indicadormodel = models.indicador();
			if (typeof req.params.id !== 'undefined'){
				var id = req.params.id;
				var restriccion = { _id : models.ObjectId(id) };				
				if (!req.user.permisoscalculados.superuser) {
					restriccion['$or'] = [
						{
							'idjerarquia': {'$in': req.user.permisoscalculados.jerarquiaescritura.concat(req.user.permisoscalculados.jerarquialectura)}
						},
						{
							'responsable': req.user.login
						}];
				}				
				indicadormodel.findOne(restriccion, function(err, indicador){
					if (err){
						console.log('Error');
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(indicador);
				});
			}else{
				var restricciones = {};
				if (!req.user.permisoscalculados.superuser) {
					restricciones['$or'] = [
						{
							'idjerarquia': {'$in': req.user.permisoscalculados.jerarquiaescritura.concat(req.user.permisoscalculados.jerarquialectura)}
						},
						{
							'responsable': req.user.login
						}];
				}
				if (typeof req.query.idjerarquia !== 'undefined'){
					if (typeof restricciones['$or'] !== 'undefined'){
						var restriccionesaux = {};
						restriccionesaux['$and'] = [
							restricciones,
							{'idjerarquia': parseInt(req.query.idjerarquia)}
						];
						restricciones = restriccionesaux;
					} else {
						restricciones.idjerarquia = parseInt(req.query.idjerarquia);
					}
				}
				indicadormodel.find(restricciones, function(err, indicadores){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(indicadores);
				});
			}
		};
	};

	module.exports.removeindicador = function(models){
		return function(req, res){
			if (typeof req.params.id !== 'undefined'){
				var indicadormodel = models.indicador();
				var objetivomodel = models.objetivo();
				var id = req.params.id;		
				indicadormodel.findOne({_id: models.ObjectId(id)}, function(err, indicador){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;						
					}
					if (req.user.permisoscalculados.superuser || 
						req.user.permisoscalculados.jerarquiaescritura.indexOf(indicador.idjerarquia)!==-1){
						objetivomodel.find({'formulas.indicadores': models.ObjectId(id)}, function(err, objetivos){
							if (err){
								res.status(500).json({'error': 'An error has occurred', details: err});
								return;
							}
							if (objetivos && objetivos.length > 0){
								var vinculado = objetivos.map(function(o){ return o.denominacion; }).join(' | ');
								res.status(403).json({'error': 'No se permite eliminar un indicador vinculado a un objetivo', details: vinculado});
							}else{
								var content = req.body;
								indicadormodel.remove({'_id': models.ObjectId(id)}, function(e){
									if (e){
										res.status(400).json({'error': 'An error has occurred'});
									}else{
										res.json(content);
									}
								});
							}
						});
					}else{
						res.status(403).json({'error': 'Not allowed'});
						/* not allowed */
					}
				});							
			}else{
				res.status(404).json({'error': 'Not found'});
			}
		};
	};
	module.exports.actualizaindicador = function(models, Q){
		return function(req, res){
			if (typeof req.params.id !== 'undefined'){
				var attr, i, j,
					indicadormodel = models.indicador(),
					id = req.params.id,
					actualizacion = req.body;
				indicadormodel.findOne({_id: models.ObjectId(id)}, function(err, indicador){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					if (indicador) { 
						var permiso = req.user.permisoscalculados.superuser || req.user.permisoscalculados.jerarquiaescritura.indexOf(indicador.idjerarquia)!==-1;
						if (permiso){
							module.exports.saveVersion(models, Q, indicador).then(function(){

								if (permiso){
									indicador.nombre = actualizacion.nombre;
									indicador.resturl = actualizacion.resturl;
									indicador.vinculacion = actualizacion.vinculacion;
									indicador.acumulador = actualizacion.acumulador;
									indicador.frecuencia = actualizacion.frecuencia;
									indicador.pendiente = actualizacion.pendiente;
								}

								if (indicador.acumulador === 'sum'){
									for(attr in indicador.valores){
										var suma = 0;
										for (i = 0, j = indicador.valores[attr].length; i < j - 1; i++){
											indicador.valores[attr][i] = isNaN(actualizacion.valores[attr][i]) ? 0 : parseInt(actualizacion.valores[attr][i]);
											suma += indicador.valores[attr][i];
										}
										indicador.valores[attr][ indicador.valores[attr].length - 1 ] = suma;
									}
								}
								for(attr in indicador.observaciones){
									for (i = 0, j = indicador.observaciones[attr].length; i < j; i++){
										indicador.observaciones[attr][i] = actualizacion.observaciones[attr][i].trim();
									}
								}
								indicador.markModified('valores');
								indicador.markModified('observaciones');
								indicador.markModified('medidas');
								indicador.fechaversion = new Date();

								indicador.save(function(erro, doc){
									if (erro){
										res.status(500).json({'error': 'An error has occurred', details: erro});
									}else{
										res.json(doc);
									}
								});
							}, function(e){
									res.status(500).json({'error': 'An error has occurred', details: e});
							});

						}else{
							res.status(403).json({'error': 'Not allowed'});
							console.log('permisos');
							console.log(req.user.permisoscalculados.jerarquiaescritura);
							console.log('indicador');
							console.log(indicador);
						}
					}else{
							res.status(404).json({'error': 'Not found'});
					}
				});
			}else{
				res.status(404).json({'error': 'Not found'});
			}
		};
	};

	module.exports.actualizaobjetivo = function(models, Q){
		return function(req, res){
			var Objetivo = models.objetivo();
			if (typeof req.params.id !== 'undefined'){
				Objetivo.findOne({ '_id': models.ObjectId(req.params.id) }, function(erro, objetivo){
					if (erro){
						res.status(500).json({'error': 'An error has occurred', details: erro});
						return;
					}					
					if (objetivo && (req.user.permisoscalculados.superuser || 								
								req.user.permisoscalculados.entidadobjetoescritura.indexOf(''+objetivo.carta)!==-1)){
						for(var attr in req.body){
							//TODO: change this naive
							objetivo[attr] = req.body[attr];
						}
						Objetivo.update({ _id: objetivo._id }, objetivo, function (err, doc){
							if (err){
								console.error(err);
								res.status(500).json({'error': 'An error has occurred', details: error });
							}else{
								res.json(objetivo);
							}
						});

					}else{
						res.status(404).json({'error': 'Not found'});
					}
				});
			}else{
				res.status(404).json({'error': 'Not found'});
			}
		};
	};
	module.exports.objetivo = function(models, Q){
		return function(req, res){
			var Objetivo = models.objetivo();
			if (typeof req.params.id !== 'undefined'){
				var restriccion = { '_id': models.ObjectId(req.params.id) };
				Objetivo.findOne(restriccion, function(erro, objetivo){
					if (erro){
						res.status(500).json({'error': 'An error has occurred', details: erro});
						return;
					}
					if (!(req.user.permisoscalculados.superuser ||						
						req.user.permisoscalculados.entidadobjetoescritura.indexOf(''+objetivo.carta)!==-1)){
						res.status(403).json({'error': 'Not allowed'});		
						return;
					}
					if (!objetivo){ res.json(objetivo); return; }
					var expresion = new Expression(models);
					var promises = [];
					var fn = function(promise, idformula){
						return function(err, val){
							console.log(250, err, val);
							if (err){
								promise.reject(err);
								return;
							}
							//disponible objeto con las anualidades
							var valoressimplicado = {};
							for(var anualidad in val){
								if (typeof valoressimplicado[anualidad] === 'undefined'){
									valoressimplicado[anualidad] = [];
								}
								for(var m in val[anualidad]){
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
						//guardar objetivo
						console.log('calculo OK', objetivo);

						Objetivo.update({ _id: objetivo._id }, objetivo, function (err, doc){
							if (err){
								console.error(err);
								res.status(500).json({'error': 'An error has occurred', details: error });
							}else{
								res.json(objetivo);
							}
						});
					}, function(error){
						//fallo con la formula
						console.error(error);
						res.json(objetivo);
						//res.status(500).json({'error': 'An error has occurred', details: error });
					});
				});
				return;
			}else if (req.query.carta === 'undefined'){
				res.status(404).json({error: 'Not found.'});
				return;
			}

			var carta = req.query.carta;
			Objetivo.find({ 'carta': models.ObjectId(carta) }).sort({'index': 1}).exec(function(erro, objss){
				if (erro){
					res.status(500).json({'error': 'An error has occurred', details: erro});
					return;
				}
				res.json(objss);
			});
		};
	};

	module.exports.downloadCarta = function(carta, Crawler, Q){
		var deferred = Q.defer();
		if (!carta || !carta.url){
			deferred.reject({error: 'Cannot download carta ' + carta.denominacion + ' because is not available'});
			return deferred.promise;
		}

		if (typeof Crawler != 'function'){
			deferred.reject({error: 'Cannot download carta ' + carta.denominacion + ' because the crawler is not available'});
			return deferred.promise;
		}
		var extraeMeta = function(str){
			var ultimoseparador = Math.max.apply(null, ['=', '≥', '≤'].map(function(s){
				return str.lastIndexOf(s) + 1;
			}) );
			if (ultimoseparador > 0){
				var finalstr = str.substr(ultimoseparador);
				return parseInt(finalstr);
			}
			return 100;
		};

		var extraeIntervalos = function(valormeta){
			var intervaloscalculados = [];
			if (valormeta > 0){
				intervaloscalculados = [
					{'min': 0, 'max': valormeta/4, 'mensaje': 'Peligro', 'color': '#C50200', 'alerta': 4},
					{'min': valormeta / 4, 'max': valormeta / 2, 'mensaje': 'Aviso', 'color': '#FF7700', 'alerta': 3},
					{'min': valormeta / 2, 'max': valormeta / 4 + valormeta / 2, 'mensaje': 'Normal', 'color': '#FDC702', 'alerta': 2},
					{'min': valormeta / 4 + valormeta / 2, 'max': valormeta, 'mensaje': 'Éxito', 'color': '#8DCA2F', 'alerta': 1}
				];
			}
			return intervaloscalculados;
		};
		var extractCompromisos = function($html, $, cartaid){
			var response = [];
			var encontrado = false;
			var contador = '1';
			var enunciado = '';
			var formulas = [];
			for(var i = 0, j = $html.length; i < j; i++){
				var $descripcion = $($html[i]);
				var detalle = $descripcion.text().trim();
				if (detalle.indexOf('COMPROMISOS DE CALIDAD E INDICADORES') >= 0){
					encontrado = true;
				}else if (encontrado && detalle.indexOf('DERECHOS DE LOS CIUDADANOS') >= 0){
					encontrado = false;
					if (enunciado !== '' && formulas.length > 0){
						response.push({
							denominacion: enunciado.replace('' + contador, ''),
							formulas: formulas,
							carta: cartaid,
							index: contador,
							estado: 'Publicado',
							objetivoestrategico: 1
						});
						contador = '' + (parseInt(contador) + 1);
						enunciado = detalle;
						formulas = [];
					}
				}else if (encontrado){
					if (detalle.indexOf(contador) === 0){
						enunciado = detalle;
						formulas = [];
					}else if (detalle.indexOf( '' + (parseInt(contador) + 1) ) === 0){
						if (formulas.length > 0){
							response.push({
								denominacion: enunciado.replace('' + contador, ''),
								formulas: formulas,
								carta: cartaid,
								index: contador,
								estado: 'Publicado',
								objetivoestrategico: 1
							});
						}
						contador = '' + (parseInt(contador) + 1);
						enunciado = detalle;
						formulas = [];
					}else if (detalle !== ''){
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
								'a2016': [
									{formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0},
									{formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}]
							}
						};
						formulas.push(formula);
					}
				}
			}

			return response;
		};
		var cb = function(df, cartaid) {
			return function(error, result, jQuery) {
				if (error){
					console.error(error);
					df.reject({error: 'cb', e: error});
					return;
				}
				var compromisos = extractCompromisos( jQuery('.contenido em,.contenido h3,.contenido h4'), jQuery, cartaid);
				if (compromisos.length === 0){
					compromisos = extractCompromisos( jQuery('.contenido p,.contenido h3,.contenido h4'), jQuery, cartaid);
				}
				if (compromisos.length === 0){
					console.error('No se han extraido compromisos');
					df.reject('No se han extraido compromisos');
				}
				df.resolve(compromisos);
			};
		};

		var settCraw = {'maxConnections': 10, 'callback': cb(deferred, carta._id), 'userAgent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36' };
		var c = new Crawler(settCraw);
		c.queue(carta.url);

		return deferred.promise;
	};

	var counterIndicador = 0;
	var registerIndicador = function(idjerarquia, txt, indicadormodel, Q){
		var defer = Q.defer();

		var indicador = {
			idjerarquia: idjerarquia,
			id: counterIndicador,
			nombre: txt,
			resturl: '/indicador/' + counterIndicador,
			valores: {
				'a2016': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] /* 13 elementos */
			},
			observaciones: {
				'a2016': ['', '', '', '', '', '', '', '', '', '', '', '', '' ]
			},
			fechaversion: new Date(),
			medidas: {},
			vinculacion: null,
			unidad: null,
			frecuencia: 'mensual',
			pendiente: false,
			acumulador: 'sum'
		};

		indicadormodel.findOne({idjerarquia: idjerarquia, nombre: txt}, function(err, obj){
			if (err){
				defer.reject(err);
			}else{
				if (obj){
					defer.resolve(obj);
				}else{
					new indicadormodel(indicador).save(function(erro, obj2){
						if (erro){
							defer.reject(erro);
						}else{
							defer.resolve(obj2);
						}
					});
				}
			}
		});

		return defer.promise;
	};

	var registerAndSetIndicador = function(idjerarquia, txt, indicadormodel, Q, cb){
		var defer = Q.defer();
		registerIndicador(idjerarquia, txt, indicadormodel, Q).then(function(indicador){
			cb(indicador);
			defer.resolve(indicador);
		}, function(err){
			defer.reject(err);
		});
		return defer.promise;
	};

	module.exports.extractAndSaveIndicadores = function(idjerarquia, objetivos, indicadormodel, Q){
		var defer = Q.defer();
		var promises = [];
		var cbSetIndicador = function(idobjetivo, idformula, ordenindicador){
			return function(indicador){
				objetivos[idobjetivo].formulas[idformula].indicadores[ordenindicador] = indicador._id;
			};
		};
		for(var i = 0, j = objetivos.length; i < j; i++){
			for(var k = 0, l = objetivos[i].formulas.length; k < l; k++){
				var formula = objetivos[i].formulas[k].human;

				var ultimoseparador = Math.max.apply(null, ['=', '≥', '≤', '&ge;', '&le;'].map(function(s){
					return formula.lastIndexOf(s);
				}) );
				if (ultimoseparador > 0){
					formula = formula.substr(0, ultimoseparador);
				}
				var	partes = tokenizer(formula),
					orden = 0;

				for(var n = 0, m = partes.length; n < m; n++ ){
					var parte = partes[n].trim();
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
						var promiseIndicador = registerAndSetIndicador(idjerarquia, parte, indicadormodel, Q, cbSetIndicador(i, k, orden++) );
						promises.push(promiseIndicador);
					}
				}
			}
		}
		Q.all(promises).then(function(indicadoresobtenidos){
			defer.resolve({objetivos: objetivos, indicadoresobtenidos: indicadoresobtenidos});
		}, function(err){
			defer.reject(err);
		});
		return defer.promise;
	};

	module.exports.updateFormula = function(models, Q){
		return function(req, res){
			var idobjetivo = req.body.idobjetivo,
				indiceformula = req.body.indiceformula,
				formula = req.body.formula,
				objetivomodel = models.objetivo();
				console.log(idobjetivo);
			if (idobjetivo){
				objetivomodel.findOne({'_id': models.ObjectId(idobjetivo) }, function (err, objetivo) {
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					
					if (objetivo){
						
						if (req.user.permisoscalculados.superuser ||
							req.user.permisoscalculados.entidadobjetoescritura.indexOf(''+objetivo.carta)) {
						
							if (typeof objetivo.formulas[parseInt(indiceformula)] !== 'undefined'){
								objetivo.formulas[parseInt(indiceformula)].computer = formula;
								objetivo.markModified('formulas');
								objetivomodel.update({'_id': models.ObjectId(objetivo._id)}, objetivo, function(error, e){
									if (error){
										res.status(500).json({'error': 'Error during update', details: error});
									}else{
										res.json(objetivo);
									}
								});
							}else{
								res.status(404).json({'error': 'Not found3'});
							}

						} else {
							res.status(403).json({'error': 'Not allowed'});
						}
					}else{
						res.status(404).json({'error': 'Not found2'});
					}						
				});
			} else {
				res.status(404).json({'error': 'Not valid params'});
			}

		};
	};

	module.exports.dropCarta = function(models, Q){
		return function(req, res){
			var id = req.params.id,
				indicadormodel = models.indicador(),
				objetivomodel = models.objetivo(),
				entidadobjetomodel = models.entidadobjeto();

			if (id && 
					(req.user.permisoscalculados.superuser 
						|| req.user.permisoscalculados.entidadobjetoescritura.indexOf(id)						
					)
				){
				entidadobjetomodel.findOne({'_id': models.ObjectId(req.params.id) }, function (err, carta) {
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}else if (carta){
						var defer = Q.defer(),
							defer2 = Q.defer();
						var fn = function(def){
							return function(err){
								if (err){
									def.reject(err);
								}else{
									def.resolve();
								}
							};
						};

						indicadormodel.remove({ idjerarquia: carta.idjerarquia }, fn(defer));
						objetivomodel.remove({ carta: carta._id }, fn(defer2));
						Q.all([defer, defer2]).then(function(){
							res.json('OK');
						}, function(error){
							res.status(500).json({'error': 'Error during dropCarta', details: error});
						});

					}else{
						res.status(404).json({'error': 'Not found'});
					}
				});
			}else{
				res.status(403).json({'error': 'Not allowed'});
			}
		};
	};

	module.exports.testDownloadCarta = function(models, Crawler, Q){
		return function(req, res){
			var entidadobjeto = models.entidadobjeto(),
				id = req.params.id,
				indicadormodel = models.indicador(),
				objetivomodel = models.objetivo();
			if (id && req.user.permisoscalculados.superuser){
				entidadobjeto.findOne({'_id': id}, function (err, data) {
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}else if (data){
						module.exports.downloadCarta(data, Crawler, Q).then(function(objetivos){
							if (objetivos.length === 0){
								res.status(500).json({'error': 'Empty page'});
							}else{
								module.exports.extractAndSaveIndicadores(data.idjerarquia, objetivos, indicadormodel, Q).then(function(objetivosConIndicadores){
									var objetivosAAlmacenar = objetivosConIndicadores.objetivos;
									for(var i = 0, j = objetivosAAlmacenar.length; i < j; i++){
										for(var k = 0, l = objetivosAAlmacenar[i].formulas.length; k < l; k++){
											objetivosAAlmacenar[i].formulas[k] = trytoparseFormula(objetivosAAlmacenar[i].formulas[k], objetivosConIndicadores.indicadoresobtenidos);
										}
										new objetivomodel(objetivosAAlmacenar[i]).save();
										/* TODO: wait? */
									}
									res.json(objetivosConIndicadores);
								}, function(errorI){
									res.status(500).json({'error': 'Error during download', details: errorI});
								});
							}
						}, function(error){
							res.status(500).json({'error': 'Error during download', details: error});
						});
					}else{
						res.status(404).json({'error': 'Not found'});
					}
				});
			}else{
				res.status(404).json({'error': 'Not valid params'});
			}
		};
	};
	
	module.exports.saveVersion = function (models, Q, indicador) {
		var defer = Q.defer();
		var Historico = models.historicoindicador();
		var v = JSON.parse(JSON.stringify(indicador));
		delete v._id;
		var version = new Historico(v);
		version.save(function (err) {
			if (err){
				defer.reject(err);
			}
			else{
				defer.resolve();
			}
		});
		return defer.promise;
	};
	

})(module);
