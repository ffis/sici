(function(module){
	'use strict';
	module.exports.registroActividad = function (models) {
		return function (req, res) {
			var registroActividad = models.registroactividad();
			var limit = req.query.limit ? parseInt(req.query.limit) : 40;
			var start = req.query.start ? parseInt(req.query.start) : 0;
			var restricciones = JSON.parse(JSON.stringify(req.query));
			delete restricciones.limit;
			delete restricciones.start;
			/* if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined') { */
			registroActividad
				.find(restricciones)
				.sort({fecha: -1})
				.skip(start)
				.limit(limit)
				.exec(
					function (err, data) {
						if (err) {
							res.status(500).json({error: 'Error acceso a base de datos', details: err});
							return;
						} else {
							if (!data) {
								res.status(400).json({'error': 'No existe el registro con esas restricciones'});
							} else {
								res.json(data);
							}
						}
					}
				);
			/*
			} else {
				res.status(400).end('Invocación inválida');
				return;
			}
			*/
		};
	};


})(module);