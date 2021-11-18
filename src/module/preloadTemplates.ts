export const preloadTemplates = async function() {
	const templatePaths = [
		'templates/filepicker.html'
	];

	return loadTemplates(templatePaths);
}
