/**
 * Checks whether a string is a valid (discord) id
 * @param id 
 */
export default function isValidId(id : string) : boolean {
    const idRegex = /^<@&[0-9]+>$/i; // id format: <@&1234567890>
    return idRegex.test(id);
}