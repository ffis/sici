'use strict';

// JavaScript Document
var os = require('os');
var Crawler = false;
var Browser = false;
if (os.platform() === 'linux') {
    Crawler = require("crawler").Crawler;
    Browser = require("zombie");
}
var encoding = require("encoding");
var util = require('util');
var XLSX = require('xlsx');

function parseStr2Int(str) {
    var valor = parseInt(str);
    if (isNaN(valor))
        valor = 0;
    return valor;
}

var turnObjToArray = function (obj) {
    return [].map.call(obj, function (element) {
        return element;
    });
};

function getColumn(x) {
    return mapping[x];
}

function Workbook() {
    if (!(this instanceof Workbook))
        return new Workbook();
    this.SheetNames = [];
    this.Sheets = {};
}

exports.exportarInforme = function (models, app, md5, Q) {
    return function (req, res) {
        if ((typeof req.params.year === 'undefined') || (req.params.year === null)) {
            console.error('No se ha definido el parámetro "year"');
            res.status(500);
            res.end();
            return;
        }
        var regAnyo = new RegExp(/a2\d{3}$/);
        if (!regAnyo.test(req.params.year)) {
            console.error('Parámetro mal formado');
            res.status(500);
            res.end();
            return;
        }
        var year = req.params.year;
        var Persona = models.persona();
        var Procedimiento = models.procedimiento();
        var Jerarquia = models.jerarquia();
        var Permiso = models.permiso();
        var promesasExcel = [];
        var deferPersona = Q.defer();
        var deferProcedimiento = Q.defer();
        var deferPermiso = Q.defer();
        var deferBD = Q.defer();
        promesasExcel.push(deferPersona.promise);
        promesasExcel.push(deferProcedimiento.promise);
        promesasExcel.push(deferPermiso.promise);
        promesasExcel.push(deferBD.promise);

        // Genera hoja de usuarios
        Persona.find({}, {codplaza: true, login: true, nombre: true, apellidos: true}, function (err, data) {
            if (err) {
                console.error(err);
                res.status(500);
                res.end();
                deferPersona.reject(err);
            } else {
                var ws = {};
                var cellHeaderNombre = {v: 'Nombre', t: 's'};
                var cellHeaderNombreRef = XLSX.utils.encode_cell({c: 0, r: 0});
                ws[cellHeaderNombreRef] = cellHeaderNombre;
                var cellHeaderApellidos = {v: 'Apellidos', t: 's'};
                var cellHeaderApellidosRef = XLSX.utils.encode_cell({c: 1, r: 0});
                ws[cellHeaderApellidosRef] = cellHeaderApellidos;
                var cellHeaderLogin = {v: 'Login', t: 's'};
                var cellHeaderLoginRef = XLSX.utils.encode_cell({c: 2, r: 0});
                ws[cellHeaderLoginRef] = cellHeaderLogin;
                var cellHeaderPlaza = {v: 'Código plaza', t: 's'};
                var cellHeaderPlazaRef = XLSX.utils.encode_cell({c: 3, r: 0});
                ws[cellHeaderPlazaRef] = cellHeaderPlaza;
                for (var i = 0; i < data.length; i++) {
                    var persona = data[i];
                    var cellNombre = {v: persona.nombre, t: 's'};
                    var cellNombreRef = XLSX.utils.encode_cell({c: 0, r: i + 1});
                    ws[cellNombreRef] = cellNombre;
                    var cellApellidos = {v: persona.apellidos, t: 's'};
                    var cellApellidosRef = XLSX.utils.encode_cell({c: 1, r: i + 1});
                    ws[cellApellidosRef] = cellApellidos;
                    var cellLogin = {v: persona.login, t: 's'};
                    var cellLoginRef = XLSX.utils.encode_cell({c: 2, r: i + 1});
                    ws[cellLoginRef] = cellLogin;
                    var cellPlaza = {v: persona.codplaza, t: 's'};
                    var cellPlazaRef = XLSX.utils.encode_cell({c: 3, r: i + 1});
                    ws[cellPlazaRef] = cellPlaza;
                }
                var range = {s: {c: 0, r: 0}, e: {c: 4, r: data.length + 1}};
                ws['!ref'] = XLSX.utils.encode_range(range);
                deferPersona.resolve({'wsName': 'Usuarios', 'sheet': ws});
            }
        });
        var procedimientos;
        // Genera hoja de procedimientos
        Procedimiento.find({}, {codigo: true, denominacion: true, idjerarquia: true, responsables: true, cod_plaza: true, periodos: true, ancestros: true}, function (err, data) {
            if (err) {
                console.error(err);
                res.status(500);
                res.end();
                deferProcedimiento.reject(err);
            } else {
                procedimientos = data;
                var incidencias = ["Aumenta el N de expedientes pendientes", "Hay expedientes prescritos/caducados", "Hay quejas presentadas",
                    "Las solicitudes aumentan al menos 20%", "Se han resuelto expedientes fuera de Plazo"];
                var indicadoresDatabase = ["solicitados", "iniciados", "quejas", "recursos", "resueltos_1", "resueltos_5", "resueltos_10", "resueltos_15", "resueltos_30",
                    "resueltos_45", "resueltos_mas_45", "resueltos_desistimiento_renuncia_caducidad", "resueltos_prescripcion", "en_plazo", "t_medio_habiles", "t_medio_naturales",
                    "total_resueltos", "fuera_plazo", "pendientes"];
                var indicadores = ["Solicitados", "Iniciados", "Quejas presentadas en el mes", "Recursos presentados en el mes", "Resueltos < 1", "Resueltos 1 < 5",
                    "Resueltos 5 < 10", "Resueltos 10 < 15", "Resueltos 15 < 30", "Resueltos 30 < 45", "Resueltos > 45",
                    "Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)", "Resueltos por Prescripción/Caducidad (Resp. Admón.)",
                    "En plazo", "Tiempo medio en días hábiles descontando Tiempo de suspensiones", "Tiempo medio en días naturales",
                    "Resueltos totales", "Fuera de plazo", "Pendientes"];
                var meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                var ws = {};
                var promesasNombreJerarquia = [];
                var posInicial = 6;
                for (var i = 0; i < indicadores.length; i++) {
                    var cellIndicador = {v: indicadores[i], t: 's'};
                    var cellIndicadorRef = XLSX.utils.encode_cell({c: posInicial + i * meses.length + 6, r: 0});
                    ws[cellIndicadorRef] = cellIndicador;
                    for (var mes = 0; mes < meses.length; mes++) {
                        var cellMes = {v: meses[mes], t: 's'};
                        var cellMesRef = XLSX.utils.encode_cell({c: posInicial + i * meses.length + mes, r: 1});
                        ws[cellMesRef] = cellMes;
                    }
                }
                for (var i = 0; i < incidencias.length; i++) {
                    var cellIndicador = {v: incidencias[i], t: 's'};
                    var cellIndicadorRef = XLSX.utils.encode_cell({c: posInicial + indicadores.length * meses.length + i * meses.length + 6, r: 0});
                    ws[cellIndicadorRef] = cellIndicador;
                    for (var mes = 0; mes < meses.length; mes++) {
                        var cellMes = {v: meses[mes], t: 's'};
                        var cellMesRef = XLSX.utils.encode_cell({c: posInicial + indicadores.length * meses.length + i * meses.length + mes, r: 1});
                        ws[cellMesRef] = cellMes;
                    }
                }
                var cellHeaderCodigo = {v: 'Código', t: 's'};
                var cellHeaderCodigoRef = XLSX.utils.encode_cell({c: 0, r: 1});
                ws[cellHeaderCodigoRef] = cellHeaderCodigo;
                var cellHeaderDenominacion = {v: 'Denominación', t: 's'};
                var cellHeaderDenominacionRef = XLSX.utils.encode_cell({c: 1, r: 1});
                ws[cellHeaderDenominacionRef] = cellHeaderDenominacion;
                var cellHeaderIdJerarquia = {v: 'Id Jerarquía', t: 's'};
                var cellHeaderIdJerarquiaRef = XLSX.utils.encode_cell({c: 2, r: 1});
                ws[cellHeaderIdJerarquiaRef] = cellHeaderIdJerarquia;
                var cellHeaderNombreJerarquia = {v: 'Jerarquía', t: 's'};
                var cellHeaderNombreJerarquiaRef = XLSX.utils.encode_cell({c: 3, r: 1});
                ws[cellHeaderNombreJerarquiaRef] = cellHeaderNombreJerarquia;
                var cellHeaderResponsable = {v: 'Responsable', t: 's'};
                var cellHeaderResponsableRef = XLSX.utils.encode_cell({c: 4, r: 1});
                ws[cellHeaderResponsableRef] = cellHeaderResponsable;
                var cellHeaderOculto = {v: 'Oculto', t: 's'};
                var cellHeaderOcultoRef = XLSX.utils.encode_cell({c: 5, r: 1});
                ws[cellHeaderOcultoRef] = cellHeaderOculto;
                for (var i = 0; i < procedimientos.length; i++) {
                    var procedimiento = procedimientos[i];
                    var cellCodigo = {v: procedimiento.codigo, t: 's'};
                    var cellCodigoRef = XLSX.utils.encode_cell({c: 0, r: i + 2});
                    ws[cellCodigoRef] = cellCodigo;
                    var cellDenominacion = {v: procedimiento.denominacion, t: 's'};
                    var cellDenominacionRef = XLSX.utils.encode_cell({c: 1, r: i + 2});
                    ws[cellDenominacionRef] = cellDenominacion;
                    var cellIdJerarquia = {v: procedimiento.idjerarquia, t: 'n'};
                    var cellIdJerarquiaRef = XLSX.utils.encode_cell({c: 2, r: i + 2});
                    ws[cellIdJerarquiaRef] = cellIdJerarquia;
                    var cellResponsable = {v: procedimiento.cod_plaza, t: 's'};
                    var cellResponsableRef = XLSX.utils.encode_cell({c: 4, r: i + 2});
                    ws[cellResponsableRef] = cellResponsable;
                    var cellOculto = {v: ((typeof procedimiento.oculto !== 'undefined' && procedimiento.oculto === true) ? 'SÍ' : 'NO'), t: 's'};
                    var cellOcultoRef = XLSX.utils.encode_cell({c: 5, r: i + 2});
                    ws[cellOcultoRef] = cellOculto;
                    for (var ind = 0; ind < indicadores.length; ind++) {
                        if (typeof procedimiento.periodos[year][indicadoresDatabase[ind]] !== 'undefined') {
                            for (var mes = 0; mes < 12; mes++) {
                                var cellValue = {v: procedimiento.periodos[year][indicadoresDatabase[ind]][mes], t: 'n'};
                                var cellValueRef = XLSX.utils.encode_cell({c: posInicial + ind * 12 + mes, r: i + 2});
                                ws[cellValueRef] = cellValue;
                            }
                        }
                    }
                    for (var ind = 0; ind < incidencias.length; ind++) {
                        if (typeof procedimiento.periodos[year].Incidencias !== 'undefined') {
                            for (var mes = 0; mes < 12; mes++) {
                                var cellValue = {v: procedimiento.periodos[year].Incidencias[incidencias[ind]][mes], t: 'n'};
                                var cellValueRef = XLSX.utils.encode_cell({c: posInicial + indicadores.length * meses.length + ind * 12 + mes, r: i + 2});
                                ws[cellValueRef] = cellValue;
                            }
                        }
                    }
                    var deferNombreJerarquia = Q.defer();
                    promesasNombreJerarquia.push(deferNombreJerarquia.promise);
                    Jerarquia.findOne({'id': procedimiento.idjerarquia}, {nombrelargo: true}, cb(deferNombreJerarquia, i + 2, 3, ws));
                }
                Q.all(promesasNombreJerarquia).then(function () {
                    var range = {s: {c: 0, r: 0}, e: {c: 6 + (indicadores.length + incidencias.length) * meses.length, r: procedimientos.length + 2}};
                    ws['!ref'] = XLSX.utils.encode_range(range);
                    deferProcedimiento.resolve({'wsName': 'Procedimientos', 'sheet': ws});
                }, function (err) {
                    console.error(err);
                    res.status(500);
                    res.end();
                    deferProcedimiento.reject(err);
                });
            }
        });

        // Genera hoja de permisos
        Permiso.find({}, {login: true, codplaza: true, jerarquiadirectalectura: true, jerarquiadirectaescritura: true}, function (err, data) {
            if (err) {
                console.error(err);
                res.status(500);
                res.end();
                deferPermiso.reject(err);
            } else {
                var ws = {};
                var i = 0;
                var pos = 1;
                var promesasNombreJerarquia = [];
                var cellHeaderLogin = {v: 'Login', t: 's'};
                var cellHeaderLoginRef = XLSX.utils.encode_cell({c: 0, r: 0});
                ws[cellHeaderLoginRef] = cellHeaderLogin;
                var cellHeaderPlaza = {v: 'Código plaza', t: 's'};
                var cellHeaderPlazaRef = XLSX.utils.encode_cell({c: 1, r: 0});
                ws[cellHeaderPlazaRef] = cellHeaderPlaza;
                var cellHeaderIdJerarquia = {v: 'Id Jerarquía', t: 's'};
                var cellHeaderIdJerarquiaRef = XLSX.utils.encode_cell({c: 2, r: 0});
                ws[cellHeaderIdJerarquiaRef] = cellHeaderIdJerarquia;
                var cellHeaderJerarquia = {v: 'Jerarquía', t: 's'};
                var cellHeaderJerarquiaRef = XLSX.utils.encode_cell({c: 3, r: 0});
                ws[cellHeaderJerarquiaRef] = cellHeaderJerarquia;
                var cellHeaderEscritura = {v: 'Escritura', t: 's'};
                var cellHeaderEscrituraRef = XLSX.utils.encode_cell({c: 4, r: 0});
                ws[cellHeaderEscrituraRef] = cellHeaderEscritura;
                var cellHeaderLectura = {v: 'Lectura', t: 's'};
                var cellHeaderLecturaRef = XLSX.utils.encode_cell({c: 5, r: 0});
                ws[cellHeaderLecturaRef] = cellHeaderLectura;
                while (i < data.length) {
                    var permiso = data[i];
                    var cellLogin = {v: typeof permiso.login === 'undefined' || permiso.login === null ? '-' : permiso.login, t: 's'};
                    var cellPlaza = {v: typeof permiso.codplaza === 'undefined' || permiso.codplaza === null ? '-' : permiso.codplaza, t: 's'};
                    for (var j = 0; j < permiso.jerarquiadirectaescritura.length; j++) {
                        var jerarquia = permiso.jerarquiadirectaescritura[j];
                        var cellLoginRef = XLSX.utils.encode_cell({c: 0, r: pos});
                        ws[cellLoginRef] = cellLogin;
                        var cellPlazaRef = XLSX.utils.encode_cell({c: 1, r: pos});
                        ws[cellPlazaRef] = cellPlaza;
                        var cellJerarquia = {v: jerarquia, t: 'n'};
                        var cellJerarquiaRef = XLSX.utils.encode_cell({c: 2, r: pos});
                        ws[cellJerarquiaRef] = cellJerarquia;
                        var cellEscritura = {v: 'SÍ', t: 's'};
                        var cellEscrituraRef = XLSX.utils.encode_cell({c: 4, r: pos});
                        ws[cellEscrituraRef] = cellEscritura;
                        var cellLectura = {v: 'SÍ', t: 's'};
                        var cellLecturaRef = XLSX.utils.encode_cell({c: 5, r: pos});
                        ws[cellLecturaRef] = cellLectura;
                        var deferNombreJerarquia = Q.defer();
                        promesasNombreJerarquia.push(deferNombreJerarquia.promise);
                        Jerarquia.findOne({'id': jerarquia}, {nombrelargo: true}, cb(deferNombreJerarquia, pos, 3, ws));
                        pos++;
                    }
                    for (var j = 0; j < permiso.jerarquiadirectalectura.length; j++) {
                        var jerarquiaLectura = permiso.jerarquiadirectalectura[j];
                        if (permiso.jerarquiadirectaescritura.indexOf(jerarquiaLectura) === -1) {
                            var cellLoginRef = XLSX.utils.encode_cell({c: 0, r: pos});
                            ws[cellLoginRef] = cellLogin;
                            var cellPlazaRef = XLSX.utils.encode_cell({c: 1, r: pos});
                            ws[cellPlazaRef] = cellPlaza;
                            var cellJerarquia = {v: jerarquia, t: 'n'};
                            var cellJerarquiaRef = XLSX.utils.encode_cell({c: 2, r: pos});
                            ws[cellJerarquiaRef] = cellJerarquia;
                            var cellEscritura = {v: 'NO', t: 's'};
                            var cellEscrituraRef = XLSX.utils.encode_cell({c: 4, r: pos});
                            ws[cellEscrituraRef] = cellEscritura;
                            var cellLectura = {v: 'SÍ', t: 's'};
                            var cellLecturaRef = XLSX.utils.encode_cell({c: 5, r: pos});
                            ws[cellLecturaRef] = cellLectura;
                            var deferNombreJerarquia = Q.defer();
                            promesasNombreJerarquia.push(deferNombreJerarquia.promise);
                            Jerarquia.findOne({'id': jerarquia}, {nombrelargo: true}, cb(deferNombreJerarquia, pos, 3, ws));
                            pos++;
                        }
                    }
                    i++;
                }
                Q.all(promesasNombreJerarquia).then(function () {
                    var range = {s: {c: 0, r: 0}, e: {c: 6, r: pos}};
                    ws['!ref'] = XLSX.utils.encode_range(range);
                    deferPermiso.resolve({'wsName': 'Permisos', 'sheet': ws});
                }, function (err) {
                    console.error(err);
                    res.status(500);
                    res.end();
                    deferProcedimiento.reject(err);
                });
            }
        });
        
        // Genera hoja General
        deferProcedimiento.promise.then(function() {
            var indicadoresDatabase = ["solicitados", "iniciados", "resueltos_1", "resueltos_5", "resueltos_10", "resueltos_15", "resueltos_30",
                "resueltos_45", "resueltos_mas_45", "resueltos_desistimiento_renuncia_caducidad", "resueltos_prescripcion", "t_medio_naturales", "t_medio_habiles",
                "en_plazo", "quejas", "recursos"];
            var indicadores = ["Solicitados", "Iniciados", "Resueltos < 1", "Resueltos 1 < 5","Resueltos 5 < 10", "Resueltos 10 < 15", "Resueltos 15 < 30", 
                "Resueltos 30 < 45", "Resueltos > 45", "Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)", "Resueltos por Prescripción/Caducidad (Resp. Admón.)",
                "Tiempo medio en días naturales", "Tiempo medio en días hábiles descontando Tiempo de suspensiones", "En plazo", "Quejas presentadas en el mes", 
                "Recursos presentados en el mes"];
            var meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            var precabeceras = ["Código", "Denominación del procedimiento", "Código Nivel 1", "Denominación Nivel 1", "Código Nivel 2", "Denominación Nivel 2", "Código Nivel 3", "Denominación Nivel 3", 
                "Código plaza responsable", "Login responsable", "Nombre responsable", "Correo-e responsable", "Teléfono responsable", 
                "Plazo máximo legal para resolver (dias naturales)", "Plazo máximo legal para resolver (dias hábiles)", "Plazo CS /ANS (días naturales)", 
                "Plazo CS /ANS (días hábiles)", "Pendientes iniciales (a 31-12)"];
            var ws = {};
            var pos = 1;
            for (var i = 0; i < precabeceras.length; i++) {
                var cellHeader = {v: precabeceras[i], t: 's'};
                var cellHeaderRef = XLSX.utils.encode_cell({c: pos++, r: 1});
                ws[cellHeaderRef] = cellHeader;
            }
            var cellHeader = {v: 'RESUELTOS EN LOS MESES DE 2014', t: 's'};
            var cellHeaderRef = XLSX.utils.encode_cell({c: pos+6, r: 0});
            ws[cellHeaderRef] = cellHeader;   
            for (var i = 0; i < meses.length; i++) {
                var cellHeader = {v: meses[i], t: 's'};
                var cellHeaderRef = XLSX.utils.encode_cell({c: pos++, r: 1});
                ws[cellHeaderRef] = cellHeader;   
            }
            for (var i = 0; i < meses.length; i++) {
                var cellHeader = {v: meses[i], t: 's'};
                var cellHeaderRef = XLSX.utils.encode_cell({c: pos+6, r: 0});
                ws[cellHeaderRef] = cellHeader;   
                for (var j = 0; j < indicadores.length; j++) {
                    var cellHeader = {v: indicadores[j], t: 's'};
                    var cellHeaderRef = XLSX.utils.encode_cell({c: pos++, r: 1});
                    ws[cellHeaderRef] = cellHeader;   
                }
            }
            var dim = pos;
            var promesasLogins = [];
            for (var i = 0; i < procedimientos.length; i++) {
                pos = 1;
                var procedimiento = procedimientos[i];
                var cellValue = {v: procedimiento.codigo, t: 's'};
                var cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                cellValue = {v: procedimiento.denominacion, t: 's'};
                cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                if ((typeof procedimiento.ancestros !== 'undefined') && (procedimiento.ancestros.length > 1)) {
                    if (procedimiento.ancestros.length === 4) {
                        for (var j = 0; j < 3; j++) {
                            var cellValue = {v: procedimiento.ancestros[j].id, t: 'n'};
                            var cellValueRef = XLSX.utils.encode_cell({c: pos, r: i+2});
                            ws[cellValueRef] = cellValue;
                            cellValue = {v: procedimiento.ancestros[j].nombrelargo, t: 's'};
                            cellValueRef = XLSX.utils.encode_cell({c: pos+1, r: i+2});
                            ws[cellValueRef] = cellValue;
                            pos+=2;
                        }
                    } else if (procedimiento.ancestros.length === 3) {
                        var cellValue = {v: procedimiento.ancestros[0].id, t: 'n'};
                        var cellValueRef = XLSX.utils.encode_cell({c: pos, r: i+2});
                        ws[cellValueRef] = cellValue;
                        cellValue = {v: procedimiento.ancestros[0].nombrelargo, t: 's'};
                        cellValueRef = XLSX.utils.encode_cell({c: pos+1, r: i+2});
                        ws[cellValueRef] = cellValue;
                        cellValue = {v: procedimiento.ancestros[1].id, t: 'n'};
                        cellValueRef = XLSX.utils.encode_cell({c: pos+4, r: i+2});
                        ws[cellValueRef] = cellValue;
                        cellValue = {v: procedimiento.ancestros[1].nombrelargo, t: 's'};
                        cellValueRef = XLSX.utils.encode_cell({c: pos+5, r: i+2});
                        ws[cellValueRef] = cellValue;
                        pos+=6;
                    } else if (procedimiento.ancestros.length === 2) {
                        var cellValue = {v: procedimiento.ancestros[0].id, t: 'n'};
                        var cellValueRef = XLSX.utils.encode_cell({c: pos+4, r: i+2});
                        ws[cellValueRef] = cellValue;
                        cellValue = {v: procedimiento.ancestros[0].nombrelargo, t: 's'};
                        cellValueRef = XLSX.utils.encode_cell({c: pos+5, r: i+2});
                        ws[cellValueRef] = cellValue;
                        pos += 6;
                    }
                } else {
                    pos += 6;
                }
                cellValue = {v: procedimiento.cod_plaza, t: 's'};
                cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                var deferLogin = Q.defer();
                promesasLogins.push(deferLogin.promise);
                Persona.findOne({'codplaza': procedimiento.cod_plaza}, cbLogin(deferLogin, i+2, pos, ws));
                pos += 4;
                cellValue = {v: ((typeof procedimiento.periodos[year].plazo_maximo_resolver === 'undefined' || procedimiento.periodos[year].plazo_maximo_resolver === null) ? '' : procedimiento.periodos[year].plazo_maximo_resolver), t: 'n'};
                cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                cellValue = {v: ((typeof procedimiento.periodos[year].plazo_maximo_responder === 'undefined' || procedimiento.periodos[year].plazo_maximo_responder === null) ? '' : procedimiento.periodos[year].plazo_maximo_responder), t: 'n'};
                cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                cellValue = {v: ((typeof procedimiento.periodos[year].plazo_CS_ANS_naturales === 'undefined' || procedimiento.periodos[year].plazo_CS_ANS_naturales === null) ? '' : procedimiento.periodos[year].plazo_CS_ANS_naturales), t: 'n'};
                cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                cellValue = {v: ((typeof procedimiento.periodos[year].plazo_CS_ANS_habiles === 'undefined' || procedimiento.periodos[year].plazo_CS_ANS_habiles === null) ? '' : procedimiento.periodos[year].plazo_CS_ANS_habiles), t: 'n'};
                cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                cellValue = {v: ((typeof procedimiento.periodos[year].pendientes_iniciales === 'undefined' || procedimiento.periodos[year].pendientes_iniciales === null) ? '' : procedimiento.periodos[year].pendientes_iniciales), t: 'n'};
                cellValueRef = XLSX.utils.encode_cell({c: pos++, r: i+2});
                ws[cellValueRef] = cellValue;
                for (var mes = 0; mes < meses.length; mes++) {
                    if (typeof procedimiento.periodos[year].total_resueltos !== 'undefined') {
                        var cellValue = {v: ((typeof procedimiento.periodos[year].total_resueltos[mes] === 'undefined') ? '' : procedimiento.periodos[year].total_resueltos[mes]), t: 'n'};
                        var cellValueRef = XLSX.utils.encode_cell({c: pos, r: i+2});
                        ws[cellValueRef] = cellValue;
                    }
                    pos++;
                }
                for (var mes = 0; mes < meses.length; mes++) {
                    for (var ind = 0; ind < indicadoresDatabase.length; ind++) {
                        if (typeof procedimiento.periodos[year][indicadoresDatabase[ind]] !== 'undefined') {
                            var cellValue = {v: ((typeof procedimiento.periodos[year][indicadoresDatabase[ind]][mes] === 'undefined') ? '' : procedimiento.periodos[year][indicadoresDatabase[ind]][mes]), t: 'n'};
                            var cellValueRef = XLSX.utils.encode_cell({c: pos, r: i+2});
                            ws[cellValueRef] = cellValue;
                        }
                        pos++;
                    }
                }
            }
            Q.all(promesasLogins).then(function () {
                var range = {s: {c: 0, r: 0}, e: {c: dim+1, r: procedimientos.length + 1}};
                ws['!ref'] = XLSX.utils.encode_range(range);
                deferBD.resolve({'wsName': 'BD', 'sheet': ws});
            }, function (err) {
                console.error(err);
                res.status(500);
                res.end();
                deferDB.reject(err);
            });
        }, function(err) {
            deferBD.reject(err);
        });

        var cbLogin = function(deferLogin, r, c, ws) {
            return function(err, persona) {
                if (err) {
                    deferLogin.reject(err);
                } else {
                    var cellValue = {v: persona.login, t: 's'};
                    var cellValueRef = XLSX.utils.encode_cell({c: c, r: r});
                    ws[cellValueRef] = cellValue;
                    cellValue = {v: persona.apellidos+', '+persona.nombre, t: 's'};
                    cellValueRef = XLSX.utils.encode_cell({c: c+1, r: r});
                    ws[cellValueRef] = cellValue;
                    cellValue = {v: persona.login+'@carm.es', t: 's'};
                    cellValueRef = XLSX.utils.encode_cell({c: c+2, r: r});
                    ws[cellValueRef] = cellValue;
                    cellValue = {v: persona.telefono, t: 's'};
                    cellValueRef = XLSX.utils.encode_cell({c: c+3, r: r});
                    ws[cellValueRef] = cellValue;
                    deferLogin.resolve();
                }
            };
        };

        var cb = function (deferNombreJerarquia, r, c, ws) {
            return function (err, jerarquia) {
                if (err) {
                    deferNombreJerarquia.reject(err);
                } else {
                    var cellNombreJerarquia = {v: jerarquia.nombrelargo, t: 's'};
                    var cellNombreJerarquiaRef = XLSX.utils.encode_cell({c: c, r: r});
                    ws[cellNombreJerarquiaRef] = cellNombreJerarquia;
                    deferNombreJerarquia.resolve();
                }
            };
        };

        Q.all(promesasExcel).then(function (wss) {
            var wb = new Workbook();
            wss.forEach(function (ws) {
                wb.SheetNames.push(ws.wsName);
                wb.Sheets[ws.wsName] = ws.sheet;
            });
            var time = new Date().getTime();
            var path = app.get('prefixtmp');
            XLSX.writeFile(wb, path + time + '.xlsx');
            res.json({'time': time, 'hash': md5('sicidownload7364_' + time)});
        }, function (err) {
            console.error(err);
            res.status(500);
            res.end();
        });
    };
};