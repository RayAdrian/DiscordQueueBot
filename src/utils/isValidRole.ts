/**
 * Checks whether the role is valid
 * @param role 
 */
export default function isValidRole(role : string) : boolean {
    const roleRegex = /^<@&[0-9]+>$/i; // role id format: <@&1234567890>
    return roleRegex.test(role);
}