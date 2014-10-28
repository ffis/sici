
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
importador = require('./api/importador'),
reglainconsistencia = require('./api/reglainconsistencia'),
procedimiento = require('./api/procedimiento'),
persona = require('./api/persona'),


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

  app.get('/api/procedimiento', procedimiento.procedimiento(models) );
  app.get('/api/procedimientoList/:idjerarquia', procedimiento.procedimientoList(models, Q) );
  
  app.get('/api/procedimiento/:codigo', procedimiento.procedimiento(models) );
  app.put('/api/procedimiento/:codigo', procedimiento.updateProcedimiento(Q, models, recalculate) );

  app.get('/api/reglasinconsistencias', reglainconsistencia.getReglaInconsistencia(models));
  app.post('/api/reglasinconsistencias', reglainconsistencia.newReglaInconsistencia(models));
  app.put('/api/reglasinconsistencias/:id', reglainconsistencia.updateReglaInconsistencia(models));
  app.delete('/api/reglasinconsistencias/:id', reglainconsistencia.removeReglaInconsistencia(models));
  
  app.get('/api/fprocedimiento', recalculate.fprocedimiento( Q, models));
  app.get('/api/fjerarquia', recalculate.fjerarquia( Q, models));
  app.get('/api/fpermiso', recalculate.fpermiso( Q, models));

  app.get('/test/testImportadorExcel', importador.testImportadorExcel(Q, models, recalculate));

// redirect all others to the index (HTML5 history)
  app.get('*', routes.index);//devolver el index.html del raiz


  http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });
})
