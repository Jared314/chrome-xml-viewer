Array.prototype.executeFirst = function(item, item2){
	var result = false;
	for(var i=0,l=this.length;i<l && result === false;i++)
		result = (item2) ? this[i](item,item2) : this[i](item);
	return (result === false)?null:result;
};

String.prototype.toDOM = function(){
	var value = this.replace(/^\s+/,'');
	var parser = new DOMParser();
	var result = parser.parseFromString(value, "text/xml");
	
	if(result.getElementsByTagName('parsererror').length > 0)
		return null;
	return result;
};

Document.prototype.insertHtmlHeadElement = function(){
	if(this.head) return this.head;
	var head = this.createElement('head');
	var html = this.querySelector('html');
	if(!html){
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

NamedNodeMap.prototype.toNode = function(targetDocument, tagName, nameClassName, valueClassName, attributeClassName, groupClassName){
	var result = targetDocument.createElement(tagName);
	if(groupClassName) result.setAttribute('class', groupClassName);
	
	var space = " ".toNode(targetDocument);
	
	for(var i=0;i<this.length;i++){
		var r1 = targetDocument.createElement(tagName);
		if(attributeClassName) r1.setAttribute('class', attributeClassName);
		r1.appendChild(targetDocument.createTextNode(" "));
		r1.appendChild(this[i].nodeName.toNode(targetDocument, tagName, nameClassName));
		r1.appendChild(targetDocument.createTextNode('="'));
		r1.appendChild(this[i].nodeValue.toNode(targetDocument, tagName, valueClassName));
		r1.appendChild(targetDocument.createTextNode('"'));		
		result.appendChild(r1);
	}
	
	return result;
};

String.prototype.isWhitespace = function(){
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

String.prototype.removeWord = function(value, delimiter, options){
	if(!delimiter) delimiter = ' ';
	var r = new RegExp('('+delimiter+')?' + value + '('+delimiter+')?', (options)?options:'g');
	var m = this.match(r);
	return (m) ? this.replace(r, (m[1] && m[2])? delimiter : '') : this;
};
