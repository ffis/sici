(function(logger){
	'use strict';
	var fs = require('fs'),
		path = require('path'),
		cartas = require('./data/cartas.json');


	function transformarCartas(cs){
		var returnValue = [];
		var fecha = new Date();
		fecha.setDate(1);
		for (var i = 0, j = cs.length; i < j; i++){
			var carta = cs[i];

			var obj = {
				'codigo': i,
				'denominacion': carta.detalle,
				'url': carta.url,
				'responsable': '',
				'idjerarquia': 0,
				'tipoentidad': 'CS',
				'fechaalta': fecha,
				'fechafin': null,
				'fechaversion': fecha,
				'eliminado': false
			};
			returnValue.push(obj);
		}
		return returnValue;
	}

	var registros = transformarCartas(cartas);
	function volcarJSON(){
		fs.writeFile(path.join(__dirname, 'data', 'output.json'), JSON.stringify(registros), function(){
			logger.log(registros.length + ' registros');
			logger.log("\tmongoimport --host localhost --db test --collection entidadobjeto --file data/output.json --jsonArray --drop");
		});
	}

	volcarJSON();

})(console);
