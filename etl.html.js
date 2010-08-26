//
// genericXml
//
(function(){

var xmlFormatDomExtractor = function(d){
	if(d == null) return false;
	var excluded = ["HTML","WML","WML:WML","SVG"];
	
	var r = XRegExp('(^\\s*<\\?xml[^\\n]+)|(^\\s*<(\\S+).+</\\3>\\s*$)','si');
	var pre = d.querySelectorAll('body > pre');
	var isXml = pre.length == 1 && pre[0].childElementCount == 0 && r.test(pre[0].innerText);
	if(!isXml) return false;
	
	var result = pre[0].innerText.toDOM();
	return (result) ? result : false;
};

var htmlXmlFileDomLoader = function(d, targetd, obj){
	
	var pre = targetd.querySelectorAll('body > pre');
	if(pre.length != 1) return false;

	var templateName = obj.templateName || 'standard';
	var colorSchemeName = obj.colorSchemeName || 'standard';
	//Append CSS
	if(obj.getURL)
		targetd.insertHtmlLinkElement(obj.getURL('xml.'+templateName+'.'+colorSchemeName+'.css'));

	
	//Load
	pre[0].parentNode.replaceChild(d, pre[0]);

	return true;
};

etl.extractors.push(xmlFormatDomExtractor);
etl.loaders.push(htmlXmlFileDomLoader);


//Helpers
Node.prototype.removeChildren = function(){
	if(!this.hasChildNodes()) return;
	while(this.firstChild)
		this.removeChild(this.firstChild);
};

String.prototype.toDOM = function(){
	var value = this.replace(/^\s+/,'');
	var parser = new DOMParser();
	var result = parser.parseFromString(value, "text/xml");
	
	return result;
};

Document.prototype.insertHtmlHeadElement = function(){
	head = this.createElement('head');
	var html = this.querySelector('html');

	if(html.length < 1){
		html = this.createElement('html');
		this.appendChild(html);
	}

	html.insertBefore(head, html.firstChild);
	return head;
}

Document.prototype.insertHtmlLinkElement = function(path){
	var link = this.createElement('link');
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = path;
	var head = (this.head || this.insertHtmlHeadElement());
	head.appendChild(link);
	return link;
};

})();
