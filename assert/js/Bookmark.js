import {Util} from "./Util.js";
class Bookmark {
	static TYPE_FOLDER = 'folder';
	static TYPE_LINK = 'link';
	static OPEN_CURRENT_TAB = 'CurrentTab';
	static OPEN_NEW_TAB = 'NewTab';
	static OPEN_NEW_TAB_BACK = 'NewTabBack';
	static OPEN_NEW_WIN = 'NewWin';
	static OPEN_INC_WIN = 'IncWin';

	static getParentTitlePath = (item ,all_map)=>{
		let parent_title = [];
		while(item && all_map[item.parentId]){
			item = all_map[item.parentId];
			parent_title.push(item.title);
		}
		return parent_title.reverse();
	};

	static convertPlain = (nodes) => {
		let ret = [];
		Util.arrayWalkRecursive(nodes, function(item){
			let data = {
				id: item.id,
				index: item.index,
				title: item.title,
				url: item.url,
				parentId: item.parentId,
				children_count: item.children ? item.children.length : 0
			};
			ret.push(data);
		});
		let all_map = {};
		ret.forEach((item)=>{
			all_map[item.id] = item;
		});
		for(let i=0; i<ret.length; i++){
			let titles = Bookmark.getParentTitlePath(ret[i], all_map);
			ret[i].parentTitle = titles.join(' / ');
			ret[i].level = titles.length;
		}
		return ret;
	};

	static foundEmptyFolders = (plain_items) => {
		let ret = [];
		plain_items.forEach((item)=>{
			if(item.children_count === 0 && !item.url){
				ret.push(item);
			}
		});
		return ret;
	};

	static foundSameUrlNodes = (plain_items)=>{
		let ret = [];
		let map = {};
		plain_items.forEach((item)=>{
			if(!item.url){
				return;
			}
			if(map[item.url]){
				ret.push(item);
			} else {
				map[item.url] = true;
			}
		});
		return ret;
	};

	/**
	 * merge same level + same name folders
	 * @param plain_items
	 * @returns {[]}
	 */
	static foundMergeFolders = (plain_items)=>{
		let ret = [];
		let last_level = 0;
		let tmp_titles = {};
		plain_items.forEach((item)=>{
			if(!this.isFolder(item)){
				return;
			}
			if(item.level !== last_level){
				last_level = item.level;
				tmp_titles = {[item.title]: item.id};
				return;
			}

			if(tmp_titles[item.title]){
				ret.push([item, tmp_titles[item.title]]);
				return;
			}

			tmp_titles[item.title] = item.id;
		});
		return ret;
	};

	static getFolderSelection = (rootId, parentId, currentId)=>{
		return new Promise((resolve)=>{
			Bookmark.getSubTree(rootId, function(plain_items){
				let html = '<select>';
				let level_limit = null;
				plain_items.forEach(function(item){
					if(Bookmark.isFolder(item)){
						let tab = Util.strRepeat('　',item.level*2);
						let selection = parentId == item.id ? 'selected' : '';
						if(currentId && item.id == currentId){
							level_limit = item.level;
						} else if(level_limit && level_limit >= item.level){
							level_limit = null;
						}
						html += `<option value="${item.id}" ${selection} ${level_limit ? 'disabled':''}>${tab} ${Util.escape(item.title)}</option>`;
					}
				});
				html = html + `<select>`;
				resolve(html);
			}, true);
		});

	};

	static getType = (item)=>{
		return item.url ? this.TYPE_LINK : this.TYPE_FOLDER;
	};

	static isFolder(item){
		return this.getType(item) === this.TYPE_FOLDER;
	}

	static getOne(id, callback){
		return chrome.bookmarks.get(id + '', function(items){
			callback(items[0]);
		});
	}

	static getList(idList, callback){
		return chrome.bookmarks.get(idList, callback);
	}

	static getChildren(id, callback, asPlain = false){
		return chrome.bookmarks.getChildren(id + '', function(items){
			callback(asPlain ? Bookmark.convertPlain(items) : items);
		});
	}

	static getRecent(num, callback){
		return chrome.bookmarks.getRecent(num, callback);
	}

	static getTree(callback){
		return chrome.bookmarks.getTree(callback);
	}

	static getSubTree(id, callback, asPlain = false){
		return chrome.bookmarks.getSubTree(id + '', function(items){
			callback(asPlain ? Bookmark.convertPlain(items) : items);
		});
	}

	static searchByKey(keyword, callback){
		return chrome.bookmarks.search(keyword, callback);
	}

	static create(bookmark, callback){
		return chrome.bookmarks.create(bookmark, callback);
	}

	static move(id, destination){
		return new Promise(resolve=>{
			chrome.bookmarks.move(id + '', destination, resolve);
		});
	}

	static update(id, changes, callback){
		return new Promise((resolve => {
			chrome.bookmarks.update(id + '', changes, resolve);
		}));
	}

	static remove(id){
		return new Promise(resolve => {
			chrome.bookmarks.remove(id + '', resolve);
		});
	}

	static removeTree(id, callback){
		return chrome.bookmarks.removeTree(id + '', callback);
	}

	/**
	 * open link
	 * @param url
	 * @param type
	 * @param callback
	 */
	static openLink(url, type = Bookmark.OPEN_CURRENT_TAB, callback = Util.EMPTY_FN){
		switch(type){
			case Bookmark.OPEN_NEW_TAB_BACK:
				chrome.tabs.create({url: url, active:false}, callback);
				break;

			case Bookmark.OPEN_NEW_TAB:
				chrome.tabs.create({url: url, active:true}, callback);
				break;

			case Bookmark.OPEN_NEW_WIN:
				chrome.windows.getCurrent(null, function(wd){
					chrome.windows.create({
						url: url
					}, callback);
				});
				break;

			case Bookmark.OPEN_INC_WIN:
				chrome.windows.getCurrent(null, function(wd){
					chrome.windows.create({
						url: url,
						incognito: true
					}, callback);
				});
				break;

			case Bookmark.OPEN_CURRENT_TAB:
			default:
				chrome.tabs.update(null, {url: url}, callback);
				break;
		}
	}
}

export {Bookmark};
