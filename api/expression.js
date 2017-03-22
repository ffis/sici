(function(module, logger){
	'use strict';

	const math = require('mathjs'),
		Q = require('q');

	function MathLib(modelss){
		this.models = modelss;
	}
	MathLib.prototype.eval = function(expr){
		return math.eval(expr);
	};

	function extractValue(partes, expresion, variables, obj){
		let valor = 0;
		for (let i = 3, j = partes.length; i < j; i++){
			if (partes[i].indexOf('[') === 0 && partes[i].indexOf(']') === partes[i].length - 1 ){
				//se busca el valor en el diccionario de variables
				const nombrevariable = partes[i].substr(1, partes[i].length - 2);
				if (typeof variables[nombrevariable] === 'undefined'){
					logger.error('No existe la variable:' + nombrevariable);
					valor = partes[i];
				} else {
					valor = variables[nombrevariable];
				}
			} else {
				valor = partes[i];
			}
			if (valor === '12' && typeof obj[valor] === 'undefined' && typeof obj === 'object'){
				//caso especial procedimiento, debe ser la suma de los anteriores
				return obj.reduce(function(p, o){

					return o ? p + o : p;
				}, 0);
			}
			if (typeof obj[valor] === 'undefined'){

				return expresion;
			}

			obj = obj[valor];
		}

		return obj;
	}

	function replace(variables){
		return function(expresion){
			if (expresion.indexOf('/') === 0 && expresion.trim() !== '/'){
				const partes = expresion.split('/');

				if (partes.length >= 3 && (expresion.indexOf('/indicador') === 0 || expresion.indexOf('/procedimiento') === 0)){
					return extractValue(partes, expresion, variables, variables[partes[2]]);
				}
			}

			return expresion;
		};
	}

	MathLib.prototype.evalFormula = function(str, cb){
		const indicadormodel = this.models.indicador(),
			procedimientomodel = this.models.procedimiento(),
			objectid = this.models.ObjectId;
		let partes = [];
		try {
			partes = JSON.parse(str);
		} catch (err){
			cb(err);

			return;
		}
		const returnValue = {},
			scope = {};

		const modoAnualidad = partes.some(function(s){ return s.indexOf('[anualidad]') > -1; });
		//,	modoMes = partes.some(function(str){ return str.indexOf('[mes]') > -1; });

		const elementosACargar = partes.reduce(function(prev, parte){
			const esProcedimiento = parte.indexOf('/procedimiento') === 0;
			const esIndicador = parte.indexOf('/indicador') === 0;
			if (esProcedimiento || esIndicador){
				const tokens = parte.split('/'),
					id = tokens.length >= 3 ? tokens[2].trim() : '';
				if (id.length === 24 || id.length === 12){
					const tipo = esProcedimiento ? 'procedimientos' : 'indicadores';
					prev[tipo][id] = true;
				}
			}

			return prev;
		}, {indicadores: {}, procedimientos: {}});

		const promises = [].concat(Object.keys(elementosACargar.indicadores).map(function(idIndicador){
			return indicadormodel.findOne({_id: objectid(idIndicador)}).lean().exec();
		}), Object.keys(elementosACargar.procedimientos).map(function(idProcedimiento){
			return procedimientomodel.findOne({_id: objectid(idProcedimiento)}).lean().exec();
		}));

		Q.all(promises).then(function(varis){
			if (varis.some(function(o){ return !o; })){
				cb({error: 'One of the variables cannot be resolved'});

				return;
			}

			const variables = varis.reduce(function(prev, obj){
				if (typeof obj.valores !== 'undefined'){
					prev[obj._id] = obj;
				}

				return prev;
			}, {});

			const vars = JSON.parse(JSON.stringify(variables));
			function entero(v){
				return parseFloat(v, 10).toFixed(0);
			}
			scope.entero = entero;

			if (modoAnualidad){
				//suponemos que ambos indicadores tienen las mismas anualidades

				for (const idIndicador in variables){
					for (const anualidad in variables[idIndicador].valores){
						returnValue[anualidad] = [];
						vars.anualidad = anualidad;
						for (const mes in variables[idIndicador].valores[anualidad]){
							vars.mes = mes;
							const formula = partes.map(replace(vars));
							const formulastr = formula.join('');
							
							let resultado = 0;
							try {
								if (formula.filter(function(a){ return a === null; }).length === 0){
									resultado = math.parse(formulastr).compile().eval(scope);
								} else {
									resultado = null;
								}
							} catch (e) {
								logger.error(118, e);
							}
							returnValue[anualidad].push({formula: formula, resultado: resultado});
						}
					}
					break;
				}
			}

			cb(null, returnValue);
		}, cb);
	};

	module.exports = MathLib;

})(module, console);
