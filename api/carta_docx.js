(function(module, log){
	'use strict';

	var path = require('path'),
		fs = require('fs'),
		Q = require('q'),
		Docxtemplater = require('docxtemplater'),
		Imagedocx = require('docxtemplater-image-module'),
		expressions = require('angular-expressions'),
		angularParser = function(tag){
			var expr = expressions.compile(tag);
			return {get: expr};
		};

	var indicadores = {};

	// configuración generador gauges
	var imgopts = {
		centered: false,
		getImage: function(tagValue/*, tagName*/) {
			// el tagName contendrá el id del objetivo y el id de la fórmula
			var result = fs.readFileSync(tagValue, 'binary');

			return result;
		},
		getSize: function(/* img, tagValue, tagName */) {
			return [ 150, 150];
		}
	};
	var imagedocx = new Imagedocx(imgopts);
	// fin configuracion generador gauges

	function pushIndicador(indicador){
		indicadores[indicador] = false;
	}

	var FILE = 'FILE',
		BUFFER = 'BUFFER';

	function generateDocx(app, params, outputtype, outputparams, cb){
		var content = fs.readFileSync( path.join(__dirname, '..', 'data', 'carta-template.docx'), 'binary'),
			doc = new Docxtemplater(),
			buf, filename,
			pathdir = app.get('prefixtmp');
		//set the templateVariables
		//params.imagen  = './data/gauge.png';
		doc
			//.attachModule(imagedocx)
			.load(content)
			.setOptions({parser: angularParser})
			.setData(params);
		try {
			doc.render();
			if (outputtype === FILE){

				buf = doc.getZip().generate({type: 'nodebuffer'});
				filename = path.join(pathdir, outputparams);

				fs.writeFileSync(filename, buf);
				cb(null, 'ok');
			} else if (outputtype === BUFFER){

				buf = doc.getZip().generate({type: 'nodebuffer'});
				filename = path.join(pathdir, outputparams);
				fs.writeFileSync(filename, buf);
				cb(null, filename);
			}else {
				cb('outputerror');
			}
		} catch (err) {
			log.error(err);
			cb(err);
		}
	}

	function toFixedIfNeeds2(n){
		if (n === +n && n !== (n | 0) ){
			return n.toFixed(2);
		}
		return n;
	}

	function addMonthInfo(obj, arr, prefix){
		var months = ['enero', 'febrero', 'marzo',
			'abril', 'mayo', 'junio',
			'julio', 'agosto', 'septiembre',
			'octubre', 'noviembre', 'diciembre', 'total'];
		for (var i = 0, j = months.length; i < j; i++){
			if (!arr[i]) {
				obj[ prefix + months[i] ] = '';
			} else if (arr[i] && typeof arr[i] === 'object') {
				obj[ prefix + months[i] ] = arr[i].resultado ? toFixedIfNeeds2(arr[i].resultado) : '';
			} else if (arr[i]) {
				obj[ prefix + months[i] ] = toFixedIfNeeds2(arr[i]);
			} else {
				obj[ prefix + months[i] ] = '';
			}
		}
		return obj;
	}

	function transformarFormulas(formulas, anualidad){
		var arr = [], i, j, k, l;
		for (i = 0, j = formulas.length; i < j; i++){
			var obj = {
				human: formulas[i].human,
				computer: formulas[i].computer,
				anualidad: anualidad,
				indicadores: formulas[i].indicadores,
				imagen: './data/gauge.png' //aquí compondré el nombre del gauge incluyendo las codobjetivo y el index de la formula
			};
			obj = addMonthInfo(obj, formulas[i].valores['a' + anualidad], 'v_');
			arr.push(obj);

			for (k = 0, l = formulas[i].indicadores.length; k < l; k++){
				pushIndicador(formulas[i].indicadores[k]);
			}

		}
		return arr;
	}

	function transformarObjetivos(objetivos, anualidad){
		var o = [],
			i, j;
		for (i = 0, j = objetivos.length; i < j; i++){
			o.push({
				index: objetivos[i].index,
				denominacion: objetivos[i].denominacion,
				formulas: transformarFormulas(objetivos[i].formulas, anualidad)
			});
		}
		return o;
	}

	function loadIndicador(_id, indicadormodel, ObjectId){
		var q = Q.defer();
		indicadormodel
			.findOne({_id: ObjectId(_id) })
			.exec().then(function(ind){
				q.resolve(ind);
			}, function(err){
				q.reject(err);
			});
		return q.promise;
	}

	function loadPlan(models, planmodel, accionmodel, personamodel, organicamodel, carta, anualidad){
		var q = Q.defer();
		var r = {'carta': '' + carta._id, anualidad: anualidad};
		var rejectPromise = function(promise, id){
			return function(err){
				log.error(err, id);
				promise.reject(err);
			};
		};
		var resolvePromise = function(promise, id){
			return function(data){
				log.log('resuelta:' + id);
				promise.resolve(data);
			};
		};
		planmodel.findOne(r).exec().then(function(plan){
			if (!plan){
				q.reject('not found:' + JSON.stringify(r));
			} else {
				plan = JSON.parse(JSON.stringify(plan)); //mongoose sucks!

				var joinData = function(accion, qaccion){
					return function(data){
						if (data[0]){ accion.equipo = data[0]; }
						if (data[1]){ accion.responsable = data[1];}
						if (data[2]){ accion.promotor = data[2];}
						if (data[3]){ accion.organica = data[3];}
						//accion = JSON.parse(JSON.stringify(accion)); //mongoose sucks!

						var rs = accion.restricciones,
							af = accion.afectables;

						accion.restricciones = [];
						accion.afectables = [];
						for (var restriccion in rs){
							if (rs[restriccion]){
								accion.restricciones.push({nombre: restriccion});
							}
						}
						for (var afectable in af){
							if (af[afectable]){
								accion.afectables.push({nombre: afectable});
							}
						}
						qaccion.resolve(accion);
					};
				};
				var rellenaAccion = function(accion){

					var qaccion = Q.defer(),
						qequi = Q.defer(),
						qres = Q.defer(),
						qpro = Q.defer(),
						qorg = Q.defer(),
						pequipo = [];

					if (typeof accion.equipo !== 'undefined'){
						for (var k = 0, l = accion.equipo.length; k < l; k++){
							if (typeof accion.equipo[k] === 'string'){
								pequipo.push(loadPersona(models, personamodel, accion.equipo[k]));
							}
						}
						Q.all(pequipo).timeout(3000, 'qequi').then(resolvePromise(qequi, 'qequi'), rejectPromise(qequi, 'qequi') );

					} else {
						qequi.resolve([]);
					}
					// cargamos el responsable
					if (typeof accion.responsable === 'string' ){
						loadPersona(models, personamodel, accion.responsable).timeout(3000, 'qres').then(resolvePromise(qres, 'qres'), rejectPromise(qres, 'qres') );
					}else {
						qres.resolve();
					}
					// cargamos el promotor
					if (typeof accion.promotor === 'string'){
						loadPersona(models, personamodel, accion.promotor).timeout(3000, 'qpro').then(resolvePromise(qpro, 'qpro'), rejectPromise(qpro, 'qpro') );
					}else {
						qpro.resolve();
					}
					// cargamos la organica
					if (typeof accion.organica === 'number'){
						loadOrganica(organicamodel, accion.organica).timeout(3000, 'qorg').then(resolvePromise(qorg, 'qorg'), rejectPromise(qorg, 'qorg') );
					} else {
						qorg.resolve();
					}
					// esperamos las subcargas y devolvemos la accion
					Q
						.all([qequi.promise, qres.promise, qpro.promise, qorg.promise])
						.then(joinData(accion, qaccion), rejectPromise(qaccion, 'qaccion') );
					return qaccion.promise;
				};
				accionmodel.find({'plan': '' + plan._id}).lean().exec().then(function(acciones){
					var qacciones = [];

					for (var i = 0, j = acciones.length; i < j; i++){
						var accion = acciones[i];
						qacciones.push( rellenaAccion(accion) );
					}


					//});
					// esperamos que se hayan calculado todas las acciones y sus equipos,y con ellos cargados
					// resolvemos, las acciones. Actualizamos el plan con ellas y ya lo tenemos listo para devolver

					Q.all(qacciones).then(function(acciones){

						log.log(236, plan, acciones.length);
						acciones.sort(function(a, b){ return parseInt(a.numero) - parseInt(b.numero); });
						plan.acciones = acciones;
						q.resolve(plan);

					}, function(err){
						q.reject(err);
					});

				}, rejectPromise(q, 'q') );
			}
		//// ERROR CARGANDO EL PLAN
		}, rejectPromise(q, 'q*') );

		return q.promise;
	}

	function loadPersona(models, personamodel, id){
		var q = Q.defer();
		personamodel
			.findOne({'_id': models.ObjectId(id) })
			.lean()
			.exec().then(function (persona){
				q.resolve(persona);
			}, function(err){
				log.error(id, err);
				q.reject(err);
			});
		return q.promise;
	}

	function loadOrganica(organicamodel, idjerarquia){
		var q = Q.defer();
		organicamodel
			.findOne({'id': parseInt(idjerarquia)})
			.lean()
			.exec().then(function (organica){
				q.resolve(organica);
			}, function(err){
				q.reject(err);
			});
		return q.promise;
	}

	function loadIndicadores(indicadormodel, ObjectId){
		var promises = [];
		for (var ind in indicadores){
			promises.push(loadIndicador(ind, indicadormodel, ObjectId));
		}
		return Q.all(promises);
	}

	function getIndicador(id, indicadorescargados){
		for (var i = 0, j = indicadorescargados.length; i < j; i++){
			if ((indicadorescargados[i]._id + '') === (id + '')){
				return indicadorescargados[i];
			}
		}
		log.error('no he encontrado:', id );
		return null;
	}

	function getObservaciones(indicador, anualidad){
		var months = ['enero', 'febrero', 'marzo',
			'abril', 'mayo', 'junio',
			'julio', 'agosto', 'septiembre',
			'octubre', 'noviembre', 'diciembre'];
		if (typeof indicador.observaciones !== 'undefined' && typeof indicador.observaciones['a' + anualidad] !== 'undefined') {
			var tmp = {indicadornombre: indicador.nombre, comentarios: []};
			for (var i = 0; i < 12; i++){
				if (indicador.observaciones['a' + anualidad][i] && indicador.observaciones['a' + anualidad][i].trim() !== ''){
					tmp.comentarios.push({indicadornombre: indicador.nombre, mes: months[i], observacion: indicador.observaciones['a' + anualidad][i].trim() });
				}
			}
		}
		if (tmp.comentarios.length > 0){
			return [tmp];
		} else {
			return [];
		}
	}

	function incluirIndicadores(objetivos, indicadorescargados, anualidad){
		for (var i = 0, j = objetivos.length; i < j; i++){
			for (var k = 0, l = objetivos[i].formulas.length; k < l; k++){
				objetivos[i].formulas[k].observaciones = [];
				for (var q = 0, w = objetivos[i].formulas[k].indicadores.length; q < w; q++){
					objetivos[i].formulas[k].indicadores[q] = getIndicador( objetivos[i].formulas[k].indicadores[q], indicadorescargados );
					objetivos[i].formulas[k].indicadores[q] = addMonthInfo(objetivos[i].formulas[k].indicadores[q], objetivos[i].formulas[k].indicadores[q].valores['a' + anualidad], '');
					objetivos[i].formulas[k].observaciones = objetivos[i].formulas[k].observaciones.concat(getObservaciones(objetivos[i].formulas[k].indicadores[q], anualidad));
				}
			}
		}
		return objetivos;
	}

	function incluirPlan(plancargado){
		return plancargado;
	}

	module.exports.generate = function(app, cfg, md5, models, ObjectId){

		return function(req, res){
			var entidadobjetomodel = models.entidadobjeto(),
				objetivomodel = models.objetivo(),
				indicadormodel = models.indicador(),
				jerarquiasmodel = models.jerarquia(),
				planmodel = models.planmejora(),
				accionmodel = models.accionmejora(),
				personamodel = models.persona();

			var anualidad = req.params.anualidad ? parseInt(req.params.anualidad) : 2015;
			var restriccion = { eliminado: false, tipoentidad: 'CS' };
			if (typeof req.params.id !== 'undefined'){
				restriccion._id = ObjectId(req.params.id);
			}

			var ordenarJerarquias = function(jerarquia, jerarquias){
				var returnValue = [], i, l;

				for (i = jerarquia.ancestros.length - 1; i >= 0; i--){
					for (l = 0; l < jerarquias.length; l++){
						if (jerarquias[l].id === jerarquia.ancestros[i]){
							returnValue.push(jerarquias[l]);
						}
					}
				}
				returnValue.push(jerarquia);
				return returnValue;
			};

			entidadobjetomodel.findOne(restriccion).exec().then(function(carta){
				if (!carta){
					res.status(500).json({'error': 'An error has occurred', details: 'Carta no encontrada'});
				} else {
					jerarquiasmodel.findOne({id: carta.idjerarquia}).exec().then(function(jerarquia){
						var ancestrosids = jerarquia.ancestros;
						jerarquiasmodel.find({id: {$in: ancestrosids }}, {id: 1, nombrelargo: 1}).exec().then(function(jerarquiascargadas){

							var jerarquias = ordenarJerarquias(jerarquia, jerarquiascargadas);
							objetivomodel.find({carta: carta._id }).sort({index: 1}).exec().then(function(objetivos){
								objetivos = transformarObjetivos(objetivos, anualidad);

								var promises = [
									loadIndicadores(indicadormodel, ObjectId),
									loadPlan(models, planmodel, accionmodel, personamodel, jerarquiasmodel, carta, anualidad)
								];
								Q.all(promises).then(function(data){

									var indicadorescargados = data[0],
										plancargado = data[1];

									var params = {
										'cartaservicio': carta,
										'anualidad': anualidad,
										'jerarquias': jerarquias,
										'objetivos': incluirIndicadores(objetivos, indicadorescargados, anualidad),
										'planmejora': incluirPlan(plancargado),
										'acciones': plancargado.acciones,
										'imagen':'./data/gauge.png'
									};

									log.log(params.planmejora);

									var time = new Date().getTime();
									generateDocx(app, params, FILE, time + '.docx', function(err){
										if (err){
											res.status(500).json({'error': 'An error has occurred', details: err});
										} else {
											res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time), 'extension': '.docx'});
										}
									});
								}, function(err){
									res.status(500).json({'error': 'An error has occurred', details: err});
								});
							}, function(err){
								res.status(500).json({'error': 'An error has occurred', details: err});
							});
						}, function(err){
							res.status(500).json({'error': 'An error has occurred', details: err});
						});
					});
				}
			}, function(err){
				res.status(500).json({'error': 'An error has occurred', details: err});
			});
		};
	};

})(module, console);
