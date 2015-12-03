(function(module){
	'use strict';
	var indicadores = require('../data/indicadores.json');

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
		'Carta de Servicios de la Dirección General de la Funci�n P�blica y Calidad de los Servicios': 18
	};
	function getMapping(id){
		for(var iq in equivalencias){
			if (equivalencias[iq] === id){
				return iq;
			}
		}
		return '';
	}

	module.exports.indicadores = function(){
		return function(req, res){
			if (typeof req.params.idjerarquia !== 'undefined'){
				var idorganismo = parseInt(req.params.idjerarquia);
				var organismostr = getMapping(idorganismo);
				if (typeof indicadoresXorganismo[organismostr] !== 'undefined'){
					for (var k = 0, l = indicadoresXorganismo[organismostr].length; k < l; k++ ){
						indicadoresXorganismo[organismostr][k].uid = idorganismo + '-' + indicadoresXorganismo[organismostr][k].i;
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
})(module);
