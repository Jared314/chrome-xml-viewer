
//
// xmlTransformer
//
(function(){

var template = {
	"standard":{
"tag" : '<div class="xml-viewer-tag">\
<div class="xml-viewer-tag-start xml-viewer-tag-collapsible"><span><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-start-bracket">&lt;</span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div>\
<div class="xml-viewer-tag-content">{value}</div>\
<div class="xml-viewer-tag-end"><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-end-bracket">&lt;/</span>{name}<span class="xml-viewer-end-bracket">&gt;</span></div>\
</div>',
"attribute":'<span class="xml-viewer-attribute"> <span class="xml-viewer-attribute-name">{name}</span>="<span class="xml-viewer-attribute-value">{value}</span>"</span>',
"attributes":'<span class="xml-viewer-attribute-set">{value}</span>',
"inlineTag":'<div class="xml-viewer-tag xml-viewer-inline"><div class="xml-viewer-tag-start"><span><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-start-bracket">&lt;</span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div><div class="xml-viewer-tag-content">{value}</div><div class="xml-viewer-tag-end"><span class="xml-viewer-end-bracket">&lt;/</span>{name}<span class="xml-viewer-end-bracket">&gt;</span></div></div>',
"singleTag":'<div class="xml-viewer-tag"><div class="xml-viewer-tag-start xml-viewer-tag-end"><span><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-start-bracket">&lt;</span>{name}{attributes}<span class="xml-viewer-start-bracket">/&gt;</span></span></div></div>',
"processingInstruction":'<div class="xml-viewer-processing-instruction"><span>&lt;?</span>{name}{value}<span>?&gt;</span></div>',
"comment":'<pre class="xml-viewer-comment"><span class="xml-viewer-tag-start">&lt;!--</span>{value}<span class="xml-viewer-tag-end">--&gt;</span></pre>',
"cdata":'<pre class="xml-viewer-cdata"><span class="xml-viewer-tag-start">&lt;![CDATA[</span>{value}<span class="xml-viewer-tag-end">]]&gt;</span></pre>',
"document":'<div class="xml-viewer-document">{value}</div>',
"isCollapsed":function(tagNode){
	var indicator = tagNode.firstChild.firstChild.firstChild;
	var content = tagNode.firstChild.nextSibling;

	return indicator 
		&& indicator.getAttribute('class') != null 
		&& indicator.getAttribute('class').indexOf('xml-viewer-visible') > -1;
},
"collapse":function(tagNode){
	var indicator = tagNode.firstChild.firstChild.firstChild;
	var content = tagNode.firstChild.nextSibling;
	
	//Show collapse indicator
	var c = indicator.getAttribute('class');
	indicator.setAttribute('class', c.addWordUnique('xml-viewer-visible'));

	//Hide contents
	c = content.getAttribute('class');
	content.setAttribute('class', c.addWordUnique('xml-viewer-hidden'));
},
"expand":function(tagNode){
	var indicator = tagNode.firstChild.firstChild.firstChild;
	var content = tagNode.firstChild.nextSibling;
	
	//Hide collapse indicator
	var c = indicator.getAttribute('class');
	indicator.setAttribute('class', c.removeWord('xml-viewer-visible'));

	//Show contents
	c = content.getAttribute('class');
	content.setAttribute('class', c.removeWord('xml-viewer-hidden'));
}
	},
	"reduced":{
"tag" : '<div class="xml-viewer-tag">\
<div class="xml-viewer-tag-start xml-viewer-tag-collapsible"><span><span class="xml-viewer-tag-collapse-indicator">+ </span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div>\
<div class="xml-viewer-tag-content">{value}</div>\
<div class="xml-viewer-tag-end"><span class="xml-viewer-tag-collapse-indicator">+ </span><span class="xml-viewer-end-bracket">&lt;</span>{name}</div>\
</div>',
"attribute":'<span class="xml-viewer-attribute"> <span class="xml-viewer-attribute-name">{name}</span>="<span class="xml-viewer-attribute-value">{value}</span>"</span>',
"attributes":'<span class="xml-viewer-attribute-set">{value}</span>',
"inlineTag":'<div class="xml-viewer-tag xml-viewer-inline"><div class="xml-viewer-tag-start"><span><span class="xml-viewer-tag-collapse-indicator">+ </span>{name}{attributes}<span class="xml-viewer-start-bracket">&gt;</span></span></div><div class="xml-viewer-tag-content">{value}</div><div class="xml-viewer-tag-end"><span class="xml-viewer-end-bracket">&lt;</span></div></div>',
"singleTag":'<div class="xml-viewer-tag"><div class="xml-viewer-tag-start xml-viewer-tag-end"><span><span class="xml-viewer-tag-collapse-indicator">+ </span>{name}{attributes}</span></div></div>',
"processingInstruction":'<div class="xml-viewer-processing-instruction"><span>&lt;?</span>{name}{value}<span>?&gt;</span></div>',
"comment":'<pre class="xml-viewer-comment"><span class="xml-viewer-tag-start">&lt;!--</span>{value}<span class="xml-viewer-tag-end">--&gt;</span></pre>',
"cdata":'<pre class="xml-viewer-cdata"><span class="xml-viewer-tag-start">&lt;![CDATA[</span>{value}<span class="xml-viewer-tag-end">]]&gt;</span></pre>',
"document":'<div class="xml-viewer-document">{value}</div>',
"isCollapsed":function(tagNode){
	var indicator = tagNode.firstChild.firstChild.firstChild;
	var content = tagNode.firstChild.nextSibling;

	return indicator 
		&& indicator.getAttribute('class') != null 
		&& indicator.getAttribute('class').indexOf('xml-viewer-visible') > -1;
},
"collapse":function(tagNode){
	var indicator = tagNode.firstChild.firstChild.firstChild;
	var content = tagNode.firstChild.nextSibling;
	
	//Show collapse indicator
	var c = indicator.getAttribute('class');
	indicator.setAttribute('class', c.addWordUnique('xml-viewer-visible'));

	//Hide contents
	c = content.getAttribute('class');
	content.setAttribute('class', c.addWordUnique('xml-viewer-hidden'));
},
"expand":function(tagNode){
	var indicator = tagNode.firstChild.firstChild.firstChild;
	var content = tagNode.firstChild.nextSibling;
	
	//Hide collapse indicator
	var c = indicator.getAttribute('class');
	indicator.setAttribute('class', c.removeWord('xml-viewer-visible'));

	//Show contents
	c = content.getAttribute('class');
	content.setAttribute('class', c.removeWord('xml-viewer-hidden'));
}
	}
};

//Event Handler
function foldingHandler(event){
	event.cancelBubble = true;	
	//find node
	var node = event.target;
	while(!node.getAttribute('class') || node.getAttribute('class').search(/xml-viewer-tag$/i) < 0)
		node = node.parentNode;
	var collapsed = node.isCollapsed();
	if(collapsed)
		node.expand();
	else
		node.collapse();
	
	//if shift+click, then fold children
	if(event.shiftKey){
		var nodes = node.querySelectorAll("div[class~='xml-viewer-tag-collapsible']").filter(function(item){return item.parentNode && item.parentNode != node;});
		for(var i=0;i<nodes.length;i++){
			var n = nodes[i];
			if(collapsed)
				n.parentNode.expand();
			else
				n.parentNode.collapse();
		}
	}
}

function addEventListeners(template, root){
	var nodes = root.querySelectorAll("div[class~='xml-viewer-tag-collapsible']");
	for(var i=0,l=nodes.length;i<l;i++){
		var node = nodes[i].parentNode;
		node.firstChild.firstChild.addEventListener("click", foldingHandler, false);
		node.isCollapsed = function(){ return template.isCollapsed(this); };
		node.collapse = function(){ return template.collapse(this); };
		node.expand = function(){ return template.expand(this); };
	}
}


function buildElementNode(node, newChildren, targetDocument, depth){

	var hasChildren = newChildren && newChildren.length > 0;
	var isTagInline = newChildren 
			&& newChildren.length == 1 
			&& newChildren[0] 
			&& newChildren[0].nodeType == Node.TEXT_NODE
			&& newChildren[0].nodeValue.indexOf('\n') < 0;

	var t = template.tag;
	if(isTagInline) t = template.inlineTag;
	else if(!hasChildren) t = template.singleTag;

	var data = {'name':node.nodeName, 'attributes': null};
	if(isTagInline)	data['value'] = node.firstChild;
	
	if(node.hasAttributes()){
		var attrs = [];
		for(var i=0,l=node.attributes.length;i<l;i++)
			attrs.push(templating.processTemplate(template.attribute, {'name':node.attributes[i].nodeName,'value':node.attributes[i].nodeValue}));

		data['attributes'] = templating.processTemplate(template.attributes, {'value':attrs});
	}


	var result = templating.processTemplate(t, data);

	if(hasChildren && t.values['value']){
		var contentEl = t.values['value'](result);
		var p = contentEl.parentNode;
		newChildren.reParent(p);
		p.removeChild(contentEl);

		//Add node depth
		if(!isTagInline)
			result.firstChild.depth = depth;
	}

	return result;
}

function buildTextNode(targetDocument, node){
	var result;
	if(!node.nodeValue.isWhitespace()){
		result = (targetDocument != node.ownerDocument) ? targetDocument.importNode(node, false) : node.cloneNode(false);
		//Consume newlines and indentation
		if(result){
			result.nodeValue = result.nodeValue.replace(/(\r?\n)[\s\t]+/g,'$1');
			result.nodeValue = result.nodeValue.replace(/(^\r?\n)|(\r?\n$)/g, '');
		}
	}
	return result;
}

//Recursively transform the nodes in a tree
function processNode(node, targetDocument, depth){
	depth = (depth || 0);
	var children = new Array();

	var child = node.firstChild;
	while(child){
		children.push(processNode(child, targetDocument, depth+1));
		child = child.nextSibling;
	}

	var result;
	
	switch(node.nodeType){
		case Node.ELEMENT_NODE:
			result = buildElementNode(node, children, targetDocument, depth);
			break;
		case Node.TEXT_NODE:
			result = buildTextNode(targetDocument, node);
			break;
		case Node.CDATA_SECTION_NODE:
			result = templating.processTemplate(template.cdata, {'value':node.nodeValue});
			break;
		case Node.PROCESSING_INSTRUCTION_NODE:
			result = templating.processTemplate(template.processingInstruction, {'name':node.nodeName,'value':' '+node.nodeValue});
			break;
		case Node.COMMENT_NODE:
			result = templating.processTemplate(template.comment, {'value':node.nodeValue});
			break;
		case Node.DOCUMENT_NODE:
			//TODO: refactor
			result = templating.processTemplate(template.document);
			var value = template.document.values['value'](result);
			var p = value.parentNode;
			children.reParent(p);
			p.removeChild(value);
			result = result.firstChild;
			break;
	}
	
	return result;
}



var xmlTransformer = function(d, targetd, obj){
	var startCollapsed = (obj.startCollapsed == null) ? true : obj.startCollapsed;
	
	//Initialize templates
	template = template[(obj.templateName || 'standard')];
	for(var t in template)
		if(typeof template[t] === 'string')
			template[t] = template[t].toDomTemplate(targetd);

	//Pre-flight
	processNode(targetd.createTextNode('init'), targetd);

	//Transform DOM Nodes
	var newRoot = processNode(d, targetd);

	//Add fake XML Processing Instruction
	var doc = (d.ownerDocument ? d.ownerDocument : d);
	if(doc.xmlVersion){
		var xmlStandaloneText = doc.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = (doc.xmlEncoding ? doc.xmlEncoding : doc.inputEncoding);
		xmlEncodingText = (xmlEncodingText) ? ' encoding="' + xmlEncodingText+'"' : '';
		var xmlTextNode = 'version="'+doc.xmlVersion+'"'+xmlEncodingText+' standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = templating.processTemplate(template.processingInstruction, {'name':'xml','value':' '+xmlTextNode});
		
		newRoot.insertBefore(xmlTextNode, newRoot.firstChild);
	}

	// Attach folding handlers
	addEventListeners(template, newRoot);

	if(startCollapsed){
		var nodes = newRoot.querySelectorAll("div[class~='xml-viewer-tag-collapsible']")
			.filter(function(item){ return item.parentNode && item.parentNode.depth && item.parentNode.depth > 1; });

		for(var i=0;i<nodes.length;i++)
			nodes[i].parentNode.collapse();
	}

	return newRoot;
};


function showConsoleErrorMessage(text){
	console.group('XML Document');
	text = text.split('\n');
	for(var i=0;i<text.length;i++)
		if(text[i].length > 0){
			if(text[i].indexOf('warning') == 0)
				console.warn(text[i]);
			else
				console.error(text[i]);
		}
	console.groupEnd();
}

var errorTransformer = function(d, targetd, obj){
	if(d.querySelector('parsererror > div') == null) return false;

	//Show parsing error message(s) in the console	
	var text = d.querySelector('parsererror > div').innerText;
	showConsoleErrorMessage(text);

	//Add error message to targetd
	//Only xml documents not passed as xml will not have the error in the original document
	if(targetd.querySelector('parsererror > div') == null){
		var parseerror = d.querySelector('parsererror');

		if(parseerror.ownerDocument != targetd)
			parseerror = targetd.importNode(parseerror, true);
			
		var body = targetd.querySelector('body');
		body.insertBefore(parseerror, body.firstChild);
	}

	return null;
}



etl.transformers.push(errorTransformer);
etl.transformers.push(xmlTransformer);



// Helpers
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
	delimiter = delimiter || ' ';
	options = options || 'gi';
	if(!delimiter) delimiter = ' ';
	var r = new RegExp('('+delimiter+')?' + value + '('+delimiter+')?', options);
	var m = this.match(r);
	return (m) ? this.replace(r, (m[1] && m[2])? delimiter : '') : this;
};

String.prototype.addWordUnique = function(value1, delimiter){
	delimiter = delimiter || ' ';
	var result = this;
	if(result.search(new RegExp('\\b' + value1 + '\\b', 'i')) < 0)
		result += ((result.length > 0)?delimiter:'') + value1;
	return result;
};

String.prototype.flip = function(value1, delimiter){
	if(!delimiter) delimiter = ' ';
	var result = this;
	if(result.search(new RegExp('\\b' + value1 + '\\b', 'i')) > -1)
		result = result.removeWord(value1, delimiter, 'gi');
	else
		result += ((result.length > 0)?delimiter:'') + value1;

	return result;
};

})();
