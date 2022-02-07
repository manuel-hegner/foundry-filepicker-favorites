import { Favorite } from "./module/settings";
export {};

declare global {
    namespace ClientSettings {
        interface Values {
            'foundry-filepicker-favorites.favorites-location': Favorite[];
            'foundry-filepicker-favorites.search-max-results': number;
        }
    }
}