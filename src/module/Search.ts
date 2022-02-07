import { libWrapper } from './shim';

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
			let term = (data.target as string).trim().toLowerCase().split((/\s+/));
			term=term.filter(n => n);

			if(term.length > 0) {
				for(const f of ALL_FILES) {
					if(term.every(t=>f.name.includes(t))) {
						if(maximumResults > 0 && results.length >= maximumResults) {
							ui.notifications.info(`More than ${maximumResults} results for '${data.target}'`);
							break;
						}
						results.push(f.file);
					}
				}
			}

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
    file:string;
    name:string;
}

var ALL_FILES:SearchFile[] = [];
Hooks.once('ready', async function() {
	let fp = new FilePicker({type: 'imagevideo'} as any) as any;
	let options = {
		extensions: fp.extensions,
		wildcard: false
	}

	let promises:Promise<void>[] = [];
	for (const [key, value] of Object.entries(fp.sources)) {
		promises.push(collectFiles(key, [(value as any).target], options));
	}
	Promise.all(promises).then((values) => {
        console.log("foundry-filepicker-favorites | Finished indexing, indexed "+ALL_FILES.length+" images");
	});

	async function collectFiles(storage:string, roots:string[], options:any):Promise<void> {
		if ( game.world && !(game.user as any).can("FILES_BROWSE") ) return;
	
        let counter = 0;
		let open = [...roots];
		let target:string|undefined;
		while(target = open.pop()) {
			let search = await FilePicker.browse(storage as any, target, options);
			open.push(...search.dirs);
            for(const f of search.files) {
                ALL_FILES.push({file: f, name: f.toLowerCase()});
                counter++;
            }
		}
        console.log("foundry-filepicker-favorites | Indexed "+counter+" images from "+storage);
	}
});
