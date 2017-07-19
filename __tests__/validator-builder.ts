import { validatorBuilder as v, ValidatorBuilder, addCustom } from '../src/validator-builder';

describe('validatorBuilder()', () => {
    test('should be a function', () => {
        expect(typeof v).toBe('function');
    });

    test('should return an instance of ValidatorBuilder', () => {
        expect(v()).toBeInstanceOf(ValidatorBuilder);
    });
});
