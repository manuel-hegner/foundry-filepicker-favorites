import { libWrapper } from './shim';
import { Favorite } from './settings';

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

			let favorites:Favorite[] = game.settings.get("foundry-filepicker-favorites", "favorites-location")
			let inner = (await renderTemplate("modules/foundry-filepicker-favorites/templates/filepicker.html", favorites));
			let node = $(inner as unknown as string)[0] as unknown as Node; //ugly fix to wrong typing
			root.insertBefore(node, root.firstChild);
			return html;
		});
	}, 'WRAPPER');

});