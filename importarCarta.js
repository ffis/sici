(function(logger){
	'use strict';
	const fs = require('fs'),
		path = require('path'),
		cartas = require('./data/cartas.json');

	function transformarCartas(cs){
		const fecha = new Date();
		fecha.setDate(1);

		return cs.map(function(carta, i){

			return {
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
		});
	}

	var registros = transformarCartas(cartas);
	function volcarJSON(){
		fs.writeFile(path.join(__dirname, 'data', 'output.json'), JSON.stringify(registros), function(){
			logger.log(registros.length + ' registros');
			logger.log('\tmongoimport --host localhost --db test --collection entidadobjeto --file data/output.json --jsonArray --drop');
		});
	}

	volcarJSON();

})(console);
