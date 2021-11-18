export const registerSettings = function() {
	let sources = Object.entries(new FilePicker({}).sources).map(v=>v[0]+' ('+(v[1] as any).label+')').join(', ');
	game.settings.register("foundry-filepicker-favorites", "mySetting", {
		name: "Favorite File Picker locations",
		hint: 'A "|" separated list in the format Name|Source|Path|Name2|Source2|Path2\n\nPossible sources are: '+sources,
		scope: "world",
		config: true,
		type: String,
		default: "Core Icons|public|icons/"
	});
}
