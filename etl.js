var etl = {
	"extractors":[]
	,"transformers":[]
	,"loaders":[]
	,"executeFirst":function(d, obj){
		obj = obj || {};
		var data = this.extractors.executeFirst(d, obj);
		if(data == null || data === false) return data;
		data = this.transformers.executeFirst(data, d, obj);
		if(data == null || data === false) return data;
		return this.loaders.executeFirst(data, d, obj);
	}
};

Array.prototype.executeFirst = function(){
	var result = false;
	for(var i=0,l=this.length;i<l && result === false;i++)
		result = this[i].apply(this, arguments);

	return (result === false)?false:result;
};

NodeList.prototype.filter = function(predicate){
	var result = [];
	for(var i=0,l=this.length;i<l;i++)
		if(predicate(this[i])) result.push(this[i]);
	return result;
};


