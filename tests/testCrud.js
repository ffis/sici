(function(){
	var mongoose = require('mongoose'),
		models = require('../api/models'),
		Crud = require('../api/crud');


	mongoose.connect('mongodb://mongosvr/sici');
	models.init(mongoose);

	var apiEtiqueta = new Crud(models, 'compromiso');
	console.log(apiEtiqueta);
	console.log(apiEtiqueta.test());
})();