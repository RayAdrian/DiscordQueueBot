export class GameCache {
    gamesMap: object;
    gameNamesList: string[];
    lineups: object;

    constructor() {
        this.gamesMap = {};
        this.gameNamesList = [];
        this.lineups = {};
    }
};
