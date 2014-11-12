
exports.uncrypt = function(encryption_key){
	return function(req,res,next)
	{//espera en body un objeto json {t:sesionencriptada}
		var decipher = crypto.createDecipher('aes-128-ecb', encryption_key),
		chunks = [];
		var fullBuffer = new Buffer(req.body.t);
		chunks.push( decipher.update( new Buffer(fullBuffer, "base64").toString("binary")) );
		chunks.push( decipher.final('binary') );
		var txt = chunks.join("");
		txt = new Buffer(txt, "binary").toString("utf-8");
		console.log(fullBuffer);
		console.log(txt);
		if (txt){
			req.body = txt;
			next();
		}
	}
}

