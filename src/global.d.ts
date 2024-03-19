import { Favorite } from "./module/settings";

export { };

declare global {
    namespace ClientSettings {
        interface Values {
            'foundry-filepicker-favorites.search-max-results': number;
            'foundry-filepicker-favorites.search-speed-limit': number;
            'foundry-filepicker-favorites.search-excludes': string[];
            'foundry-filepicker-favorites.search-includes': string[];
            'foundry-filepicker-favorites.favorites-location': Favorite[];
        }
    }

    class ForgeVTT {
        static usingTheForge: boolean;
    }

    class ForgeAPI {
        static call(endpoint:string): Promise<any>
    }

    class libWrapper {
        static register(module:string, override:string, f:Function, mode:'MIXED'|'WRAPPER');
    }
}