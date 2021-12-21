export const registerSettings = function() {
	let sources = Object
		.entries(new FilePicker({}).sources)
		.map(v=>v[0]+' ('+(v[1] as any).label+')')
		.join(', ');



	//for backwards compatibility
		game.settings.register("foundry-filepicker-favorites", "mySetting", {
			scope: "world",
			config: false,
			type: String
		});
		let defaultV = "Core Icons|public|icons/";
		if(game.settings.get("foundry-filepicker-favorites", "mySetting")) {
			defaultV = game.settings.get("foundry-filepicker-favorites", "mySetting");
		}
	//end
	
	game.settings.register("foundry-filepicker-favorites", "favorites-location", {
		name: "Favorite File Picker locations",
		hint: 'A "|" separated list in the format Name|Source|Path|Name2|Source2|Path2 Possible sources are: '+sources,
		scope: "world",
		config: true,
		type: String,
		restricted: true,
		default: defaultV
	});
}
