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

		var partes = tokenizer(formula.human);
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
			var ultimoseparador = Math.max.apply(null, ['=', '≥', '≤'].map(function(s){
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
				indicadormodel.findOne({_id: id}, function(err, indicador){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(indicador);
				});
			}else{
				var restricciones = {};
				if (typeof req.query.idjerarquia !== 'undefined'){
					restricciones.idjerarquia = parseInt(req.query.idjerarquia);
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
				if (req.user.permisoscalculados.superuser){
					objetivomodel.find({'formulas.indicadores': id}, function(err, objetivos){
						if (err){
							res.status(500).json({'error': 'An error has occurred', details: err});
							return;
						}
						if (objetivos && objetivos.length > 0){
							var vinculado = objetivos.map(function(o){ return o.denominacion; }).join(' | ');
							res.status(401).json({'error': 'No se permite eliminar un indicador vinculado a un objetivo', details: vinculado});
						}else{
							var content = req.body;
							indicadormodel.remove({'_id': id}, function(e){
								if (e){
									res.status(400).json({'error': 'An error has occurred'});
								}else{
									res.json(content);
								}
							});
						}
					});
				}else{
					res.status(401).json({'error': 'Not allowed'});
					/* not allowed */
				}
			}else{
				res.status(404).json({'error': 'Not found'});
			}
		};
	};
	module.exports.actualizaindicador = function(models){
		return function(req, res){
			if (typeof req.params.id !== 'undefined'){
				var attr, i, j,
					indicadormodel = models.indicador(),
					id = req.params.id,
					actualizacion = req.body;
				indicadormodel.findOne({_id: id}, function(err, indicador){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					if (indicador){
						if (req.user.permisoscalculados.superuser){
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
					if (objetivo){
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
			console.log(req.params.id)
			if (typeof req.params.id !== 'undefined'){
				Objetivo.findOne({ '_id': models.ObjectId(req.params.id) }, function(erro, objetivo){
					if (erro){
						res.status(500).json({'error': 'An error has occurred', details: erro});
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

		if (typeof Crawler === 'undefined'){
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
							denominacion: enunciado,
							formulas: formulas,
							carta: cartaid,
							index: response.length + 1,
							estado: 'Publicado',
							objetivoestrategico: 1
						});
					}
				}else if (encontrado){
					if (detalle.indexOf(contador) === 0){
						enunciado = detalle;
						formulas = [];
					}else if (detalle.indexOf( '' + (parseInt(contador) + 1) ) === 0){
						response.push({
							denominacion: enunciado,
							formulas: formulas,
							carta: cartaid,
							index: response.length + 1,
							estado: 'Publicado',
							objetivoestrategico: 1
						});
						contador = '' + (parseInt(contador) + 1);
						enunciado = detalle;
						formulas = [];
					}else if (detalle !== ''){
						var formula = {
							'human': detalle,
							'computer': '',
							'frecuencia': 'mensual',
							'indicadores': [],
							'meta': extraeMeta(detalle),
							'direccion': '',
							'valores': {
								'a2015': [
									{formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0},
									{formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}],
								'a2016': [
									{formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0},
									{formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}, {formula: '', resultado: 0}]
							}
						};

						formulas.push(formula);
					}
				}
			}
			if (response.length === 0){
				console.error('No se han extraido compromisos', $html.length);
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

				df.resolve(extractCompromisos( jQuery('.contenido p,.contenido h3,.contenido h4'), jQuery, cartaid));
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
				'a2015': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], /* 13 elementos */
				'a2016': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
			},
			observaciones: {
				'a2015': ['', '', '', '', '', '', '', '', '', '', '', '', '' ],
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
		var cbSetIndicador = function(idobjetivo, idformula){
			return function(indicador){
				objetivos[idobjetivo].formulas[idformula].indicadores.push(indicador._id);
			};
		};
		for(var i = 0, j = objetivos.length; i < j; i++){
			for(var k = 0, l = objetivos[i].formulas.length; k < l; k++){
				var formula = objetivos[i].formulas[k].human,
					partes = tokenizer(formula);
				for(var n = 0, m = partes.length; n < m; n++ ){
					var parte = partes[n];
					if (parte.indexOf('100') === -1){
						var promiseIndicador = registerAndSetIndicador(idjerarquia, parte, indicadormodel, Q, cbSetIndicador(i, k) );
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

	module.exports.testDownloadCarta = function(models, Crawler, Q){
		return function(req, res){
			var entidadobjeto = models.entidadobjeto(),
				id = req.params.id,
				indicadormodel = models.indicador(),
				objetivomodel = models.objetivo();
			if (id){
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
									console.log(objetivosConIndicadores);
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

})(module);
