(function(log){
	'use strict';

	var fs = require('fs'), path = require('path'),
		Docxtemplater = require('docxtemplater'),
		carta = require('./data/carta.json'),
		jerarquias = require('./data/jerarquias.json'),
		expressions = require('angular-expressions'),
		angularParser = function(tag){
			var expr = expressions.compile(tag);
			return {get: expr};
		};

 //   loadFile(path.join(__dirname, 'data', 'carta-template.docx'), function(err,content){


//	new Docxtemplater().loadFromFile(path.join(__dirname, 'data', 'carta-template.docx'), {async: true, parser:angularParser}).success(function(doc){
	var content = fs.readFileSync( path.join(__dirname, 'data', 'carta-template.docx'), 'binary');

	var doc = new Docxtemplater(content);

	//set the templateVariables
	doc.setOptions({parser: angularParser});
	var params = {
		'cartaservicio': carta,
		'anualidad': 2015,
		'jerarquias': jerarquias
	};
	doc.setData(params);
	log.log(params);

	doc.render();

	var buf = doc.getZip().generate({type: 'nodebuffer'});

	fs.writeFileSync(path.join(__dirname, 'data', 'carta-output.docx'), buf);
//	});
})(console);
