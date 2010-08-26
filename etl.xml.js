//
// xml
//
(function(){

function isXml(elem){
	var excluded = ["HTML","WML","WML:WML","SVG"];
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? (excluded.indexOf(documentElement.nodeName.toUpperCase()) < 0) : false;
};


var xmlDomExtractor = function(d){
	if(d == null || !isXml(d)) return false;
	
	return d;
};

var xmlDomLoader = function(d, targetd, obj){
	if(!isXml(targetd)) return false;
	
	var templateName = obj.templateName || 'standard';
	var colorSchemeName = obj.colorSchemeName || 'standard';
	
	//Attach CSS file
	if(obj.getURL){
		var pi = targetd.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + obj.getURL('xml.'+templateName+'.'+colorSchemeName+'.css') + '"');
		targetd.insertBefore(pi, targetd.firstChild);
	}

	//Attach the new tree
	if(document.documentElement)
		targetd.replaceChild(d, targetd.documentElement);
	else
		targetd.appendChild(d);

	return true;
};

etl.extractors.push(xmlDomExtractor);
etl.loaders.push(xmlDomLoader);
})();
