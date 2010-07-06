var etl = {
	"extractors":[]
	,"transformers":[]
	,"loaders":[]
	,"executeFirst":function(d){
		var data = this.extractors.executeFirst(d);
		if(data == null) return null;
		data = this.transformers.executeFirst(data, d);
		if(data == null) return null;		
		return this.loaders.executeFirst(data, d);
	}
};





(function(){

function isXml(elem){
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};


//
// Extractors
//
var xmlDomExtractor = function(d){
	if(d == null || !isXml(d)) return false;
	return d;
};

var xmlFormatDomExtractor = function(d){
	if(d == null) return false;
	var r = XRegExp('(^\\s*<\\?xml[^\\n]+)|(^\\s*<(\\S+).+</\\3>\\s*$)','si');
	var pre = d.querySelectorAll('body > pre');
	var isXml = pre.length == 1 && pre[0].childElementCount == 0 && r.test(pre[0].innerText);
	if(!isXml) return false;
	
	pre = pre[0].innerText.toDOM();
	return (pre)?pre:false;
};

//
// Loaders
//

var xmlDomLoader = function(d, targetd){
	if(!isXml(targetd)) return false;

	//Attach CSS file
	//TODO remove chrome extension dependency
	var pi = targetd.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xml.css') + '"');
	targetd.insertBefore(pi, targetd.firstChild);

	//Attach the new tree
	if(document.documentElement)
		targetd.replaceChild(d, targetd.documentElement);
	else
		targetd.appendChild(d);

	return true;
};

var htmlXmlFileDomLoader = function(d, targetd){
	
	var pre = targetd.querySelectorAll('body > pre');
	if(pre.length != 1) return false;
	
	//Load
	pre[0].parentNode.replaceChild(d, pre[0]);

	//Append CSS
	//TODO remove chrome extension dependency
	targetd.insertHtmlLinkElement(chrome.extension.getURL('xml.css'));

	return true;
};

//
// Transformers
//
var xmlTransformer = function(d, targetd){
	//Transform DOM Nodes
	var newRoot = processNode(d, targetd);

	//Add fake XML Processing Instruction
	var doc = (d.ownerDocument ? d.ownerDocument : d);
	if(doc.xmlVersion){
		var xmlStandaloneText = doc.xmlStandalone ? 'yes' : 'no';
		var xmlEncodingText = (doc.xmlEncoding ? doc.xmlEncoding : doc.inputEncoding);
		xmlEncodingText = (xmlEncodingText) ? ' encoding="' + xmlEncodingText : '';
		var xmlTextNode = 'xml version="'+doc.xmlVersion+xmlEncodingText+'" standalone="'+xmlStandaloneText+'" ';
		xmlTextNode = xmlTextNode.toNode(targetd, 'div', 'xml-viewer-processing-instruction');
		newRoot.insertBefore(xmlTextNode, newRoot.firstChild);
	}

	return newRoot;
};





//Node Rendering
function buildNodeWithAttributes(node, tagName, className, targetDocument){
	var result = targetDocument.createElement(tagName);
	result.setAttribute('class', className);
	
	var tag = node.nodeName.toNode(targetDocument, 'span');

	if(node.hasAttributes())
		tag.appendChild(
			node.attributes.toNode(targetDocument, 'span', 'xml-viewer-attribute-name', 'xml-viewer-attribute-value', 'xml-viewer-attribute', 'xml-viewer-attribute-set')
			);
	if(node.hasChildNodes()) 
		tag.appendChild(">".toNode(targetDocument,'span','xml-viewer-start-bracket'));
	result.appendChild(tag);
	return result;
}

function buildEndNode(node, tagName, className, targetDocument){
	var result = node.nodeName.toNode(targetDocument, tagName, className);
	result.insertBefore("<".toNode(targetDocument,'span','xml-viewer-end-bracket'), result.firstChild);
	return result;
}



//Event Handler
function foldingHandler(event){
	event.cancelBubble = true;	

	var t = event.target;
	while(!t.getAttribute('class') || t.getAttribute('class').search(/\bxml-viewer-tag-collapsible\b/i) < 0)
		t = t.parentNode;
	t = t.nextSibling;

	var hiddenCssClass = 'xml-viewer-hidden';
	var c = t.getAttribute('class');

	if(c.search(new RegExp('\\b' + hiddenCssClass + '\\b', 'i')) > -1) //Hidden
		c = c.removeWord(hiddenCssClass, ' ', 'gi');
	else
		c += ' ' + hiddenCssClass;

	t.setAttribute('class', c);
}

function buildElementNode(node, newChildren, targetDocument){

	var hasChildren = newChildren && newChildren.length > 0;
	var isTagInline = newChildren 
			&& newChildren.length == 1 
			&& newChildren[0] 
			&& newChildren[0].nodeType == Node.TEXT_NODE
			&& newChildren[0].nodeValue.indexOf('\n') < 0;

	//Create new wrapper node
	var result = targetDocument.createElement('div');
	result.setAttribute('name',node.nodeName);
	result.setAttribute('class', isTagInline ? 'xml-viewer-tag xml-viewer-inline' : 'xml-viewer-tag');

	//Create tags
	var startTagStyle = 'xml-viewer-tag-start';
	if(!hasChildren) startTagStyle += ' xml-viewer-tag-end';
	else if(!isTagInline) startTagStyle += ' xml-viewer-tag-collapsible';
	result.appendChild(buildNodeWithAttributes(node, 'div', startTagStyle, targetDocument));

	if(hasChildren){
		var contentEl = targetDocument.createElement('div');
		contentEl.setAttribute('class','xml-viewer-tag-content');

		newChildren.reParent(contentEl);

		//Attach nodes
		result.appendChild(contentEl);
		result.appendChild(buildEndNode(node, 'div', 'xml-viewer-tag-end', targetDocument));
	}

	// Attach folding handler
	if(!isTagInline)
		result.firstChild.firstChild.addEventListener("click", foldingHandler, false);
	
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
function processNode(node, targetDocument){
	var children = new Array();

	if(node.hasChildNodes()){
		var child = node.firstChild;
		while(child){
			children.push(processNode(child, targetDocument));
			child = child.nextSibling;
		}
	}

	var result;
	
	switch(node.nodeType){
		case Node.ELEMENT_NODE:
			result = buildElementNode(node, children, targetDocument);
			break;
		case Node.TEXT_NODE:
			result = buildTextNode(targetDocument, node);
			break;
		case Node.CDATA_SECTION_NODE:
			result = node.nodeValue.toNode(targetDocument, 'pre', 'xml-viewer-cdata');
			break;
		case Node.PROCESSING_INSTRUCTION_NODE:
			result = (node.nodeName + " " + node.nodeValue).toNode(targetDocument, 'div', 'xml-viewer-processing-instruction');
			break;
		case Node.COMMENT_NODE:
			result = node.nodeValue.toNode(targetDocument, 'pre', 'xml-viewer-comment');
			break;
		case Node.DOCUMENT_NODE:
			result = targetDocument.createElement('div');
			result.setAttribute('class', 'xml-viewer-document');
			children.reParent(result);
			break;
	}
	
	return result;
}



etl.extractors = [xmlDomExtractor, xmlFormatDomExtractor];
etl.transformers = [xmlTransformer];
etl.loaders = [xmlDomLoader, htmlXmlFileDomLoader];

})();
