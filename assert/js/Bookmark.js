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

	static arrayWalkRecursive = (nodes, callback)=>{
		nodes.forEach((item)=>{
			callback(item);
			if(item.children){
				Bookmark.arrayWalkRecursive(item.children, callback);
			}
		});
	};

	static getPlainTreeNodes = (nodes) => {
		let ret = [];
		Bookmark.arrayWalkRecursive(nodes, function(item){
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

	static foundEmptyFolders = (plain_tree_nodes) => {
		let ret = [];
		plain_tree_nodes.forEach((item)=>{
			if(item.children_count === 0 && !item.url){
				ret.push(item);
			}
		});
		return ret;
	};

	static foundSameUrlNodes = (plain_tree_nodes)=>{
		let ret = [];
		let map = {};
		plain_tree_nodes.forEach((item)=>{
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
	 * @param plain_tree_nodes
	 * @returns {[]}
	 */
	static foundMergeFolders = (plain_tree_nodes)=>{
		let ret = [];
		let last_level = 0;
		let tmp_titles = {};
		plain_tree_nodes.forEach((item)=>{
			if(Bookmark.resolveType(item) !== Bookmark.TYPE_FOLDER){
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

	static getChildren = (plain_tree_nodes, parentId)=>{
		let ret = [];
		plain_tree_nodes.forEach((item)=>{
			if(item.parentId === parentId){
				ret.push(item);
			}
		});
		return ret;
	};

	static getFolderSelection = (plain_nodes)=>{
		let html = '<select>';
		plain_nodes.forEach((item)=>{
			if(Bookmark.resolveType(item) === Bookmark.TYPE_FOLDER){
				let tab = Util.strRepeat('&nbsp;',item.level*4);
				html += `<option value="${item.id}">${tab} ${Util.escape(item.title)}</option>`;
			}
		});
		return html + `<select>`;
	};

	static resolveType = (item)=>{
		return item.url ? Bookmark.TYPE_LINK : Bookmark.TYPE_FOLDER;
	};
}

export {Bookmark};
