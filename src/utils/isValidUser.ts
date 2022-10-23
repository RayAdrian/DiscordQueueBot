/**
 * Checks whether the user is valid
 * Sample id: <@1234567890>
 * @param user
 */
export default function isValidUser(role : string) : boolean {
    const roleRegex = /^<@[0-9]+>$/i; // user id format: <@1234567890>
    return roleRegex.test(role);
}