import { rebuildCache } from './Search'

Hooks.once('init', async function() {
	game.settings.register("foundry-filepicker-favorites", "favorites-location", {
		scope: "world",
		config: false,
		type: Array,
		default: [{label: 'Core Icons', source: 'public', path: 'icons/'}]
	});

	game.settings.registerMenu("foundry-filepicker-favorites", "favorites", {
		name: "Favorites Settings",
		label: "Favorites Settings",
		hint: 'Most changes require a reload.',
		icon: "fas fa-cog",
		type: FavoritesForm,
		restricted: true
	});

	game.settings.register("foundry-filepicker-favorites", "search-max-results", {
		name: "Maximum number of results in search",
		hint: 'Use 0 to always display all results.',
		scope: "world",
		config: true,
		type: Number,
		default: 100
	});

	game.settings.register("foundry-filepicker-favorites", "search-speed-limit", {
		name: "Limit search cache creation speed.",
		hint: 'This limits the speed of the cache building. This is especially useful if you store files on external services.',
		scope: "world",
		config: true,
		type: Number,
		default: 100
	});

	game.settings.register("foundry-filepicker-favorites", "search-excludes", {
		scope: "world",
		config: false,
		type: Array,
		default: [],
		onChange: rebuildCache
	});

	game.settings.register("foundry-filepicker-favorites", "search-includes", {
		scope: "world",
		config: false,
		type: Array,
		default: [],
		onChange: rebuildCache
	});
	game.settings.register("foundry-filepicker-favorites", "search-cache", {
		scope: "world",
		config: false,
		type: String,
		default: ""
	});

	game.settings.registerMenu("foundry-filepicker-favorites", "search-excludes-menu", {
		name: "Search Settings",
		label: "Search Settings",
		hint: 'Changes require a reload.',
		icon: "fas fa-cog",
		type: SearchForm,
		restricted: true
	});


});

// backwards compatibility /////////////////////////////////////////////////////////////////////////////////////////////////////////
Hooks.once('ready', async function() {
	let oldSetting:any = game.settings.get("foundry-filepicker-favorites", "favorites-location")
	if (oldSetting instanceof Array && oldSetting.length == 1 && typeof oldSetting[0] === 'string') {
		oldSetting = oldSetting[0];
	}
	if (typeof oldSetting === 'string' || oldSetting instanceof String) {
		console.log("foundry-filepicker-favorites | Found old settings, trying to translate");
		let favorites:Favorite[] = []
		let split = oldSetting.split('|')
		for(let i = 0;i<split.length;i+=3) {
			favorites.push({label: split[i], source: split[i+1] as FilePicker.SourceType, path: split[i+2]})
		}
		game.settings.set("foundry-filepicker-favorites", "favorites-location", favorites);
	}
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class Favorite {
	label: string
	source: FilePicker.SourceType
	path: string
}

class SourceOption {
}

class FavoritesData {
	sources: FilePicker.Sources
	data: Favorite[]
}

class FavoritesForm extends FormApplication<FormApplicationOptions, FavoritesData, Favorite[]> {
	constructor() {
		super(game.settings.get("foundry-filepicker-favorites", "favorites-location"))
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['form'],
			popOut: true,
			template: '/modules/foundry-filepicker-favorites/templates/favoritesForm.html',
			id: 'foundry-filepicker-favorites-form',
			title: 'Favorites Settings',
		});
	}

	getData() {
		return {
			sources: new FilePicker({}).sources,
			data: this.object
		};
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find("#addFavorite").on("click", this._addRow.bind(this));
		html.find(".deleteFavoriteOption").on("click", this._removeRow.bind(this));
	}

	_addRow(e:Event) {
		let flat = foundry.utils.expandObject(this._getSubmitData());
		let result:Favorite[] = Object.values(flat);
		result.push(new Favorite());
		this.object = result
		this.render(false, {height: "auto"} as any);
	}

	_removeRow(e:Event) {
		let flat = foundry.utils.expandObject(this._getSubmitData());
		let result:Favorite[] = Object.values(flat);
		let index = (e.currentTarget as HTMLButtonElement).dataset.index;
		if(index) {
			result.splice(parseInt(index), 1);
			this.object = result;
			this.render(false, {height: "auto"} as any);
		}
	}

	async _updateObject(event, formData) {
		let flat = foundry.utils.expandObject(formData);
		let result:Favorite[] = Object.values(flat);
		game.settings.set("foundry-filepicker-favorites", "favorites-location", result);
	}
}

class SearchOptions {
	includes:string[]
	excludes:string[]
}
class SearchForm extends FormApplication<FormApplicationOptions, SearchOptions, SearchOptions> {
	constructor() {
		super({
			excludes: game.settings.get("foundry-filepicker-favorites", "search-excludes"),
			includes: game.settings.get("foundry-filepicker-favorites", "search-includes")
		})
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ['form'],
			popOut: true,
			template: '/modules/foundry-filepicker-favorites/templates/searchForm.html',
			id: 'foundry-filepicker-search-form',
			title: 'Search Settings',
		});
	}

	getData() {
		return this.object;
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find("#addIncludePath").on("click", this._addIncludeRow.bind(this));
		html.find("#addExcludePath").on("click", this._addExcludeRow.bind(this));
		html.find(".deleteIncludePathOption").on("click", this._removeIncludeRow.bind(this));
		html.find(".deleteExcludePathOption").on("click", this._removeExcludeRow.bind(this));
		html.find("#storeIndex").on("click", this._storeIndex.bind(this));
	}

	_toOptions(value:any): SearchOptions {
		if(value) {
			let flat = foundry.utils.expandObject(value);
			return {
				includes: flat.includes?Object.values(flat.includes):[],
				excludes: flat.excludes?Object.values(flat.excludes):[]
			};
		}
		return {includes:[], excludes:[]};
	}

	_addIncludeRow(e:Event) {
		let result = this._toOptions(this._getSubmitData());
		result.includes.push("placeholder");
		this.object = result;
		this.render(false, {height: "auto"} as any);
	}

	_addExcludeRow(e:Event) {
		let result = this._toOptions(this._getSubmitData());
		result.excludes.push("placeholder");
		this.object = result;
		this.render(false, {height: "auto"} as any);
	}

	_removeIncludeRow(e:Event) {
		let result = this._toOptions(this._getSubmitData());
		let index = (e.currentTarget as HTMLButtonElement).dataset.index;
		if(index) {
			result.includes.splice(parseInt(index), 1);
			this.object = result;
			this.render(false, {height: "auto"} as any);
		}
	}

	_removeExcludeRow(e:Event) {
		let result = this._toOptions(this._getSubmitData());
		let index = (e.currentTarget as HTMLButtonElement).dataset.index;
		if(index) {
			result.excludes.splice(parseInt(index), 1);
			this.object = result;
			this.render(false, {height: "auto"} as any);
		}
	}

	_storeIndex(e:Event) {
		rebuildCache();
	}

	async _updateObject(event, formData) {
		let result = this._toOptions(formData);
		this.object = result;
		game.settings.set("foundry-filepicker-favorites", "search-excludes", result.excludes);
		game.settings.set("foundry-filepicker-favorites", "search-includes", result.includes);
	}
}
