/**
 * Check if count is a non-negative integer
 * @param limit
 */
export default function isValidLimit(limit : string) : boolean {
    const numberCount = limit ? Number(limit) : Number.NaN;
    return !isNaN(numberCount) && Number.isInteger(numberCount) && numberCount >= 0;
}