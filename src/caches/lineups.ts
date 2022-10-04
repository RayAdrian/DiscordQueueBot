export default class LineupsCache {
    lineups: Map<string, Array<Array<string>>>;

    constructor() {
        this.lineups = new Map<string, Array<Array<string>>>();
    }

    initialize = (gameNames : Array<string>) => {
        gameNames.forEach((name) => {
            this.lineups.set(name, []);
        });
    }

    fetch = () : void => {
        // TODO: Fetch Lineups
    }

    resetAllLineups = () => {
        // TODO: Add role validation and/or a voting check
        Array(...this.lineups.keys()).forEach((gameName) => this.lineups.set(gameName, []));
    }

    /**
     * Get a deep copy of the list of lineups stored in the lineups cache.
     * @returns List of lineups per game
     */
    getLineups() : Map<string, Array<Array<string>>> {
        const lineupsCopy = new Map<string, Array<Array<string>>>();
        this.lineups.forEach((gameLineups, gameName) => {
            lineupsCopy.set(
                gameName,
                gameLineups.map((gameLineup) => gameLineup.slice()),
            );
        });
        return lineupsCopy;
    }
};
