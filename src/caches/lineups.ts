export default class LineupsCache {
    lineups: object;

    constructor() {
        this.lineups = {};
    }

    initialize = (gameNames : string[]) => {
        gameNames.forEach((name) => {
            this.lineups[name] = [];
        });
    }

    reset = () => {
        this.initialize(Object.keys(this.lineups));
    }

    fetch = () : void => {
        // TODO: Fetch Lineups
    }
};
