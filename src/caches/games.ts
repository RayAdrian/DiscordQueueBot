import { Games } from "../models";
import { Game } from "../models/game";

export default class GamesCache {
    gamesMap: Map<string, Game>;
    gameNames: Set<string>;

    constructor() {
        this.gamesMap = new Map<string, Game>();
        this.gameNames = new Set<string>();
    }

    getGameNames = () : Array<string> => {
        return Array(...this.gameNames);
    }

    fetch = () : void => {
        Games.find({}).exec().then((data) => {
            data.forEach((game) => {
                const name = game.name;
                this.gamesMap.set(name, game);
                this.gameNames.add(name);
            });
        });
    }
};
