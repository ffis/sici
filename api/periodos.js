'use strict';

exports.getPeriodo = function (models) {
    return function (req, res) {
        var periodo = models.periodo();
        var _id = req.params._id;
        if (_id)
        {
            etiqueta.findOne({'_id': id}, function (err, data) {
                if (err) {
                    console.error(err);
                    res.status(500);
                    res.end();
                    return;
                }
                res.json(data);
            });
        } else {
            periodo.find({}, function (err, data) {
                if (err) {
                    console.error(err);
                    res.status(500);
                    res.end();
                    return;
                }
                res.json(data);
            });
        }
    };
};


exports.updatePeriodo = function (models) {
    return function (req, res) {
        var periodo = models.periodo();
        var Procedimiento = models.procedimiento();
        var content = JSON.parse(JSON.stringify(req.body));
        var id = content._id;

        delete content._id;
        console.log(content);
        periodo.update({'_id': id}, content, {upsert: true}, function (e) {
            if (e) {
                res.send({'error': 'An error has occurred:' + e});
            } else {

                var set = {};
                var meses = {};
                for (var p in content) {
                    meses[p] = content[p];
                    set['periodos.' + p + '.periodoscerrados'] = meses[p];
                }
                console.log(set);
                //parche:
                //periodo 2014 tiene el valor a usar con todos los procedimientos:
                Procedimiento.update({}, {"$set": set}, {multi: true}, function (err, doc) {
                    if (err)
                        console.error(err);
                    else
                        res.send(req.body);
                });
            }
        });
    };
}

exports.newPeriodo = function (models) {
    return function (req, res) {
        var periodo = models.periodo();
        var content = req.body;
        new periodo(content).save(function (e) {
            //etiqueta.update({'_id':id}, content, { upsert: true }, function(e){
            if (e) {
                res.send({'error': 'An error has occurred'});
            } else {
                res.send(content);
            }
        });
    };
};

exports.removePeriodo = function (models) {
    return function (req, res) {
        var periodo = models.periodo();
        var id = req.params.id;
        var content = req.body;
        periodo.remove({'_id': id}, function (e) {
            if (e) {
                res.send({'error': 'An error has occurred'});
            } else {
                res.send(content);
            }
        });
    };
};



exports.nuevaAnualidad = function (models) {
    return function (req, res) {
        var Plantillaanualidad = models.plantillaanualidad();
        var plantilla = Plantillaanualidad.query({});
        var anualidad = req.params.anyo;
        if (anualidad > 2014) {
            var query = Procedimiento.findOne({'periodos.a2014': {'$exists': true}}, function (err, procedimiento) {
                if (err) {
                    res.send({'error': 'An error has occurred'});
                } else {
                    var anualidades = Object.keys(procedimiento.periodos);
                    var speriodonuevo = '';
                    for (var i = 0; i < anualidades.length; i++) {
                        if (!isNaN(parseInt(anualidades[i].replace('a', ''))))
                        {
                            var periodo = parseInt(anualidades[i].replace('a', ''));
                            periodo++;
                            var speriodonuevo = 'a' + periodo;
                        }
                    }

                    if (speriodonuevo != '') {
                        var nuevoperiodo = JSON.parse(JSON.stringify(plantilla));
                        delete nuevoperiodo._id;
                        var restriccion = {};
                        var periodos_periodo = 'periodos.' + speriodonuevo;
                        restriccion[periodos_periodo] = {'$exists': false};
                        var set = {};
                        set['$set'] = {speriodonuevo: nuevoperiodo};
                        Procedimiento.update(restriccion, set, {upsert: false, multi: true}, function (err) {
                            if (err) {
                                if (err) {
                                    console.error('nuevaAnualidad...');
                                    console.error(err);
                                    res.status(500);
                                    res.end();
                                    return;
                                }
                            } else {
                                res.json('OK');
                            }
                        });
                    }
                }
            });
        }
    };
};

