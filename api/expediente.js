'use strict';

exports.expediente = function (models) {
    return function (req, res) {
        var Expediente = models.expediente();
        var procedimiento = req.params.procedimiento;
        var id = req.params.id;
        if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined') {
            Expediente.findOne({idexpediente: id, procedimiento: procedimiento}, 'idexpediente procedimiento fechainicio fechafin', function (err, data) {
                if (err) {
                    console.error('Error al buscar el expediente');
                    res.status(500).end();
                    return;
                } else {
                    console.log(data);
                    res.json(data);
                }
            });
        } else {
            console.error('Invocación inválida en la búsqueda del expediente');
            res.status(500).end();
            return;
        }
    };
};

exports.deleteExpediente = function (models) {
    return function (req, res) {
        var Expediente = models.expediente();
        var procedimiento = req.params.procedimiento;
        var id = req.params.id;
        if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined') {
            Expediente.remove({idexpediente: id, procedimiento: procedimiento}, function (err, numBorrados) {
                if (err) {
                    console.error('Error al buscar el expediente');
                    res.status(500).end();
                    return;
                } else {
                    console.log('Eliminado '+numBorrados);
                    res.json(numBorrados);
                }
            });
        } else {
            console.error('Invocación inválida al borrar el expediente');
            res.status(500).end();
            return;
        }
    };
};

exports.initExpediente = function (models) {
    return function (req, res) {
        var Expediente = models.expediente();
        var procedimiento = req.params.procedimiento;
        var id = req.body.id;
        var usr = req.body.usr;
        var fechaInicio = req.body.fecha_inicio;
        if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined' && typeof fechaInicio !== 'undefined'
                && typeof usr !== 'undefined' && !isNaN(parseInt(fechaInicio))) {
            var expediente = new Expediente();
            expediente.idexpediente = id;
            expediente.procedimiento = procedimiento;
            expediente.fechainicio = fechaInicio;
            expediente.save(function (err) {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error inicializando expediente ' + id);
                    res.end();
                } else {
                    res.json(expediente);
                }
            });
        } else {
            console.error('Invocación inválida para la inicialización de un expediente');
            res.status(500);
            res.end();
            return;
        }
    };
};

exports.updateExpediente = function (models) {
    return function (req, res) {
        var Expediente = models.expediente();
        var procedimiento = req.params.procedimiento;
        var id = req.params.id;
        if (typeof procedimiento !== 'undefined' && typeof id !== 'undefined') {
            var fechaFin = req.body.fecha_fin;
            if (typeof fechaFin !== 'undefined' && !isNaN(fechaFin)) {
                Expediente.update({idexpediente: id, procedimiento: procedimiento}, {fechafin: fechaFin}, {upsert: false, multi: false}, function (err, filesAffected, expediente) {
                    if (err) {
                        console.error('No se ha podido actualizar el expediente ' + id);
                        res.status(500).end();
                        return;
                    } else {
                        res.json(expediente);
                    }
                });
            } else {
                var fechaSuspension = req.body.fecha_suspension;
                if (typeof fechaSuspension !== 'undefined' && !isNaN(parseInt(fechaSuspension))) {

                } else {
                    var fechaFinSuspension = req.body.fecha_finsuspension;
                    if (typeof fechaFinSuspension !== 'undefined' && !isNaN(parseInt(fechaFinSuspension))) {

                    } else {
                        console.error('Invocación inválida para el expediente');
                        res.status(500);
                        res.end();
                        return;
                    }
                }
            }
        }
    };
};