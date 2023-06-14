import { rebuildCache } from './Search';

Hooks.once('init', async function() {
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

	game.settings.registerMenu("foundry-filepicker-favorites", "search-excludes-menu", {
		name: "Search Settings",
		label: "Search Settings",
		hint: 'Changes require a reload.',
		icon: "fas fa-cog",
		type: SearchForm,
		restricted: true
	});


});

class SourceOption {
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
