Hooks.once('init', async function() {
	console.log('foundry-filepicker-favorites | Initializing Filepicker Improvements');

	await preloadTemplates();

	// Assign custom classes and constants here

	// Register custom sheets
});

const preloadTemplates = async function() {
	const templatePaths = [
		'/modules/foundry-filepicker-favorites/templates/favoritesForm.html'
	];

	return loadTemplates(templatePaths);
}

export * from './module/settings';
export * from './module/Search';
export * from './module/Favorites';