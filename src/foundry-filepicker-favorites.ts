import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { libWrapper } from './module/shim.js';

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */

Hooks.once('init', async function() {
	console.log('foundry-filepicker-favorites | Initializing foundry-filepicker-favorites');

	// Assign custom classes and constants here
	
	// Preload Handlebars templates
	await preloadTemplates();

	// Register custom sheets
});



/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
//Hooks.once('setup', function() {});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function() {

	// Register custom module settings
	registerSettings();

	(FilePicker.prototype as any)._onClickFavorite = function (event:Event) {
		event.preventDefault();
		let clicked =  event.target as HTMLElement;
		this.activeSource = clicked.dataset.source;
		this.browse(clicked.dataset.path);
	};

	libWrapper.register('foundry-filepicker-favorites', 'FilePicker.prototype.activateListeners', function (wrapped:Function, ...args) {
		wrapped(...args);
		let html = args[0];
		
		html.find(".filepicker-favorites button").click(this._onClickFavorite.bind(this));

		return;
	}, 'WRAPPER');

	libWrapper.register('foundry-filepicker-favorites', 'FilePicker.prototype._renderInner', function (wrapped:Function, ...args) {
		let prom = wrapped(...args) as Promise<HTMLElement[]>
		return prom.then(async function(html) {
			let root = html[0]

			let settings:string = game.settings.get("foundry-filepicker-favorites", "favorites-location")
			let favorites = []
			let split = settings.split('|')
			for(let i = 0;i<split.length;i+=3) {
				favorites.push({label: split[i], source: split[i+1], path: split[i+2]})
			}
			let inner = (await renderTemplate("modules/foundry-filepicker-favorites/templates/filepicker.html", favorites));
			let node = $(inner as unknown as string)[0] as unknown as Node; //ugly fix to wrong typing
			root.insertBefore(node, root.firstChild);
			return html;
		});
	}, 'WRAPPER');





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
			
			let results = [];
			let term = (data.target as string).trim().toLowerCase().split((/\s+/));
			term=term.filter(n => n);

			if(term.length > 0) {
				for(const f of ALL_FILES) {
					let name = f.toLowerCase();
					if(term.every(t=>name.includes(t))) {
						if(results.length >= 100) {
							ui.notifications.info("More than 100 results for '"+data.target+"'");
							break;
						}
						results.push(f);
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

	


	//static async _manageFiles(data, options) {
});

var ALL_FILES:string[] = [];
Hooks.once('ready', async function() {
	let fp = new FilePicker({type: 'imagevideo'} as any) as any;
	let options = {
		extensions: fp.extensions,
		wildcard: false
	}

	let promises = [];
	for (const [key, value] of Object.entries(fp.sources)) {
		promises.push(collectFiles(key, [(value as any).target], options));
	}
	Promise.all(promises).then((values) => {
		ui.notifications.info("Indexed "+ALL_FILES.length+" images");
	});

	async function collectFiles(storage:string, roots:string[], options:any):Promise<void> {
		if ( game.world && !(game.user as any).can("FILES_BROWSE") ) return;
	
		let open = [...roots];
		while(open.length > 0) {
			let target = open.pop();
			let search = await FilePicker.browse(storage, target, options);
			open.push(...search.dirs);
			ALL_FILES.push(...search.files);
		}
	}
});
