(function(module){

'use strict';

module.exports.expediente = function (models) {
	return function (req, res) {
		var Expediente = models.expediente();
		var procedimiento = req.params.procedimiento;
		var id = req.params.id;
		if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined') {
			Expediente.findOne({idexpediente: id, procedimiento: procedimiento}, 'idexpediente procedimiento fechainicio fechafin',
				function (err, data) {
					if (err) {
						res.status(500).end('Error al buscar el expediente');
						return;
					} else {
						if (!data) {
							res.json({'error': 'No existe el expediente con el identificador y procedimiento indicados'});
						} else {
							res.json(data);
						}
					}
				}
			);
		} else {
			res.status(500).end('Invocación inválida en la búsqueda del expediente');
			return;
		}
	};
};

/* TODO: better check&clean input */
module.exports.deleteExpediente = function (models) {
	return function (req, res) {
		var Expediente = models.expediente();
		var procedimiento = req.params.procedimiento;
		var id = req.params.id;
		if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined') {
			Expediente.remove({idexpediente: id, procedimiento: procedimiento},
				function (err) {
					if (err) {
						res.status(500).end('Error al buscar el expediente');
						return;
					} else {
						res.json({'Respuesta': 'Expediente borrado'});
					}
				}
			);
		} else {
			res.status(500).end('Invocación inválida al borrar el expediente');
			return;
		}
	};
};

module.exports.initExpediente = function (models) {
	return function (req, res) {
		var Expediente = models.expediente();
		var procedimiento = req.params.procedimiento;
		var id = req.body.id;
		var usr = req.body.usr;
		var fechaInicio = req.body.fecha_inicio;
		if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined' && typeof fechaInicio !== 'undefined'
				&& typeof usr !== 'undefined' && !isNaN(parseInt(fechaInicio))) {
			Expediente.findOne({idexpediente: id, procedimiento: procedimiento}, 'idexpediente procedimiento',
				function (err, data) {
					if (err) {
						res.status(500).end('Error al buscar el expediente');
						return;
					} else if (!data) {
						var expediente = new Expediente();
						expediente.idexpediente = id;
						expediente.procedimiento = procedimiento;
						expediente.fechainicio = fechaInicio;
						expediente.save(function (error) {
							if (error) {
								res.status(500).end('Error inicializando expediente ' + id);
							} else {
								res.json(expediente);
							}
						});
					} else {
						res.json({'error': 'Ya existe el expediente con el identificador y procedimiento indicados'});
					}
				}
			);
		} else {
			res.status(500).end('Invocación inválida para la inicialización de un expediente');
			return;
		}
	};
};

module.exports.updateExpediente = function (models) {
	return function (req, res) {
		var Expediente = models.expediente();
		var procedimiento = req.params.procedimiento;
		var id = req.params.id;
		if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined') {
			var fechaFin = req.body.fecha_fin;
			if (typeof fechaFin !== 'undefined' && !isNaN(fechaFin)) {
				Expediente.update({idexpediente: id, procedimiento: procedimiento}, {fechafin: fechaFin}, {upsert: false, multi: false},
					function (err) {
						if (err) {
							res.status(500).end('No se ha podido actualizar el expediente ' + id);
							return;
						} else {
							res.json({'Respuesta': 'Expediente finalizado'});
						}
					}
				);
			} else {
				var fechaSuspension = req.body.fecha_suspension;
				if (typeof fechaSuspension !== 'undefined' && !isNaN(parseInt(fechaSuspension))) {
					Expediente.findOne({idexpediente: id, procedimiento: procedimiento}, {}, function (err, expediente) {
						if (err) {
							res.status(500).end('No se ha podido suspender el expediente ' + id);
							return;
						} else {
							if (!expediente) {
								res.json({'error': 'El expediente indicado no existe'});
								return;
							}
							var pos = expediente.periodossuspension.length;
							if (pos > 0) {
								if (!expediente.periodossuspension[pos - 1].fechareinicio) {
									res.json({'error': 'Este expediente ya se encuentra en suspensión'});
									return;
								}
							}
							Expediente.update(
								{idexpediente: id, procedimiento: procedimiento},
								{$addToSet: {periodossuspension: {fechasuspension: fechaSuspension, fechareinicio: null }}},
								function (error) {
									if (error) {
										res.status(500).end('No se ha podido suspender el expediente ' + id);
										return;
									} else {
										res.json({'Respuesta': 'Expediente suspendido'});
									}
							});
						}
					});
				} else {
					var fechaFinSuspension = req.body.fecha_finsuspension;
					if (typeof fechaFinSuspension !== 'undefined' && !isNaN(parseInt(fechaFinSuspension))) {
						Expediente.findOne({idexpediente: id, procedimiento: procedimiento}, {}, function (err, expediente) {
							if (err) {
								res.status(500).end('No se ha podido suspender el expediente ' + id);
								return;
							} else {
								var pos = expediente.periodossuspension.length;
								if (pos > 0) {
									if (expediente.periodossuspension[pos - 1].fechareinicio) {
										res.json({'error': 'Este expediente ya ha sido reiniciado'});
										return;
									}
								} else {
									res.json({'error': 'Este expediente no ha sido previamente suspendido'});
									return;
								}
								expediente.periodossuspension[pos - 1].fechareinicio = fechaFinSuspension;
								Expediente.update(
									{idexpediente: id, procedimiento: procedimiento},
									{periodossuspension: expediente.periodossuspension},
									function (erro) {
										if (erro) {
											res.status(500).end('No se ha podido suspender el expediente ' + id);
											return;
										} else {
											res.json({'Respuesta': 'Expediente reiniciado'});
										}
									}
								);
							}
						});
					} else {
						res.status(500).end('Invocación inválida para el reinicio expediente');
						return;
					}
				}
			}
		}
	};
};
})(module);
