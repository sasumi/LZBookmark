import {I18N} from "./I18N.js";
import {Util} from "./Util.js";

I18N.loadLanguageFile(I18N.getCurrentLanguage()).then(()=>{
	Util.getTextNode(document.body).forEach(node => {
		node.nodeValue = I18N.transUI(node.nodeValue);
	});
	$('[title]').each((k, node)=>{
		$(node).attr('title', I18N.transUI($(node).attr('title')));
	});

	$(':input[placeholder]').each((k, node)=>{
		$(node).attr('placeholder', I18N.transUI($(node).attr('placeholder')));
	});
});