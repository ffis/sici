exports.index = function(req, res){
	"use strict";
	res.sendFile( "index.html", {root: __dirname + "/../public"});
};
