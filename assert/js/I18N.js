import {Util} from "./Util.js";

class I18N {
	static currentLanguage = null;
	static LANGUAGE_CONFIG = {};
	static DEFAULT_LANGUAGE = 'zh_CN';
	static SUPPORT_LANGUAGES = ['zh_CN'];

	static fixSlash(lang){
		return lang.replace('-', '_');
	}

	static loadLanguageFile(languageCode){
		let lang = I18N.SUPPORT_LANGUAGES.includes(languageCode) ? languageCode : I18N.getCurrentLanguage();
		if(I18N.LANGUAGE_CONFIG[languageCode]){
			return new Promise(I18N.LANGUAGE_CONFIG[languageCode]);
		}
		return new Promise(resolve => {
			$.getJSON(Util.getURL(`i18n/${lang}.json`), json=>{
				console.info('set lang', languageCode, json);
				I18N.LANGUAGE_CONFIG[languageCode] = json;
				resolve(json);
			})
		})
	}

	static getCurrentLanguage(){
		if(!I18N.currentLanguage){
			let browser_lang = I18N.getUILanguage();
			if(I18N.SUPPORT_LANGUAGES.includes(browser_lang)){
				I18N.currentLanguage = browser_lang;
			} else {
				I18N.currentLanguage = I18N.DEFAULT_LANGUAGE;
			}
		}
		return I18N.DEFAULT_LANGUAGE;
	}

	static getUILanguage(){
		return I18N.fixSlash(chrome.i18n.getUILanguage());
	}

	static detectLanguageFirst(text){
		return I18N.detectLanguage(text).then((result)=>{
			return I18N.fixSlash(result[0].language);
		});
	}

	static detectLanguage(text){
		return new Promise(resolve => {
			chrome.i18n.detectLanguage(text, function(result) {
				resolve(result);
			});
		});
	}

	static getAcceptLanguages(){
		return new Promise(resolve => {
			chrome.i18n.getAcceptLanguages((languageList)=>{
				languageList.map(item=>{return I18N.fixSlash(item)});
				resolve(languageList);
			})
		});
	}

	static transUI(message){
		if(!message){
			return message;
		}
		if(!/{([^{]+)}/.test(message)){
			return message;
		}
		return message.replace(/{([^{]+)}/ig, (matches, org_text) => {
			return I18N._(org_text);
		});
	}

	static _(message, param = []){
		if(!I18N.LANGUAGE_CONFIG[I18N.currentLanguage]){
			console.warn('no language loaded', I18N.currentLanguage);
			return message;
		}
		let nt = I18N.LANGUAGE_CONFIG[I18N.currentLanguage][message];
		console.log('translate '+I18N.currentLanguage, message, 'result:', nt);
		return nt || message;
	}
}

export {I18N};