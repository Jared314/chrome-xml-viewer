


String.prototype.isWhitespace = function(){
	//\u000a
	//\u0009
	//\u000b
	//\u000c
	//\u000d
	//\u0020
	//\u00a0
	//\u0085
	//\u1680
	//\u2007
	//\u2008
	//\u2009
	//\u200a
	//\u2028
	//\u2029
	//\u202f
	//\u205f
	//\u3000
	return this.replace(/[\u000a\u0009\u000b\u000c\u000d\u0020\u00a0\u0085\u1680\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+/g, '').length < 1;
};

String.prototype.toNode = function(targetDocument, tagName, className){
	var result = targetDocument.createTextNode(this);
	if(tagName){
		var s = targetDocument.createElement(tagName);
		if(className) s.setAttribute('class', className);
		s.appendChild(result);
		result = s;
	}
	return result;
};

String.prototype.toDOM = function(){
	return new DOMParser().parseFromString(this, "text/xml");
};

Array.prototype.reParent = function(newParent){
	for(var i=0;i<this.length;i++)
		if(this[i]){
			var el = this[i];
			if(newParent.ownerDocument != el.ownerDocument){
				el = newParent.ownerDocument.importNode(el, true);
			}
			newParent.appendChild(el);
		}
};

NodeList.prototype.filter = function(callback){
	var l = this.length;
	var result = [];
	for(var i=0;i<l;i++)
		if(callback(this.item(i)))
			result.push(this.item(i));
	return result;
};

NamedNodeMap.prototype.toNode = function(targetDocument, tagName, nameClassName, valueClassName, attributeClassName, groupClassName){
	var result = targetDocument.createElement(tagName);
	if(groupClassName) result.setAttribute('class', groupClassName);
	
	for(var i=0;i<this.length;i++){
		var r1 = targetDocument.createElement(tagName);
		if(attributeClassName) r1.setAttribute('class', attributeClassName);
		r1.appendChild(this[i].nodeName.toNode(targetDocument, tagName, nameClassName));
		r1.appendChild(this[i].nodeValue.toNode(targetDocument, tagName, valueClassName));
		result.appendChild(r1);
	}
	
	return result;
};

Document.prototype.insertHtmlHeadElement = function(){
	if(this.head) return this.head;
	var head = this.createElement('head');
	var html = this.getElementsByTagName("html")[0];
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

Document.prototype.isChromeViewSourcePage = function(){
	return this.body != null 
		&& this.getElementsByClassName("webkit-line-gutter-backdrop").length == 1
		&& this.getElementsByTagName("tbody").length == 1;
};

Document.prototype.isXmlFile = function(){
	return this.xmlVersion != null && this.getElementsByTagName("div").length < 1 && this.getElementsByTagName("table").length < 1;
};

Node.prototype.hasElementChildNodes = function(){
	if(!this.hasChildNodes()) return false;
	return this.childNodes.filter(function(el){ return el.nodeType == 1; }).length > 0;
};

Document.prototype.isPlainTextXmlFile = function(){
	return this.body 
		&& this.getElementsByTagName("pre").filter(
			function(el){ return el != null && !el.hasElementChildNodes() && (el.innerText.match(/^\s*<\?xml\s/mi) || "").length > 0; }
			).length > 0;
};

Document.prototype.getPlainTextXmlFileNode = function(){
	var nodes = this.getElementsByTagName("pre").filter(
		function(el){ return el != null && (el.innerText.match(/^\s*<\?xml\s/mi) || "").length > 0; }
		);
	return nodes;
};





