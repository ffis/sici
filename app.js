
var express = require('express'),
http = require('http'),
Q = require('q'),
path = require('path'),
mongoose = require('mongoose'),
app = module.exports = express(),
expressJwt = require('express-jwt'),
jwt = require('jsonwebtoken'),

recalculate = require('./api/recalculate'),
routes = require('./routes'),
models = require('./api/models');

api = require('./api/api'),
login = require('./api/login'),
jerarquia = require('./api/jerarquia'),
importador = require('./api/importador'),
reglainconsistencia = require('./api/reglainconsistencia'),
etiqueta = require('./api/etiqueta'),
procedimiento = require('./api/procedimiento'),
persona = require('./api/persona'),
permiso = require('./api/permiso'),
upload = require('./api/upload'),
csvsici = require('./api/csvsici');


app.set('mongosrv', process.env.MONGOSVR || 'mongodb://mongosvr/sici');


//Inicialización mongoose
mongoose.connect(app.get('mongosrv'));
models.init(mongoose);

var Settings = models.settings();
Settings.find().sort({'version': -1}).limit(1).exec(function(err,cfgs){
  if (err)
    throw err;

  cfg = cfgs[0];

  app.disable( 'x-powered-by' );
  app.set('port', process.env.PORT || cfg.port ||6000);
  app.set('views', __dirname + '/views');

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.bodyParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.multipart({ uploadDir: '/tmp/sici' }));

  app.use(express.errorHandler());
  mongoose.set('debug', false);

  app.use('/api', expressJwt({secret: cfg.secret}));
  app.use('/api', api.log(models));

  app.post('/authenticate', login.authenticate({secret: cfg.secret, jwt:jwt, models:models }));


  app.get('/', routes.index);



  app.get('/api/arbol', api.arbol(Q, models) );
  
  app.get('/api/raw/:modelname',api.raw(models));
  app.get('/api/aggregate/:campo',api.aggregate(models));
  app.get('/api/aggregate/:campo/:match',api.aggregate(models));
  

  app.get('/api/gs/:id',importador.parseGS());
  app.get('/api/cr/:id',importador.parseCr(Q, models));


  app.get('/api/personasByPuesto/:cod_plaza',persona.personasByPuesto(models));
  app.get('/api/personasByLogin/:cod_plaza',persona.personasByLogin(models));
  app.get('/api/searchpersonas',persona.personassearchlist(models,Q));

  app.get('/api/setPeriodosCerrados', procedimiento.setPeriodosCerrados(models));

  app.get('/api/procedimiento', procedimiento.procedimiento(models) );
  app.get('/api/procedimientoList/:idjerarquia/:recursivo', procedimiento.procedimientoList(models, Q) );
  app.get('/api/procedimientoList/:idjerarquia', procedimiento.procedimientoList(models, Q) );
  
  app.get('/api/procedimiento/:codigo', procedimiento.procedimiento(models) );
  app.put('/api/procedimiento/:codigo', procedimiento.updateProcedimiento(Q, models, recalculate) );
  
  app.get('/api/jerarquia/:idjerarquia', jerarquia.getNodoJerarquia(models));

  app.get('/api/reglasinconsistencias', reglainconsistencia.getReglaInconsistencia(models));
  app.post('/api/reglasinconsistencias', reglainconsistencia.newReglaInconsistencia(models));
  app.put('/api/reglasinconsistencias/:id', reglainconsistencia.updateReglaInconsistencia(models));
  app.delete('/api/reglasinconsistencias/:id', reglainconsistencia.removeReglaInconsistencia(models));

  app.get('/api/etiqueta', etiqueta.getEtiqueta(models));
  app.put('/api/etiqueta/:id', etiqueta.updateEtiqueta(models));
  app.post('/api/etiqueta/:id', etiqueta.newEtiqueta(models));
  app.delete('/api/etiqueta/:id', etiqueta.removeEtiqueta(models));
  
  app.get('/api/fprocedimiento', recalculate.fprocedimiento( Q, models, procedimiento));
  app.get('/api/fjerarquia', recalculate.fjerarquia( Q, models));
  app.get('/api/fpermiso', recalculate.fpermiso( Q, models));

  app.get('/api/permisosList/:idjerarquia/:recursivo', permiso.permisosList(models, Q)); 
  app.get('/api/permisosList', permiso.permisosList(models, Q));
  app.get('/api/permisosDirectosProcedimientoList/:codigoprocedimiento', permiso.permisosDirectosProcedimientoList(models, Q));
  app.get('/api/permisosProcedimientoList/:codigoprocedimiento', permiso.permisosProcedimientoList(models, Q));
  //app.get('/api/permisosCalculados', login.permisoscalculados(models)); 
  app.delete('/api/permisos/delete-jerarquia/:permiso/:jerarquia', permiso.removePermisoJerarquia(models,Q));
  app.delete('/api/permisos/delete-procedimiento/:permiso/:procedimiento', permiso.removePermisoJerarquia(models,Q));
  app.put('/api/permisos/:id', permiso.update(models));
  app.post('/api/permisos/', permiso.create(models));
  
  
  app.get('/api/excelgesper', persona.importarGesper(models,Q));
  

  app.get('/api/importacion', importador.importacionesprocedimiento(models));
  app.post('/api/importacion/:_id', importador.applyImportacionProcedimiento(models));
  app.delete('/api/importacion/:_id', importador.removeImportacionProcedimiento(models));
  

  app.post('/api/updateByFile',upload.update(),csvsici.parse(models));

  app.get('/test/testImportadorExcel', importador.testImportadorExcel(Q, models, recalculate));

// redirect all others to the index (HTML5 history)
  app.get('*', routes.index);//devolver el index.html del raiz


  http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });
})
