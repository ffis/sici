(function(module){
	'use strict';

	/* remove this after prototyping */
	var indicadores = require('../data/indicadores.json');
	var indicadoresTest = [], counter = 0;

	function extractIndicadores(elem){
		for(var i = 0, j = elem.length; i < j; i++){
			var parte = elem[i];
			if (parte.indexOf('100') > -1){
				continue;
			}
			indicadoresTest[counter] = {
				id: counter,
				_id: counter,
				nombre: parte.trim(),
				resturl: '/indicador/' + counter,
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
				acumulador: 'suma'
			};
			counter++;
		}
	}
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
	for(var i = 0, j = indicadores.length; i < j; i++){
		if (typeof indicadores[i].partes === 'undefined'){
			indicadores[i].partes = [];
			for(var k = 0, l = indicadores[i].formulas.length; k < l; k++){
				indicadores[i].partes[k] = tokenizer(indicadores[i].formulas[k]);
				extractIndicadores(indicadores[i].partes[k]);
			}
			var primeraLetra = indicadores[i].descripcion.charAt(0);
			if (primeraLetra >= '0' && primeraLetra <= '9'){
				indicadores[i].i = parseInt(indicadores[i].descripcion);
				indicadores[i].descripcion = indicadores[i].descripcion.replace(indicadores[i].i, '').trim();
			}
		}
	}
	indicadores.sort(function(a, b){
		return a.organismo < b.organismo ? -1 : (a.organismo > b.organismo ? 1 :
			parseInt(a.i) - parseInt(b.i));
	});
	var indicadoresXorganismo = {};
	indicadores.forEach(function(indicador){
		var key = indicador.organismo;
		if (typeof indicadoresXorganismo[key] === 'undefined'){
			indicadoresXorganismo[key] = [];
		}
		indicadoresXorganismo[key].push(indicador);
	});

	var equivalencias = {
		'Carta de Servicios de la Agencia Tributaria de la Regi�n de Murcia': 636,
		'Carta de Servicios de la Biblioteca Regional de Murcia': 279,
		'Carta de Servicios de la Dirección General Seguridad Ciudadana y Emergencias.': 378,
		'Carta de Servicios de la Dirección General de Ganader�a y Pesca': 359,
		'Carta de Servicios de la Dirección General de Juventud y Deportes-�rea de Deportes': 637,
		'Carta de Servicios de la Dirección General de Pensiones, Valoraci�n y Programas de Inclusi�n': 1990,
		'Carta de Servicios de la Dirección General de Trabajo': 1746,
		'Carta de Servicios de la Dirección General de la Funci�n P�blica y Calidad de los Servicios': 18,
		'Carta de Servicios del Servicio de Atención al Ciudadano': 85
	};
	function getMapping(id){
		for(var iq in equivalencias){
			if (equivalencias[iq] === id){
				return iq;
			}
		}
		return '';
	}

	module.exports.indicadoresAntiguo = function(){
		return function(req, res){
			if (typeof req.params.idjerarquia !== 'undefined'){
				var idorganismo = parseInt(req.params.idjerarquia);
				var organismostr = getMapping(idorganismo);
				if (typeof indicadoresXorganismo[organismostr] !== 'undefined'){
					for (var ki = 0, li = indicadoresXorganismo[organismostr].length; ki < li; ki++ ){
						indicadoresXorganismo[organismostr][ki].uid = idorganismo + '-' + indicadoresXorganismo[organismostr][ki].i;
					}
					res.json(indicadoresXorganismo[organismostr]);
				}else{
					res.status(404).send('Not found.');
				}
			}else{
				res.json(indicadoresXorganismo);
			}
		};
	};

	module.exports.indicador = function(models){
		return function(req, res){
			var indicadormodel = models.indicador();
			if (typeof req.params.id !== 'undefined'){
				var id = models.mongoose.ObjectId(req.params.id);
				indicadormodel.findOne({_id: id}, function(err, indicadores){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(indicadores);
				});
			}else{
				indicadormodel.find(function(err, indicadores){
					if (err){
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(indicadores);
				});
			}
		};
	};

	module.exports.indicadorTest = function(){
		return function(req, res){
			if (typeof req.params.id !== 'undefined'){
				var id = parseInt(req.params.id);
				if (typeof indicadoresTest[id] === 'undefined'){
					res.status(404).send('Not found.');
				}else{
					res.json(indicadoresTest[id]);
				}
			}else{
				res.json([]);
			}
		};
	};
	module.exports.actualizaindicador = function(){
		return function(req, res){
			if (typeof req.params.id !== 'undefined'){
				var id = parseInt(req.params.id);
				if (typeof indicadoresTest[ id ] !== 'undefined'){
					var indicador = indicadoresTest[ id ];
					if (indicador.acumulador === 'suma'){
						for(var attr in indicador.valores){
							var suma = 0;
							for (var i = 0, j = indicador.valores[attr].length; i < j - 1; i++){
								indicador.valores[attr][i] = parseInt(req.body.valores[attr][i]);
								suma += indicador.valores[attr][i];
							}
							indicador.valores[attr][ indicador.valores[attr].length - 1 ] = suma;
						}
					}
					for(var attr in indicador.observaciones){
						for (var i = 0, j = indicador.observaciones[attr].length; i < j; i++){
							indicador.observaciones[attr][i] = req.body.observaciones[attr][i].trim();
						}
					}
					res.json(indicador);
				}else{
					res.status(404).json({'error': 'Not found'});
				}
			}else{
				res.status(404).json({'error': 'Not found'});
			}
		};
	};

	/* till this */

	module.exports.objetivo = function(models){
		return function(req, res){
			if (req.query.carta === 'undefined'){
				res.status(404).json({error: 'Not found.'});
				return;
			}
			var Objetivo = models.objetivo();
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
							descripcion: enunciado,
							formulas: formulas,
							carta: cartaid
						});
					}
				}else if (encontrado){
					if (detalle.indexOf(contador) === 0){
						enunciado = detalle;
						formulas = [];
					}else if (detalle.indexOf( '' + (parseInt(contador) + 1) ) === 0){
						response.push({
							descripcion: enunciado,
							formulas: formulas,
							carta: cartaid
						});
						contador = '' + (parseInt(contador) + 1);
						enunciado = detalle;
						formulas = [];
					}else if (detalle !== ''){
						var formula = {
							'human': detalle,
							'frecuencia': 'mensual',
							'indicadores': [],
							'meta': 100,
							'direccion': '',
							'valores': {'a2016': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]}
						};

						formulas.push(formula);
					}
				}
			}
			if (response.length === 0){
				response.push({ });
			}
			return response;
		};
		var cb = function(df, cartaid) {
			return function(error, result, $) {
				if (error){
					df.reject({error: 'cb', e: error});
					return;
				}

				df.resolve(extractCompromisos( $('.contenido p,.contenido h3,.contenido h4'), $, cartaid));
			};
		};

		var settCraw = {'maxConnections': 10, 'callback': cb(deferred, carta._id), 'userAgent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36' };
		var c = new Crawler(settCraw);
		c.queue(carta.url);

		return deferred.promise;
	};

	module.exports.import = function(models, Q){
		return function(req, res){

			if (typeof req.params.idjerarquia !== 'undefined'){
				var Objetivo = models.objetivo();
				var Carta = models.entidadobjeto();
				Carta.findOne({ idjerarquia: parseInt(req.params.idjerarquia), tipoentidad: 'CS' }, function(err, carta){
					if (err || !carta){
						res.status(400).json({'error': 'Empty request'});
					}
					var defers = [];
					var organismostr = getMapping(parseInt(req.params.idjerarquia));
					var fbObjetivo = function(defer, obj){
						return function(e){
							if (e){
								defer.reject(e);
							}else{
								defer.resolve(obj);
							}
						};
					};
					Objetivo.find({ 'carta': carta._id}).sort({'index': 1}).exec(function(erro, objss){
						if (err){
							res.status(500).json({'error': 'An error has occurred', details: erro});
							return;
						}
						if (objss.length > 0){
							res.json({'OK': true, objs: objss});
						}else{
							for (var p = 0, le = indicadoresXorganismo[organismostr].length; p < le; p++ ){

								var indicador = indicadoresXorganismo[organismostr][p];
								var obj = {
									'carta': carta._id,
									'codigo': 1,
									'denominacion': indicador.descripcion,
									'index': indicador.i,
									'objetivo': '',
									'perspectiva': '',
									'estado': 'Publicado',
									'formulas': []
								};
								for(var ind = 0; ind < indicador.formulas.length; ind++){
									obj.formulas.push({
										'human': indicador.formulas[ind],
										'frecuencia': 'mensual',
										'indicadores': [],
										'meta': 100,
										'direccion': '',
										'valores': {'a2016': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]}
									});
								}
								var defer = Q.defer();
								defers.push(defer.promise);
								//defer.resolve(obj);
								new Objetivo(obj).save( fbObjetivo(defer, obj) );
							}
							Q.all(defers).then(function(objs){
								res.json({'OK': true, objs: objs});
							}, function(error){
								res.status(500).json({'error': 'An error has occurred', details: error});
							});
						}
					});
				});
			}else{
				res.status(404).json({'error': 'Not valid params'});
			}
		};
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
			acumulador: 'suma'
		};

		indicadormodel.findOne({idjerarquia: idjerarquia, nombre: txt}, function(err, obj){
			if (err){
				defer.reject(err);
			}else{
				if (obj){
					defer.resolve(obj);
				}else{
					console.log('Trying to save new indicador ' + indicador.nombre);
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
				console.log('setting indicador dentro de formula ', idobjetivo, idformula, indicador._id);
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
					}
					if (data){
						module.exports.downloadCarta(data, Crawler, Q).then(function(objetivos){
							module.exports.extractAndSaveIndicadores(data.idjerarquia, objetivos, indicadormodel, Q).then(function(objetivosConIndicadores){
								var objetivosAAlmacenar = objetivosConIndicadores.objetivos;
								for(var i = 0, j = objetivosAAlmacenar.length; i < j; i++){
									new objetivomodel(objetivosAAlmacenar[i]).save();
									/* TODO: wait? */
								}
								res.json(objetivosConIndicadores);
							});
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
