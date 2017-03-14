(function(module){

	'use strict';

	/* TODO: better check&clean input, add ACL */

	module.exports.expediente = function (req, res) {
		const expediente = req.metaenvironment.models.expediente(),
			procedimiento = req.params.procedimiento,
			id = req.params.id;
		if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined'){
			expediente.findOne({idexpediente: id, procedimiento: procedimiento}, 'idexpediente procedimiento fechainicio fechafin').then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			res.status(400).json({err: 'Invocación inválida en la búsqueda del expediente'});
		}
	};

	module.exports.deleteExpediente = function (req, res) {
		const expediente = req.metaenvironment.models.expediente(),
			procedimiento = req.params.procedimiento,
			id = req.params.id;
		if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined'){
			expediente.remove({idexpediente: id, procedimiento: procedimiento}, req.eh.cbWithDefaultValue(res, {'Respuesta': 'Expediente borrado'}));
		} else {
			res.status(400).end('Invocación inválida al borrar el expediente');
		}
	};

	module.exports.initExpediente = function (req, res) {
		const expediente = req.metaenvironment.models.expediente(),
			procedimiento = req.params.procedimiento,
			id = req.body.id,
			usr = req.body.usr,
			fechaInicio = req.body.fecha_inicio;

		if (typeof procedimiento !== 'undefined' &&
			typeof id !== 'undefined' &&
			typeof fechaInicio !== 'undefined' &&
			typeof usr !== 'undefined' &&
			!isNaN(parseInt(fechaInicio, 10))
			){
			expediente.findOne({idexpediente: id, procedimiento: procedimiento}, 'idexpediente procedimiento',
				function (err, data) {
					if (err) {
						res.status(500).json({'error': 'Error al buscar el expediente'});
					} else if (data) {
						res.status(400).json({'error': 'Ya existe el expediente con el identificador y procedimiento indicados'});
					} else {
						const expedienteobj = {
							idexpediente: id,
							procedimiento: procedimiento,
							fechainicio: fechaInicio
						};
						
						expediente.create(expedienteobj, req.eh.cbWithDefaultValue(res, expedienteobj));
					}
				}
			);
		} else {
			res.status(400).json({error: 'Invocación inválida para la inicialización de un expediente'});
		}
	};

	module.exports.updateExpediente = function (req, res) {
		const expediente = req.metaenvironment.models.expediente(),
			procedimiento = req.params.procedimiento,
			id = req.body.id;
		if (typeof procedimiento === 'string' && typeof id === 'string') {
			const fechaFin = req.body.fecha_fin;
			if (typeof fechaFin === 'string' && !isNaN(parseInt(fechaFin, 10))){
				expediente.update(
					{idexpediente: id, procedimiento: procedimiento},
					{$set: {fechafin: parseInt(fechaFin, 10)}},
					{upsert: false, multi: false},
					req.eh.cbWithDefaultValue(res, {'Respuesta': 'Expediente finalizado'})
				);
			} else {
				const fechaSuspension = req.body.fecha_suspension;
				if (typeof fechaSuspension === 'string' && !isNaN(parseInt(fechaSuspension, 10))) {
					expediente.findOne({idexpediente: id, procedimiento: procedimiento}, {}, function (err, exp) {
						if (err) {
							res.status(500).json({error: 'No se ha podido suspender el expediente ' + id});
						} else if (exp) {
								const pos = exp.periodossuspension.length;
								if (pos > 0) {
									if (!exp.periodossuspension[pos - 1].fechareinicio) {
										res.status(400).json({error: 'Este expediente ya se encuentra en suspensión'});

										return;
									}
								}
								expediente.update(
									{idexpediente: id, procedimiento: procedimiento},
									{$push: {periodossuspension: {fechasuspension: fechaSuspension, fechareinicio: null}}},
									req.eh.cbWithDefaultValue(res, {'Respuesta': 'Expediente suspendido'})
								);
						} else {
							res.status(400).json({error: 'El expediente indicado no existe'});
						}
					});
				} else {
					const fechaFinSuspension = req.body.fecha_finsuspension;
					if (typeof fechaFinSuspension === 'string' && !isNaN(parseInt(fechaFinSuspension, 10))) {
						expediente.findOne({idexpediente: id, procedimiento: procedimiento}, {}, function (err, exp) {
							if (err) {
								res.status(500).json({error: 'No se ha podido suspender el expediente ' + id});
							} else {
								const pos = exp.periodossuspension.length;
								if (pos > 0) {
									if (exp.periodossuspension[pos - 1].fechareinicio) {
										res.status(400).json({error: 'Este expediente ya ha sido reiniciado'});

										return;
									}
									exp.periodossuspension[pos - 1].fechareinicio = fechaFinSuspension;
									expediente.update(
										{idexpediente: id, procedimiento: procedimiento},
										{$set: {periodossuspension: exp.periodossuspension}},
										req.eh.cbWithDefaultValue(res, {'Respuesta': 'Expediente reiniciado'})
									);
								} else {
									res.status(400).json({error: 'Este expediente no ha sido previamente suspendido'});
								}
							}
						});
					} else {
						res.status(400).json({error: 'Invocación inválida para el actualización del expediente'});
					}
				}
			}
		}
	};
})(module);
