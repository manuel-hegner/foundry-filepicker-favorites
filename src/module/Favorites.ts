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

			let accessible:Favorite[] = [];
			for(const fav of favorites) {
				try {
					let search = await FilePicker.browse(fav.source, fav.path, {});

					if(!search.private || game.user?.hasRole('GAMEMASTER')) {
						accessible.push(fav);
					}
				} catch (error) {
					// if this folder is not accessible (e.g. private) fail silently
					console.log("foundry-filepicker-favorites | Could not browse to  "+fav.path, error);
				}
			}

			let inner = (await renderTemplate("modules/foundry-filepicker-favorites/templates/filepicker.html", accessible));
			let node = $(inner)[0];
			root.insertBefore(node, root.firstChild);
			return html;
		});
	}, 'WRAPPER');

});