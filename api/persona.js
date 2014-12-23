process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

exports.personasByPuesto = function (models) {
    return function (req, res) {
        var Persona = models.persona();
        var restriccion = {};
        if (typeof req.params.cod_plaza !== 'undefined')
            restriccion.codplaza = req.params.cod_plaza;
        Persona.find(restriccion, function (err, data) {
            if (err) {
                console.error(restriccion);
                console.error(err);
                res.status(500);
                res.end();
                return;
            }
            res.json(data);
        });
    };
};

exports.personasByLogin = function (models) {
    return function (req, res) {
        var Persona = models.persona();
        var restriccion = {};
        if (typeof req.params.login !== 'undefined')
            restriccion.login = req.params.login;
        Persona.find(restriccion, function (err, data) {
            if (err) {
                console.error(restriccion);
                console.error(err);
                res.status(500);
                res.end();
                return;
            }
            res.json(data);
        });
    };
};

exports.updatePersona = function (models) {
    return function (req, res) {
        var Persona = models.persona();
        var id = req.params.id;

        var content = req.body;
        Persona.update({'_id': id}, content, {upsert: true}, function (e) {
            if (e) {
                res.send({'error': 'An error has occurred'});
            } else {
                res.send(content);
            }
        });
    };
};

exports.newPersona = function (models) {
    return function (req, res) {
        var Persona = models.persona();
        var content = req.body;
        new Persona(content).save(function (e) {
            if (e) {
                res.send({'error': 'An error has occurred'});
            } else {
                res.send(content);
            }
        });
    };
};

exports.personasByRegex = function (models, Q) {
    return function (req, res) {
        var Persona = models.persona();
        var restriccion = {};
        if (typeof req.params.regex !== 'undefined') {
            restriccion = {
                "$or": [
                    {
                        "login": {
                            "$regex": "^" + req.params.regex + "",
                            "$options": "i"
                        }},
                    {
                        "codplaza": {
                            "$regex": "^" + req.params.regex + "",
                            "$options": "i"
                        }},
                    {
                        "nombre": {
                            "$regex": "^" + req.params.regex + "",
                            "$options": "i"
                        }},
                    {
                        "apellidos": {
                            "$regex": "^" + req.params.regex + "",
                            "$options": "i"
                        }}
                ]
            };
            Persona.find(restriccion, function (err, data) {
                if (err) {
                    console.error(restriccion);
                    console.error(err);
                    res.status(500);
                    res.end();
                    return;
                }
                if (data.length === 0) {
                    var regLogin = new RegExp(/[a-z]{3}\d{2}[a-z]{1}/);
                    if (regLogin.test(req.params.regex)) {
                        exports.infoByLogin(req.params.regex, Q).then(function (result) {
                            if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0) && (result.return[2].key === 'ERR_MSG')) {
                                var msg = result.return[2].value;
                                var valores = /(\d{2})\.-(.*)/g.exec(msg);
                                if (valores !== null) {
                                    if (valores[1] !== '00') {
                                        console.error(valores[2]);
                                        res.json(data);
                                        return;
                                    } else {
                                        var nuevaPersona = new Persona();
                                        nuevaPersona.codplaza = result.return[1].value;
                                        nuevaPersona.login = req.params.regex;
                                        nuevaPersona.nombre = result.return[0].value;
                                        nuevaPersona.apellidos = result.return[6].value + " " + result.return[5].value;
                                        nuevaPersona.telefono = result.return[7].value;
                                        nuevaPersona.habilitado = false;
                                        nuevaPersona.save(function (err) {
                                            if (err) {
                                                console.err(err);
                                                res.json(data);
                                            } else {
                                                var output = [{'login': nuevaPersona.login, 'codplaza': nuevaPersona.codplaza, 'nombre': nuevaPersona.nombre, 'apellidos': nuevaPersona.apellidos}];
                                                console.log('Nuevo usuario registrado: ' + JSON.stringify(output));
                                                res.json(output);
                                            }
                                        });
                                    }
                                } else {
                                    console.log(err);
                                    res.json(data);
                                    return;
                                }
                            }
                        }, function (err) {
                            console.log(err);
                        });
                    } else {
                        var regPlaza = new RegExp(/[A-Z]{2}\d{5}/);
                        if (regPlaza.test(req.params.regex)) {
                            exports.registroPersonaWS(req.params.regex, models, Q).then(function(data) {
								res.json(data);
							}, function(err) {
								res.json(data);
							});
                        } else {
                            res.json(data);
                        }
                    }
                }
                res.json(data);
            });
        } else {
            res.status(500).end();
            return;
        }
    };
};

exports.registroPersonaWS(codplaza, models, Q) {
	var deferRegistro = Q.defer();
	var Persona = models.persona();
	Persona.count({'codplaza': codplaza}, function(err, count) {
		if (count !== 0) {
			exports.infoByPlaza(codplaza, Q).then(function (result) {
				if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0) && (result.return[2].key === 'ERR_MSG')) {
					var msg = result.return[2].value;
					var valores = /(\d{2})\.-(.*)/g.exec(msg);
					if (valores !== null) {
						if (valores[1] !== '00') {
							console.error(valores[2]);
							deferRegistro.reject();
							return;
						} else {
							var nuevaPersona = new Persona();
							nuevaPersona.codplaza = req.params.regex;
							nuevaPersona.login = result.return[0].value;
							nuevaPersona.nombre = result.return[1].value;
							nuevaPersona.apellidos = result.return[6].value + " " + result.return[5].value;
							nuevaPersona.telefono = result.return[7].value;
							nuevaPersona.habilitado = false;
							nuevaPersona.save(function (err) {
								if (err) {
									console.err(err);
									deferRegistro.reject();
								} else {
									var output = [{'login': nuevaPersona.login, 'codplaza': nuevaPersona.codplaza, 'nombre': nuevaPersona.nombre, 'apellidos': nuevaPersona.apellidos}];
									console.log('Nuevo usuario registrado: ' + JSON.stringify(output));
									deferRegistro.resolve(output);
								}
							});
						}
					} else {
						console.log(err);
						deferRegistro.reject();
						return;
					}
				} else {
					deferRegistro.reject();
				}
			});
		} else {
			deferRegistro.reject();
		}
	});
	return deferRegistro.promise;
};

var soap = require('soap');

exports.infoByLogin2 = function () {
    return function (req, res) {
        var login = req.params.login;
        var url = 'https://jad.carm.es/jAD/webservice/WSGesper/wsSICI?wsdl';
        var args = {arg0: {key: 'p_login', value: login}};
        var options = {
            ignoredNamespaces: {
                namespaces: ['tns']
            }
        };
        soap.createClient(url, options, function (err, client) {
            if (err) {
                console.error(JSON.stringify(err));
                res.status(500).end(err);
            } else {
                client.SacaPlaza(args, function (err, result) {
                    if (err) {
                        console.error('Error buscando login en WS');
                        res.json(result);
                    } else {
                        console.log('Consulto el login ' + login);
                        res.json(result);
                    }
                });
            }
        });
    };
};

exports.infoByLogin = function (login, Q) {
    var def = Q.defer();
    var url = 'https://jad.carm.es/jAD/webservice/WSGesper/wsSICI?wsdl';
    var args = {arg0: {key: 'p_login', value: login}};
    var options = {
        ignoredNamespaces: {
            namespaces: ['tns']
        }
    };
    soap.createClient(url, options, function (err, client) {
        if (err) {
            console.error(JSON.stringify(err));
            def.reject(err);
        } else {
            client.SacaPlaza(args, function (err, result) {
                if (err) {
                    console.error('Error buscando login en WS');
                    def.resolve(null);
                } else {
                    console.log('Consulto el login ' + login);
                    def.resolve(result);
                }
            });
        }
    });
    return def.promise;
};

exports.infoByPlaza = function (codplaza, Q) {
    var def = Q.defer();
    var url = 'https://jad.carm.es/jAD/webservice/WSGesper/wsSICI?wsdl';
    var args = {arg0: {key: 'P_PLAZA', value: codplaza}};
    var options = {
        ignoredNamespaces: {
            namespaces: ['tns']
        }
    };
    soap.createClient(url, options, function (err, client) {
        if (err) {
            console.error(JSON.stringify(err));
            def.reject(err);
        } else {
            client.SacaOcupante(args, function (err, result) {
                if (err) {
                    console.error('Error buscando plaza en WS');
                    def.resolve(null);
                } else {
                    def.resolve(result);
                }
            });
        }
    });
    return def.promise;
};

exports.updateCodPlazaByLogin = function (models, Q) {
    return function (req, res) {
        var Persona = models.persona();
        var filas = [];
        var promesasActualizacion = [];
        Persona.find({habilitado: true}).sort({ultimoupdate: 1}).limit(1).exec(function (err, personas) {
            console.log(personas);
            personas.forEach(function (persona) {
                var promesaUpdate = Q.defer();
                promesasActualizacion.push(promesaUpdate.promise);
                exports.infoByLogin(persona.login, Q).then(function (result) {
                    if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0)) {
                        var msg = result.return[2].value;
                        var valores = /(\d{2})\.-(.*)/g.exec(msg);
                        if (valores !== null) {
                            if (valores[1] === '00') {
                                var codplaza = result.return[1].value;
                                if (codplaza !== persona.codplaza) {
                                    var fila = {'login': persona.login, 'codplaza prev': persona.codplaza, 'codplaza desp': codplaza};
                                    filas.push(fila);
                                    persona.codplaza = codplaza;
                                } else {
                                    console.log('No se modifica el código de plaza del usuario: ' + persona.login);
                                }
                                var telefono = result.return[7].value;
                                persona.telefono = telefono;
                            }
                        }
                    }
                    persona.ultimoupdate = new Date();
                    console.log(persona);
                    persona.save(function (err) {
                        if (err) {
                            console.error('NO se ha podido actualizar el usuario ' + persona.login + '. Error: ' + err);
                            promesaUpdate.reject(err);
                        } else {
                            console.log('Se ha actualizado el usuario ' + persona.login + ': ' + persona.codplaza);
                            promesaUpdate.resolve(fila);
                        }
                    });
                }, function (err) {
                    console.error(err);
                    res.status(500).end();
                });
            });
            Q.all(promesasActualizacion).then(function () {
                res.json(filas);
            }, function (err) {
                res.status(500).end();
            });
        });

    };
};

function transformExcel2Persona(objeto, models, Q) {

    var Persona = models.persona();
    var persona = {
        'codplaza': objeto.puesto.trim(),
        'login': objeto.login.trim(),
        'nombre': objeto.nombre.trim(),
        'apellidos': objeto.apellido1 + ' ' + objeto.apellido2,
        'habilitado': false,
    };

    if (persona.codplaza == 'JS00348' || persona.login == 'asc17v')
    {
        console.log(persona);
    }

    var dpersonaresultado = Q.defer();
    var ppersonaresultado = dpersonaresultado.promise;

    var informeresultado = {
        actualizado: true,
        persona: ppersonaresultado
    };

    Persona.find({'login': persona.login}, function (err, personas) {
        if (err) {
            dpersonaresultado.reject(err);
        }
        else {
            if (personas.length > 0) {
                informeresultado.actualizado = true;
                personas[0].login = persona.login;
                personas[0].codplaza = persona.codplaza;
                personas[0].nombre = persona.nombre;
                personas[0].apellidos = persona.apellidos;
                informeresultado.persona = personas[0];
                dpersonaresultado.resolve(informeresultado);
            } else {
                informeresultado.actualizado = false;
                var p = new Persona(persona);
                dpersonaresultado.resolve(informeresultado);
            }
        }
    });

    return informeresultado;
}

var XLSX = require('xlsx');

function parseExcelGesper(path, worksheetName, maxrows, models, Q) {
    var turnObjToArray = function (obj) {
        return [].map.call(obj, function (element) {
            return element;
        })
    };


    var workbook = XLSX.readFile(path);
    var worksheet = workbook.Sheets[worksheetName];
    var cabecera = [];
    var fields = {lista: [], tipos: {}};
    var objetos = [];
    var jerarquias = [];

    var procesados = 0;

    for (var fila = 1; fila < maxrows; fila++)
    {
        if (fila == 1)
        {
            //cabecera
            for (var columna = 0; columna < 55550; columna++)
            {
                var n = getColumn(columna);
                if (n == 'H')
                    break;
                var idx = getColumn(columna) + fila;
                var campo = typeof worksheet[idx] === 'undefined' ? '' : worksheet[idx].v.trim()
                        .replace('.', '_').replace('.', '_').replace('.', '_')
                        .replace('Ó', 'O').replace('ó', 'o')
                        .replace('í', 'i').replace('Í', 'I')
                        .replace('á', 'a').replace('á', 'a')
                        .replace('á', 'a').replace('é', 'e')
                        ;

                if (campo == '')
                    break;
                fields.lista.push(campo);
                fields.tipos[campo] = (typeof fields.tipos[campo] != 'undefined') ? 'array' : 'object';
            }
        } else {

            var objeto = {};

            for (var columna = 0, maxcolumna = fields.lista.length; columna < maxcolumna; columna++) {
                var n = getColumn(columna);
                if (n == 'H')
                    break;
                var idx = getColumn(columna) + fila;
                var valor = typeof worksheet[idx] === 'undefined' ? {t: '', v: ''} : worksheet[idx];

                if (valor.t == 's') {
                    valor.v = valor.v.replace("\\r\\n", "");
                }

                var campo = fields.lista[columna];
                var tipo = fields.tipos[campo];

                if (tipo === 'array') {
                    valor.v = parseStr2Int(valor.v);
                }

                if (typeof objeto[campo] === 'undefined')
                {
                    if (tipo == 'array' || tipo == 'object')
                        objeto[campo] = (tipo === 'array' ? [valor.v] : valor.v);
                } else {
                    if (!Array.isArray(objeto[campo])) {
                        console.error(campo + " deberia ser un array");
                        continue;
                    }
                    objeto[campo].push(valor.v);
                }
            }

            if (objeto['login'] || objeto['puesto']) {
                procesados++;
                objeto = transformExcel2Persona(objeto, models, Q);
                if (!objeto)
                    break;
                objetos.push(objeto);
            }
        }
    }
    console.log(fields);
    return objetos;
}

exports.importarGesper = function (models, Q) {
    return function (req, res) {
        //var path = 'e:\\temp\\basura\\universo.xlsx';
        var path = '/tmp/universo.xlsx';
        var hoja = 'salida1';
        var maxrows = 10000;

        var Persona = models.persona();
        var operacionesGesper = parseExcelGesper(path, hoja, maxrows, models, Q);
        var promesas = [];
        var resultado = [];

        for (var i = 0; i < operacionesGesper.length; i++) {
            promesas.push(operacionesGesper[i].persona);
        }

        console.log('esperando promesas');
        for (var i = 0; i < promesas.length; i++) {
            promesas[i].then(
                    function (informeresultado) {
                        var persona = informeresultado.persona;
                        if (persona.login == 'asc17v') {
                            console.log('Promesa ');
                            console.log(persona);
                        }
                        if (informeresultado.actualizada)
                            persona.update(function (err) {
                                if (err)
                                    console.error("Error importando persona. Actualización fallida. " + err);
                                else
                                    console.error();
                                if (persona.login == 'asc17v') {
                                    console.log('Actualziada ');
                                    console.log(persona);
                                }
                            });
                        else
                            persona.save(function (err) {
                                if (err)
                                    console.error("Error importando persona. Creación fallida. " + err);
                                if (persona.login == 'asc17v') {
                                    console.log('Nueva¡¡ ');
                                    console.log(persona);
                                }
                            });

                    },
                    function (err) {
                        console.error("Error. importando persona. Reject en promesa.");
                    }
            );
        }

        Q.all(promesas).then(function (personas) {
            for (var i = 0; i < personas.length; i++) {
                resultado.push({"persona": personas[i], "actualizada": operacionesGesper[i].actualizada});
            }
            res.json(resultado);
        });
    };
};

function getColumn(x) {
    return mapping[x];
}


/* mapping for using XY coordinates on excel */
var mapping = [];
var index = 0;
for (var i = 'A'.charCodeAt(0), j = 'Z'.charCodeAt(0); i <= j; i++) {
    mapping.push(String.fromCharCode(i));
    index++;
}

for (var prefixi = 'A'.charCodeAt(0), prefixj = 'Z'.charCodeAt(0); prefixi <= prefixj; prefixi++) {
    for (var i = 'A'.charCodeAt(0), j = 'Z'.charCodeAt(0); i <= j; i++) {
        mapping.push(String.fromCharCode(prefixi) + String.fromCharCode(i));
        index++;
    }
}
for (var prefix = 'A'.charCodeAt(0), prefixk = 'Z'.charCodeAt(0); prefix <= prefixk; prefix++) {
    for (var prefixi = 'A'.charCodeAt(0), prefixj = 'Z'.charCodeAt(0); prefixi <= prefixj; prefixi++) {
        for (var i = 'A'.charCodeAt(0), j = 'Z'.charCodeAt(0); i <= j; i++) {
            mapping.push(String.fromCharCode(prefix) + String.fromCharCode(prefixi) + String.fromCharCode(i));
            index++;
        }
    }
}




exports.personassearchlist = function (models, Q)
{
    return function (req, res) {

        var Persona = models.persona();
        var Procedimiento = models.procedimiento();

        var defer_persona = Q.defer();
        var defer_procedimiento = Q.defer();


        /// 1. Buscamos personas en la tabla personas.
        Persona.find({}, {codplaza: true, login: true, nombre: true, apellidos: true}, function (err, data) {
            if (err) {
                console.error(err);
                res.status(500);
                res.end();
                defer_persona.reject(err);
            } else {

                defer_persona.resolve(data);
            }
        });

        /// 2. Buscamos personas como responsables de procedimientos ... ¡¡¡Y que no estén en el primer grupo¡¡¡
        Procedimiento.aggregate()
                .unwind("responsables")
                .group({"_id": {
                        "login": "$responsables.login",
                        "codplaza": "$responsables.codplaza"
                    },
                    "nombre": {"$first": "$responsables.nombre"},
                    "apellidos": {"$first": "$responsables.apellidos"}
                })
                .exec(function (err, data) {
                    if (err) {
                        console.error(err);
                        res.status(500);
                        res.end();
                        defer_procedimiento.reject(err);
                    } else {

                        defer_procedimiento.resolve(data);
                    }
                });

        Q.all([defer_persona.promise, defer_procedimiento.promise]).then(function (data) {
            var r = {};
            var response = [];
            var personas_by_persona = data[0];
            var personas_by_responsable = data[1];
            for (var i = 0; i < personas_by_persona.length; i++) {
                var persona = personas_by_persona[i];
                var idr = persona.login + "-" + persona.codplaza;
                r[idr] = persona;
                response.push({data: persona.login + " ; " + persona.codplaza + " ; " +
                            persona.nombre + " " + persona.apellidos});
            }
            for (var i = 0; i < personas_by_responsable.length; i++) {
                var persona = personas_by_responsable[i];
                var idr = persona._id.login + '-' + persona._id.codplaza;
                if (typeof r[idr] === 'undefined') {
                    console.log("Saltandose " + idr);
                    r[idr] = persona;
                    response.push({data: persona._id.login + " ; " + persona._id.codplaza + " ; " + persona.nombre + " " + persona.apellidos});
                }
            }

            res.json(response);
        });
    };
};


