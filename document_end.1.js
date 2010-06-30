if( !document.isChromeViewSourcePage())
{
	if(document.isXmlFile())
	{
		//Create html element to prevent conflict with XML Tree
		var root = document.createElement('html');
		var body = document.createElement('body');
		root.appendChild(body);

		//Transform
		var d = transformXmlDocument(document, document);
		body.appendChild(d);
		d = root;
		
		//Attach CSS file
		var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xml.css') + '"');
		document.insertBefore(pi, document.firstChild);


		//Attach the new tree
		document.transformedTree = d;
		document.originalTree = null;
		if(document.documentElement){
			document.originalTree = document.documentElement;
			document.replaceChild(d, document.documentElement);
		}else{
			document.originalTree = document.childNodes.toArray();
			document.appendChild(d);
		}

	}
	else if(document.isPlainTextXmlFile())
	{
		var nodes = document.getPlainTextXmlFileNode();
		var originalTree = [];
		var transformedTree = [];
		//Transform
		for(var i=0;i<nodes.length;i++){
			var node = nodes[i];
			var d = node.innerText.toDOM();
			if(!d) continue; //Parser Error
			d = transformXmlDocument(d, document);

			transformedTree.push(d);
			originalTree.push(node);
			
			//Attach the new tree
			node.parentNode.replaceChild(d, node);
		}

		document.originalTree = originalTree;
		document.transformedTree = transformedTree;
		
		//Attach CSS file
		document.insertHtmlLinkElement(chrome.extension.getURL('xml.css'));
	}

	//Todo: Xml files transfered as html
}
