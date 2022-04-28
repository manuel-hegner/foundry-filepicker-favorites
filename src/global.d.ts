import { Favorite } from "./module/settings";
export {};

declare global {
    namespace ClientSettings {
        interface Values {
            'foundry-filepicker-favorites.favorites-location': Favorite[];
            'foundry-filepicker-favorites.search-max-results': number;
        }
    }

    class ForgeVTT {
        static usingTheForge: boolean;
    }

    class ForgeAPI {
        static call(endpoint:string): Promise<any>
    }
}