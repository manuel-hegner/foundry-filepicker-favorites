import { Favorite } from "./module/settings";
export {};

declare global {
    namespace ClientSettings {
        interface Values {
            'foundry-filepicker-favorites.favorites-location': Favorite[];
            'foundry-filepicker-favorites.search-max-results': number;
            'foundry-filepicker-favorites.search-speed-limit': number;
            'foundry-filepicker-favorites.search-excludes': string[];
            'foundry-filepicker-favorites.search-includes': string[];
            'foundry-filepicker-favorites.search-cache': string;
        }
    }

    class ForgeVTT {
        static usingTheForge: boolean;
    }

    class ForgeAPI {
        static call(endpoint:string): Promise<any>
    }
}