import * as Koa from 'koa';
import { validation, v, f } from '../src';
import { exists } from '../src/helpers';
import { ValidatorBuilder, validatorBuilder, addCustom } from '../src/validator-builder';
import { IValidators } from '../src/validator-builder';

describe('validator()', () => {
    test('should be a function', () => {
        expect(typeof validation).toBe('function');
    });

    test('should return an async function', () => {
        expect(validation().constructor.name).toBe('AsyncFunction');
    });

    test('should apply properties on the context', async () => {
        const middleware = validation();
        const context = {} as Koa.Context;

        await middleware(
            context,
            () =>
                new Promise(resolve => {
                    resolve();
                })
        );

        expect(typeof context.validateBody).toBe('function');
        expect(context).toHaveProperty('validationErrors');
        expect(context.validationErrors).toBeUndefined;
    });
});

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

describe('validatorBuilder()', () => {
    test('should be a function', () => {
        expect(typeof v).toBe('function');
    });

    test('should return an instance of ValidatorBuilder', () => {
        expect(v()).toBeInstanceOf(ValidatorBuilder);
    });
});

describe('ValidatorBuilder', () => {
    test('should extend custom validator', () => {});

    test('should throw if no validators', () => {
        expect(() => v().validate('test')).toThrow('No validators specified!');
    });

    test('required() should validate', () => {
        const x = v().required();
        const msg = 'Value is required.';

        expect(x.validate(undefined)).toBe(msg);
        expect(x.validate(null)).toBe(msg);
        expect(x.validate('test')).toBeUndefined();
    });

    test('string() should validate', () => {
        const x = v().string();
        const msg = 'Value is an invalid string.';
        const eTypes = [{}, [], 1];

        expect(x.validate('')).toBeUndefined();
        expect(x.validate(undefined)).toBeUndefined();
        expect(x.validate(null)).toBeUndefined();

        eTypes.forEach(type => expect(x.validate(type)).toBe(msg));
    });

    test('email() should validate', () => {
        const x = v().email();
        const msg = 'Value is an invalid email.';
        const eTypes = [{}, [], 1, '', 't@'];

        expect(x.validate('test@test.com')).toBeUndefined();
        expect(x.validate(undefined)).toBeUndefined();
        expect(x.validate(null)).toBeUndefined();

        eTypes.forEach(type => expect(x.validate(type)).toBe(msg));
    });

    test('uuid() should validate', () => {
        const x = v().uuid();
        const msg = 'Value is an invalid v4 UUID.';
        const eTypes = [{}, [], 1, '', '134'];
        const v1 = 'be5fa2a8-6cfa-11e7-907b-a6006ad3dba0';

        expect(x.validate('4a368fb7-6084-41b0-bbd3-460f29301b3c')).toBeUndefined();
        expect(x.validate(undefined)).toBeUndefined();
        expect(x.validate(null)).toBeUndefined();

        eTypes.forEach(type => expect(x.validate(type)).toBe(msg));

        expect(x.validate(v1)).toBe(msg);
    });
});
