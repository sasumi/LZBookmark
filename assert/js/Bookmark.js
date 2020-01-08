import {Util} from "./Util.js";
class Bookmark {
	static TYPE_FOLDER = 'folder';
	static TYPE_LINK = 'link';

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

	static getFolderSelection = (id)=>{
		let html = '<select>';
		Bookmark.walkChildren(id, function(item, level){
			if(Bookmark.isFolder(item)){
				let tab = Util.strRepeat('&nbsp;',level*4);
				html += `<option value="${item.id}">${tab} ${Util.escape(item.title)}</option>`;
			}
		});
		return html + `<select>`;
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

	static walkChildren(id, callback, _level = 0){
		Bookmark.getChildren(id, function(items){
			items.forEach((item)=>{
				callback(item, _level);
				if(item.children){
					Bookmark.walkChildren(item.id, callback, _level+1);
				}
			});
		})
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

	static move(id, destination, callback){
		return chrome.bookmarks.move(id + '', destination, callback);
	}

	static update(id, changes, callback){
		return chrome.bookmarks.update(id + '', changes, callback);
	}

	static remove(id, callback){
		return chrome.bookmarks.remove(id + '', callback);
	}

	static removeTree(id, callback){
		return chrome.bookmarks.removeTree(id + '', callback);
	}
}

export {Bookmark};
