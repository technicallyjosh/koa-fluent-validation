import { exists } from '../dist';

describe('helpers', () => {
    describe('exists()', () => {
        test('should work properly', () => {
            expect(exists(undefined)).toBe(false);
            expect(exists(null)).toBe(false);
            expect(exists('')).toBe(true);
            expect(exists({})).toBe(true);
            expect(exists([])).toBe(true);
            expect(exists(1)).toBe(true);
            expect(exists(1.1)).toBe(true);
        });
    });
});
