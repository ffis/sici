'use strict';

var memwatch = require('memwatch');

module.exports = function profiler(){
  return function(req, res, next){
    var end = res.end
      ,
      previousinvoke =  new memwatch.HeapDiff();

    // state snapshot
    
      if (typeof(gc) == 'function') {
        gc();
      }else if (global && global.gc) global.gc();


    // proxy res.end()
    res.end = function(data, encoding){
      res.end = end;
      res.end(data, encoding);

      var diff = previousinvoke.end();
      previousinvoke = new memwatch.HeapDiff();
      diff.change.details.sort(function(a,b){ return (b.size_bytes - a.size_bytes); });
      console.log(JSON.stringify(diff));
    };

    next();
  }
};