import { libWrapper } from './shim';
import { createIndex, addDocumentToIndex } from "ndx";
import { query } from "ndx-query";
import { toSerializable, fromSerializable, SerializableIndex } from "ndx-serializable";
import Bottleneck from 'bottleneck';
import localforage from 'localforage';

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */





/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
//Hooks.once('setup', function() {});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function() {

	libWrapper.register('foundry-filepicker-favorites', 'FilePicker.prototype._onSearchFilter', function (wrapped:Function, event: KeyboardEvent , query: string, rgx:RegExp, html:HTMLElement) {
		if(this.activeSource == 'search') {

		}
		else {
			return wrapped(event, query, rgx, html);
		}
	}, 'MIXED');

	libWrapper.register('foundry-filepicker-favorites', 'FilePicker.prototype.source', function (wrapped:Function) {
		if(this.activeSource == 'search') {
			return searchSource(this);
		}
		else {
			return wrapped();
		}
	}, 'MIXED');

	libWrapper.register('foundry-filepicker-favorites', 'FilePicker.prototype.getData', function (wrapped:Function, options:any) {
		let prom = wrapped(options) as Promise<any>;
		let fp = this;
		return prom.then(async function(res) {
			res.sources = Object.assign({ search: searchSource(fp)}, res.sources);
			return res;
		});
	}, 'WRAPPER');

	function searchSource(fp:FilePicker) {
		let s = fp as any;
		if(!s.searchSource) {
			s.searchSource = {
				target: "",
				label: "Search",
				icon: "fas fa-search"
			};
		}
		return s.searchSource;
	}

	libWrapper.register('foundry-filepicker-favorites', 'FilePicker._manageFiles', async function (wrapped:Function, data:any, options:any) {
		if(data.storage === 'search') {
			
            let maximumResults = game.settings.get("foundry-filepicker-favorites", "search-max-results");
			let results:string[] = [];

			let searchResult = query(
				SEARCH,
				[3,1],
				// BM25 ranking function constants:
				1.2,  // BM25 k1 constant, controls non-linear term frequency normalization (saturation).
				0.75, // BM25 b constant, controls to what degree document length normalizes tf values.
				tokenize,
				filter,
				undefined, 
				data.target as string,
			);
			searchResult.length = Math.min(searchResult.length, maximumResults);
			searchResult.forEach(element => {
				results.push(element.key);
			});

			return {
				"target": data.target,
				"private": true,
				"dirs": [],
				"privateDirs": [],
				"files": results,
				"extensions": options.extensions
			};
		}
		else {
			return await wrapped(data, options);
		}
	}, 'MIXED');
});

class SearchFile {
    path:string;
    name:string;
}

var SEARCH = newSearch();

function newSearch() {
	return createIndex<string>(2);
}

function cacheKey() {
	return "foundry-filepicker-favorites." + game.world.id + ".search-cache";
}

Hooks.once('ready', async function() {
	if ( game.world && !game.user?.can("FILES_BROWSE") ) return;
	let rawCache = await localforage.getItem<SerializableIndex<string>>(cacheKey());
	if(!rawCache) {
		console.log("foundry-filepicker-favorites | No cache found, rebuilding");
		ui.notifications.warn("No search cache found, rebuilding cache.");
		rebuildCache();
		return;
	}
	
	try {
		console.log("foundry-filepicker-favorites | Loading cache from storage");
		SEARCH = fromSerializable(rawCache);
		console.log("foundry-filepicker-favorites | Loaded cache");
	} catch (error) {
		ui.notifications.error("Failed to load cache, rebuilding cache.");
		console.log("foundry-filepicker-favorites | Could not load cache, rebuilding", error);
		rebuildCache();
	}
});


export async function rebuildCache() {
	if ( game.world && !game.user?.can("FILES_BROWSE") ) return;
	await localforage.removeItem(cacheKey());
	SEARCH = newSearch();
	let includes = game.settings.get("foundry-filepicker-favorites", "search-includes").map(encodeURI);
	let excludes = game.settings.get("foundry-filepicker-favorites", "search-excludes").map(encodeURI);
	let usingForge = typeof (ForgeVTT) !== "undefined" && ForgeVTT.usingTheForge;

	let fp = new FilePicker({type: 'imagevideo'});
	let options = {
		extensions: fp.extensions,
		wildcard: false,
		recursive: true
	}

	let promises:Promise<void>[] = [];
	for (const [key, value] of Object.entries(fp.sources)) {
		promises.push(collectFiles(key, [''], options));
	}
	Promise.all(promises).then((values) => {
        console.log("foundry-filepicker-favorites | Finished indexing, storing");
		localforage.setItem(cacheKey(), toSerializable(SEARCH))
		ui.notifications.info("Fully rebuilt search cache");
	});

	async function collectFiles(storage:string, roots:string[], options:any):Promise<void> {
		if ( game.world && !game.user?.can("FILES_BROWSE") ) return;

		let counter = 0;

		const limiter = new Bottleneck({
			minTime: game.settings.get("foundry-filepicker-favorites", "search-speed-limit"),
			maxConcurrent: 1,
		});
	
		let open = [...roots];
		let target:string|undefined;
		while((target = open.pop())!==undefined) {

			let file:string = target;
			
			if(includes && !includes.some(v => file.startsWith(v)) && !includes.some(v => v.startsWith(file))) {
				console.log("foundry-filepicker-favorites | Skipping "+file+" because it is not in the includes");
				continue;
			}

			if(excludes && excludes.some(v => file.startsWith(v))) {
				console.log("foundry-filepicker-favorites | Skipping "+file+" because it is in the excludes");
				continue;
			}

			try {
				let search = await limiter.schedule(() => FilePicker.browse(storage as any, file, options));
				if(search.private && !game.user?.hasRole('GAMEMASTER'))
					continue;

				//if not using the shortcut on the forge (recursive option)
				if( ! (usingForge && (storage === "forgevtt" || (storage === 'forge-bazaar' && (file.match(/\//g)||[]).length > 0)))) {
					open.push(...search.dirs);
				}
				
				for(const f of search.files) {
					let parts = f.split("/");
					addSearchDoc({path: f, name: parts[-1]});
					counter++;
				}
			} catch (error) {
				// if this folder is not accessible (e.g. private) fail silently
			}
		}
        console.log("foundry-filepicker-favorites | Indexed "+counter+" images from "+storage);
	}
}

function tokenize(term:string):string[] {
	return decodeURI(term).split(/[\W_]+|(?<![A-Z])(?=[A-Z])|(?<!\d)(?=\d)/);
}

function filter(word:string):string {
	return word.toLocaleLowerCase();
}

function addSearchDoc(file:SearchFile) {
	addDocumentToIndex(
		SEARCH,
		[a=>a.name, a=>a.path],
		tokenize,
		filter,
		file.path,
		file
	)
}
