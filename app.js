


var express = require('express'),
  http = require('http'),
  Q = require('q'),
  mongoose = require('mongoose'),
  app = module.exports = express(),
	expressJwt = require('express-jwt'),
	jwt = require('jsonwebtoken'),
  routes = require('./routes');

var secret = __dirname;

app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('mongosrv', process.env.MONGOSVR || 'mongodb://localhost/sici');


//Inicialización mongoose
mongoose.connect(app.get('mongosrv'));
//models.init(mongoose);



app.use(express.json());
app.use(express.urlencoded());

app.use('/api', expressJwt({secret: secret}));


// Routes

app.get('/', routes.index);
app.get('/partial/:name', routes.partial);


app.get('/api/restricted', function (req, res) {
  console.log('user ' + req.user.email + ' is calling /api/restricted');
  res.json({
    name: 'foo'
  });
});


// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
