export default class UsersCache {
    usersMap: object;
    usernames: string[];

    constructor() {
        this.usersMap = {};
        this.usernames = [];
    }

    fetch = () : void => {
        // TODO: Fetch Users
    }
};
