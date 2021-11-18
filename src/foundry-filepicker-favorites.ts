import { registerSettings } from './module/settings.js';
import { preloadTemplates } from './module/preloadTemplates.js';
import { libWrapper } from './module/shim.js';

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function() {
	console.log('foundry-filepicker-favorites | Initializing foundry-filepicker-favorites');

	// Assign custom classes and constants here
	
	// Register custom module settings
	registerSettings();
	
	// Preload Handlebars templates
	await preloadTemplates();

	// Register custom sheets (if any)
});

/* ------------------------------------ */
/* Setup module							*/
/* ------------------------------------ */
//Hooks.once('setup', function() {});

/* ------------------------------------ */
/* When ready							*/
/* ------------------------------------ */
Hooks.once('ready', function() {

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

			let settings:String = game.settings.get("foundry-filepicker-favorites", "mySetting")
			let favorites = []
			let split = settings.split('|')
			for(let i = 0;i<split.length;i+=3) {
				favorites.push({label: split[i], source: split[i+1], path: split[i+2]})
			}
			let inner = (await renderTemplate("modules/foundry-filepicker-favorites/templates/filepicker.html", favorites));
			let node = $(inner as unknown as String)[0] as unknown as Node; //ugly fix to wrong typing
			root.insertBefore(node, root.firstChild);
			return html;
		});
	}, 'WRAPPER');
});