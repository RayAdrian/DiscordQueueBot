/**
 * Check if count is a non-negative integer
 * @param count
 */
export default function isValidCount(count : string) : boolean {
    const numberCount = count ? Number(count) : Number.NaN;
    return !isNaN(numberCount) && Number.isInteger(numberCount) && numberCount >= 0;
}