
(function(){

String.prototype.isWhitespace = function(){
	return this.replace(/[\r\n\W]+/g, '').length < 1;
};

String.prototype.toNode = function(targetDocument, tagName, className){
	var result = targetDocument.createTextNode(this);
	if(tagName) result = result.wrap(tagName, className);
	return result;
};


Array.prototype.reParent = function(newParent){
	for(var i=0;i<this.length;i++)
		if(this[i]) newParent.appendChild(this[i]);
};

Node.prototype.wrap = function(tagName, className){
	var s = this.ownerDocument.createElement(tagName);
	if(className) s.setAttribute('class', className);
	var p = this.parentNode;
	s.appendChild(this);
	if(p != null) p.appendChild(s);
	return s;
};

NodeList.prototype.reParent = function(newParent){
	var l = this.length;
	for(var i=0;i<l;i++)
		if(this.item(0)) newParent.appendChild(this.item(0));
}

NamedNodeMap.prototype.toNode = function(tagName, nameClassName, valueClassName, attributeClassName, groupClassName){
	var result = document.createElement(tagName);
	if(groupClassName) result.setAttribute('class', groupClassName);
	
	for(var i=0;i<this.length;i++){
		var r1 = document.createElement(tagName);
		if(attributeClassName) r1.setAttribute('class', attributeClassName);
		r1.appendChild(this[i].nodeName.toNode(document, tagName, nameClassName));
		r1.appendChild(this[i].nodeValue.toNode(document, tagName, valueClassName));
		result.appendChild(r1);
	}
	
	return result;
};



var treeBuilder = {
	
};


})();
