import { v } from '../dist';
import { ValidatorBuilder } from '../dist/validator-builder';
import { IValidators, IValidatorContext } from '../dist/validator-builder';

function checkUndefined(v: IValidators, values: any[]) {
    values.forEach(value => expect(v.validate({ value })).toBeUndefined());
}

function checkMessage(v: IValidators, values: any[], msg: string) {
    values.forEach(value => expect(v.validate({ value })).toBe(msg));
}

function errorTypes(v: IValidators, types: any[], msg: string) {
    types.forEach(type => expect(v.validate({ value: type })).toBe(msg));
}

describe('validatorBuilder()', () => {
    test('should be a function', () => {
        expect(typeof v).toBe('function');
    });

    test('should return an instance of ValidatorBuilder', () => {
        expect(v()).toBeInstanceOf(ValidatorBuilder);
    });
});

describe('ValidatorBuilder', () => {
    test('should throw if no validators', () => {
        expect(() => v().validate('test')).toThrow('No validators specified!');
    });

    test('required() should validate', () => {
        const x = v().required();
        const msg = 'Value is required.';
        const types = ['', undefined, null];

        checkUndefined(x, ['test', 1, {}, { value: 'test' }, []]);

        types.forEach(type => expect(x.validate({ value: type })).toBe(msg));
    });

    test('requiredIf() should validate', () => {
        const x = v().requiredIf('isRequired', value => value === true);
        const ctx: IValidatorContext = {
            obj: { isRequired: false, username: null },
            path: 'username',
            value: null,
        };

        expect(x.validate(ctx)).toBeUndefined();

        ctx.obj.isRequired = true;

        expect(x.validate(ctx)).toBe('Value is required.');
    });

    test('requiredNotIf() should validate', () => {
        const x = v().requiredNotIf('username', value => value === 'testuser');
        const ctx: IValidatorContext = {
            obj: { username: 'test' },
            path: 'username',
            value: 'test',
        };

        expect(x.validate(ctx)).toBeUndefined();

        delete ctx.value;

        expect(x.validate(ctx)).toBe('Value is required.');
    });

    test('notNull() should validate', () => {
        const x = v().notNull();

        checkUndefined(x, [undefined, 'test', [], {}, 1]);

        errorTypes(x, [null], 'Value cannot be null if defined.');
    });

    test('string() should validate', () => {
        const x = v().string();
        const msg = 'Value is an invalid string.';
        const eTypes = [{}, [], 1];

        checkUndefined(x, ['', undefined, null]);

        errorTypes(x, eTypes, msg);
    });

    test('email() should validate', () => {
        const x = v().email();
        const msg = 'Value is an invalid email.';
        const eTypes = [{}, [], 1, '', 't@'];

        checkUndefined(x, ['test@test.com', undefined, null]);

        errorTypes(x, eTypes, msg);
    });

    test('uuid() should validate', () => {
        const x = v().uuid();
        const msg = 'Value is an invalid UUID (version: 4).';
        const eTypes = [{}, [], 1, '', '134', 'be5fa2a8-6cfa-11e7-907b-a6006ad3dba0'];

        checkUndefined(x, ['4a368fb7-6084-41b0-bbd3-460f29301b3c', undefined, null]);

        errorTypes(x, eTypes, msg);
    });

    test('number() should validate', () => {
        const x = v().number();
        const y = v().number(true);
        const msg = 'Value is an invalid number.';
        const eTypes = [{}, [], '', 'a'];

        checkUndefined(x, [1, '1', undefined, null]);

        errorTypes(x, eTypes, msg);

        checkMessage(y, ['1', '1.1'], msg);
    });

    test('float() should validate', () => {
        const x = v().float();

        const msg = 'Value is an invalid float.';
        const eTypes = [{}, [], ''];

        checkUndefined(x, [1, 1.1, undefined, null]);

        errorTypes(x, eTypes, msg);
    });

    test('currency() should validate', () => {
        const x = v().currency();
        const msg = 'Value is an invalid currency.';
        const eTypes = [{}, [], '', 'a', 1.1, '1.1'];

        checkUndefined(x, [1, '1.10', undefined, null]);

        errorTypes(x, eTypes, msg);
    });

    test('decimal() should validate', () => {
        const x = v().decimal();
        const y = v().decimal(true);
        const msg = 'Value is an invalid decimal.';
        const eTypes = [{}, [], '', 'a'];

        checkUndefined(x, [1, undefined, null]);

        errorTypes(x, eTypes, msg);

        checkMessage(y, ['1'], msg);
    });

    test('int() should validate', () => {
        const x = v().int();
        const msg = 'Value is an invalid int.';
        const eTypes = [{}, [], '', 'a'];

        checkUndefined(x, [1, undefined, null]);

        errorTypes(x, eTypes, msg);
    });

    test('length() should validate', () => {
        const min1 = v().length();
        const min2 = v().length(2);
        const max1 = v().length(1, 1);
        const max2 = v().length(1, 2);
        const msg1 = 'Value is an invalid string or does not have a min length of 1.';
        const msg2 = 'Value is an invalid string or does not have a min length of 2.';
        const msg3 =
            'Value is an invalid string or does not have a min length of 1 and a max length of 1.';
        const msg4 =
            'Value is an invalid string or does not have a min length of 1 and a max length of 2.';

        checkUndefined(min1, ['a', undefined, null]);
        expect(min1.validate({ value: '' })).toBe(msg1);

        checkUndefined(min2, ['ab', undefined, null]);
        checkMessage(min2, ['', 'a'], msg2);

        checkUndefined(max1, ['a', undefined, null]);
        expect(max1.validate({ value: 'aa' })).toBe(msg3);

        checkUndefined(max2, ['a', undefined, null]);
        expect(max2.validate({ value: 'aaa' })).toBe(msg4);
    });

    test('base64() should validate', () => {
        const x = v().base64();

        checkUndefined(x, ['dGVzdA==', undefined, null]);
        checkMessage(x, ['', '123'], 'Value is an invalid base64 string.');
    });

    test('boolean() should validate', () => {
        const x = v().boolean();

        checkUndefined(x, [true, false, 'true', 'false', 1, 0, undefined, null]);
        checkMessage(x, ['', 'asdf'], 'Value is an invalid boolean.');
    });

    test('in() should validate', () => {
        const x = v().in(['test']);

        checkUndefined(x, ['test', undefined, null]);
        checkMessage(
            x,
            [1, {}, [], true, false, 1.1, 'asdf'],
            'Value is not a value of the following: test.',
        );
    });

    test('url() should validate', () => {
        const x = v().url();

        checkUndefined(x, ['stackoverflow.com', undefined, null]);
        checkMessage(x, ['test', 1, {}, []], 'Value is an invalid URL.');
    });

    test('contains() should validate', () => {
        const x = v().contains('2');

        checkUndefined(x, ['2', undefined, null]);
        checkMessage(x, ['1', 2, 'testing'], "Value does not contain '2'.");
    });

    test('min() should validate', () => {
        const x = v().min(1);
        const y = v().min(1, true);
        const msg = 'Value is an invalid number or is lower than 1.';

        checkUndefined(x, [1, undefined, null]);
        checkMessage(x, [0], msg);

        checkUndefined(y, [1, undefined, null]);
        checkMessage(y, ['1', 0], msg);
    });

    test('max() should validate', () => {
        const x = v().max(1);
        const y = v().max(1, true);
        const msg = 'Value is an invalid number or is higher than 1.';

        checkUndefined(x, [1, -1, undefined, null]);
        checkMessage(x, [2], msg);

        checkUndefined(y, [1, -1, undefined, null]);
        checkMessage(y, ['2', 2], msg);
    });

    test('mobilePhone() should validate', () => {
        const x = v().mobilePhone();

        checkUndefined(x, [8005551234, '8005551234', undefined, null]);
        checkMessage(x, ['123', 123, '5551234'], 'Value is an invalid phone number for en-US.');
    });

    test('ipAddress() should validate', () => {
        const x = v().ipAddress();
        const msg = 'Value is an invalid v4 IP address.';

        checkUndefined(x, ['192.168.1.1', '255.255.255.255', undefined, null]);
        checkMessage(x, ['123', '555.12.34', ''], msg);
    });

    test('creditCard() should validate', () => {
        const x = v().creditCard();
        const msg = 'Value is an invalid credit card number.';

        checkUndefined(x, [
            '5105105105105100',
            '4111111111111111',
            '4012888888881881',
            undefined,
            null,
        ]);
        checkMessage(x, ['123', ''], msg);
    });

    test('test() should validate', () => {
        const x = v().test(/^somevalue$/);

        checkUndefined(x, [undefined, null, 'somevalue']);

        checkMessage(x, ['some', 'value'], 'Value is invalid.');
    });
});
