exports.index = function(req, res){
	"use strict";
	res.sendfile( "index.html", {root: __dirname + "/../public"});
};
