if( !document.isChromeViewSourcePage())
{
	if(document.isXmlFile())
	{
		//Transform
		var d = transformXmlDocument(document, document);

		//Attach CSS file
		var pi = document.createProcessingInstruction('xml-stylesheet', 'type="text/css" href="' + chrome.extension.getURL('xml.css') + '"');
		document.insertBefore(pi, document.firstChild);

		//Attach the new tree
		if(document.documentElement)
			document.replaceChild(d, document.documentElement);
		else
			document.appendChild(d);
	}
	else if(document.isPlainTextXmlFile())
	{
		var nodes = document.getPlainTextXmlFileNode();
		//Transform
		for(var i=0;i<nodes.length;i++){
			var node = nodes[i];
			var d = node.innerText.toDOM();
			d = transformXmlDocument(d, document);

			//Attach the new tree
			node.parentNode.replaceChild(d, node);
		}

		//Attach CSS file
		document.insertHtmlLinkElement(chrome.extension.getURL('xml.css'));
	}
	
	//Todo: Xml files transfered as html
}
