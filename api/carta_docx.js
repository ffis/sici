(function(module, log){
	'use strict';

	const path = require('path'),
		fs = require('fs'),
		Q = require('q'),
		md5 = require('md5'),
		Docxtemplater = require('docxtemplater'),
//		Imagedocx = require('docxtemplater-image-module'),
		expressions = require('angular-expressions');

	const MAX_TIMEOUT = 3000;
	const MONTHS = ['enero', 'febrero', 'marzo',
		'abril', 'mayo', 'junio',
		'julio', 'agosto', 'septiembre',
		'octubre', 'noviembre', 'diciembre'];

	// configuración generador gauges
	/*
	const imgopts = {
		centered: false,
		getImage: function(tagValue, tagName) {
			// el tagName contendrá el id del objetivo y el id de la fórmula
			var result = fs.readFileSync(tagValue, 'binary');

			return result;
		},
		getSize: function(img, tagValue, tagName) {
			return [150, 150];
		}
	};
	const imagedocx = new Imagedocx(imgopts);
	*/
	// fin configuracion generador gauges


	function sortAcciones(a, b){ return parseInt(a.numero, 10) - parseInt(b.numero, 10); }

	function pushIndicador(indicadores, indicador){
		indicadores[indicador] = false;
	}

	function angularParser(tag){
		return {'get': expressions.compile(tag)};
	}

	const FILE = 'FILE',
		BUFFER = 'BUFFER';

	function generateDocx(cfg, params, outputtype, outputparams, cb){
		const content = fs.readFileSync(path.join(__dirname, '..', 'data', 'carta-template.docx'), 'binary'),
			doc = new Docxtemplater(),
			pathdir = cfg.prefixtmp;
		//set the templateVariables
		//params.imagen  = './data/gauge.png';
			//.attachModule(imagedocx)
		doc.load(content).setOptions({'parser': angularParser}).setData(params);
		try {
			doc.render();
			if (outputtype === FILE){

				const buf = doc.getZip().generate({'type': 'nodebuffer'});
				const filename = path.join(pathdir, outputparams);

				fs.writeFileSync(filename, buf);
				cb(null, 'ok');
			} else if (outputtype === BUFFER){

				const buf = doc.getZip().generate({'type': 'nodebuffer'});
				const filename = path.join(pathdir, outputparams);
				fs.writeFileSync(filename, buf);
				cb(null, filename);
			} else {
				cb('outputerror');
			}
		} catch (err) {
			log.error(err);
			cb(err);
		}
	}

	function toFixedIfNeeds2(n){
		if (n === Number(n) && n !== (n | 0) ){
		
			return n.toFixed(2);
		}

		return n;
	}

	function addMonthInfo(obj, arr, prefix){
		const months = MONTHS.concat(['total']);
		for (let i = 0, j = months.length; i < j; i += 1){
			if (!arr[i]) {
				obj[prefix + months[i]] = '';
			} else if (arr[i] && typeof arr[i] === 'object') {
				obj[prefix + months[i]] = arr[i].resultado ? toFixedIfNeeds2(arr[i].resultado) : '';
			} else if (arr[i]) {
				obj[prefix + months[i]] = toFixedIfNeeds2(arr[i]);
			} else {
				obj[prefix + months[i]] = '';
			}
		}

		return obj;
	}

	function transformarFormulas(formulas, anualidad, indicadores){
		var arr = [];
		for (let i = 0, j = formulas.length; i < j; i += 1){
			var obj = {
				human: formulas[i].human,
				computer: formulas[i].computer,
				anualidad: anualidad,
				indicadores: formulas[i].indicadores,
				imagen: './data/gauge.png' //aquí compondré el nombre del gauge incluyendo las codobjetivo y el index de la formula
			};
			obj = addMonthInfo(obj, formulas[i].valores['a' + anualidad], 'v_');
			arr.push(obj);

			for (let k = 0, l = formulas[i].indicadores.length; k < l; k += 1){
				pushIndicador(indicadores, formulas[i].indicadores[k]);
			}

		}

		return arr;
	}

	function transformarObjetivos(objetivos, anualidad, indicadores){

		return objetivos.map(function(objetivo){

			return {
				index: objetivo.index,
				denominacion: objetivo.denominacion,
				formulas: transformarFormulas(objetivo.formulas, anualidad, indicadores)
			};
		});
	}

	function loadIndicador(_id, indicadormodel, models){
		return indicadormodel.findOne({'_id': models.objectId(_id)}).lean().exec();
	}

	function joinData(accion, qaccion){
		return function(data){
			if (data[0]){
				accion.equipo = data[0];
			}
			if (data[1]){
				accion.responsable = data[1];
			}
			if (data[2]){
				accion.promotor = data[2];
			}
			if (data[3]){
				accion.organica = data[3];
			}
			//accion = JSON.parse(JSON.stringify(accion)); //mongoose sucks!

			const rs = accion.restricciones,
				af = accion.afectables;

			accion.restricciones = [];
			accion.afectables = [];
			for (const restriccion in rs){
				if (rs[restriccion]){
					accion.restricciones.push({nombre: restriccion});
				}
			}
			for (const afectable in af){
				if (af[afectable]){
					accion.afectables.push({nombre: afectable});
				}
			}
			qaccion.resolve(accion);
		};
	}

	function loadPersona(models, personamodel, id){

		return personamodel.findOne({'_id': models.objectId(id)}).lean().exec();
	}

	function loadOrganica(organicamodel, idjerarquia){

		return organicamodel.findOne({'id': parseInt(idjerarquia, 10)}).lean().exec();
	}

	/* TODO CHANGE THIS CRAP */

	function loadIndicadores(indicadormodel, models, indicadores){
		const promises = [];
		for (const ind in indicadores){
			promises.push(loadIndicador(ind, indicadormodel, models));
		}

		return Q.all(promises);
	}

	function getIndicador(id, indicadorescargados){
		for (let i = 0, j = indicadorescargados.length; i < j; i += 1){
			if (String(indicadorescargados[i]._id) === String(id)){

				return indicadorescargados[i];
			}
		}
		log.error('no he encontrado:', id);

		return null;
	}

	function getObservaciones(indicador, anualidad){

		if (typeof indicador.observaciones !== 'undefined' && typeof indicador.observaciones['a' + anualidad] !== 'undefined') {
			const tmp = {indicadornombre: indicador.nombre, comentarios: []};
			for (let i = 0; i < 12; i += 1){
				if (indicador.observaciones['a' + anualidad][i] && indicador.observaciones['a' + anualidad][i].trim() !== ''){
					tmp.comentarios.push({indicadornombre: indicador.nombre, mes: MONTHS[i], observacion: indicador.observaciones['a' + anualidad][i].trim()});
				}
			}
		
			if (tmp.comentarios.length > 0){

				return [tmp];
			}
		}

		return [];
	}

	function incluirIndicadores(objetivos, indicadorescargados, anualidad){
		for (let i = 0, j = objetivos.length; i < j; i += 1){
			for (let k = 0, l = objetivos[i].formulas.length; k < l; k += 1){
				objetivos[i].formulas[k].observaciones = [];
				for (let q = 0, w = objetivos[i].formulas[k].indicadores.length; q < w; q += 1){
					objetivos[i].formulas[k].indicadores[q] = getIndicador(objetivos[i].formulas[k].indicadores[q], indicadorescargados);
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

	function ordenarJerarquias(jerarquia, jerarquias){
		const returnValue = [];

		for (let i = jerarquia.ancestros.length - 1; i >= 0; i -= 1){
			for (let l = 0; l < jerarquias.length; l += 1){
				if (jerarquias[l].id === jerarquia.ancestros[i]){
					returnValue.push(jerarquias[l]);
					break;
				}
			}
		}
		returnValue.push(jerarquia);

		return returnValue;
	}

	function rellenaAccion(accion, models, personamodel, organicamodel){
		const qaccion = Q.defer();
		let qequi = false,
			qres = false,
			qpro = false,
			qorg = false;

		if (typeof accion.equipo === 'object'){
			const pequipo = accion.equipo.filter(function(persona){

				return typeof persona === 'string' && persona !== '';
			}).map(function(persona){

				return loadPersona(models, personamodel, persona);
			});
			qequi = Q.all(pequipo).timeout(MAX_TIMEOUT, 'qequi');

		} else {
			qequi = Q.all([]);
		}
		// cargamos el responsable
		if (typeof accion.responsable === 'string'){
			qres = loadPersona(models, personamodel, accion.responsable).timeout(MAX_TIMEOUT, 'qres');
		} else {
			qres = Q.all([]);
		}
		// cargamos el promotor
		if (typeof accion.promotor === 'string'){
			qpro = loadPersona(models, personamodel, accion.promotor).timeout(MAX_TIMEOUT, 'qpro');
		} else {
			qpro = Q.all([]);
		}
		// cargamos la organica
		if (typeof accion.organica === 'number'){
			qorg = loadOrganica(organicamodel, accion.organica).timeout(MAX_TIMEOUT, 'qorg');
		} else {
			qorg = Q.all([]);
		}
		// esperamos las subcargas y devolvemos la accion
		const promises = [qequi.promise, qres.promise, qpro.promise, qorg.promise];
		Q.all(promises).then(joinData(accion, qaccion), qaccion.reject);

		return qaccion.promise;
	}

	function loadPlan(models, planmodel, accionmodel, personamodel, organicamodel, carta, anualidad){
		const q = Q.defer();

		planmodel.findOne({'carta': String(carta._id), anualidad: anualidad}).lean().exec().then(function(plan){
			if (!plan){
				q.reject({error: 'plan not found'});

				return;
			}
			accionmodel.find({'plan': String(plan._id)}).lean().exec().then(function(accionescargadas){
				const qacciones = accionescargadas.map(function(accion){

					return rellenaAccion(accion, models, personamodel, organicamodel);
				});

				// esperamos que se hayan calculado todas las acciones y sus equipos,y con ellos cargados
				// resolvemos, las acciones. Actualizamos el plan con ellas y ya lo tenemos listo para devolver

				Q.all(qacciones).then(function(acciones){
					acciones.sort(sortAcciones);
					plan.acciones = acciones;
					q.resolve(plan);
				}, q.reject);
			}, q.reject);
		}, q.reject);

		return q.promise;
	}


	module.exports.generate = function(req, res){

		if (typeof req.params.id === 'undefined' || req.params.id.trim() === ''){
			req.eh.missingParameterHelper(res, 'id');

			return;
		}

		const models = req.metaenvironment.models,
			cfg = req.metaenvironment.cfg;

		const entidadobjetomodel = models.entidadobjeto(),
			objetivomodel = models.objetivo(),
			indicadormodel = models.indicador(),
			jerarquiasmodel = models.jerarquia(),
			planmodel = models.planmejora(),
			accionmodel = models.accionmejora(),
			personamodel = models.persona();

		const anualidad = req.params.anualidad ? parseInt(req.params.anualidad, 10) : 2015;
		const restriccion = {'eliminado': false, 'tipoentidad': 'CS', '_id': models.objectId(req.params.id)};

		entidadobjetomodel.findOne(restriccion).exec().then(function(carta){
			if (!carta){
				req.eh.notFoundHelper(res);

				return;
			}

			jerarquiasmodel.findOne({id: carta.idjerarquia}).exec().then(function(jerarquia){
				const ancestrosids = jerarquia.ancestros;
				jerarquiasmodel.find({'id': {'$in': ancestrosids}}, {'id': 1, 'nombrelargo': 1}).exec().then(function(jerarquiascargadas){
					const jerarquias = ordenarJerarquias(jerarquia, jerarquiascargadas);
					objetivomodel.find({'carta': String(carta._id)}).sort({index: 1}).exec().then(function(objetivos){
						const indicadores = {},
							objetivostransformados = transformarObjetivos(objetivos, anualidad, indicadores);

						const promises = [
							loadIndicadores(indicadormodel, models, indicadores),
							loadPlan(models, planmodel, accionmodel, personamodel, jerarquiasmodel, carta, anualidad)
						];
						Q.all(promises).then(function(data){

							const indicadorescargados = data[0],
								plancargado = data[1];

							const params = {
								'cartaservicio': carta,
								'anualidad': anualidad,
								'jerarquias': jerarquias,
								'objetivos': incluirIndicadores(objetivostransformados, indicadorescargados, anualidad),
								'planmejora': incluirPlan(plancargado),
								'acciones': plancargado.acciones,
								'imagen': './data/gauge.png'
							};

							const time = new Date().getTime();
							const value = {'time': time, 'hash': md5(cfg.downloadhashprefix + time), 'extension': '.docx'};

							generateDocx(cfg, params, FILE, time + '.docx', req.eh.cbWithDefaultValue(res, value));
						}).fail(req.eh.errorHelper(res));
					}).fail(req.eh.errorHelper(res));
				}).fail(req.eh.errorHelper(res));
			}).fail(req.eh.errorHelper(res));
		}).fail(req.eh.errorHelper(res));
	};

})(module, console);
