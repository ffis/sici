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
				.sort({_id: -1})
				.skip(start)
				.limit(limit)
				.exec()
				.then(
					function (data) {
						if (!data) {
							res.status(400).json({'error': 'No existe el registro con esas restricciones'});
						} else {
							res.json(data);
						}
					},
					function(err){
						res.status(500).json({error: 'Error acceso a base de datos', details: err});
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