import v from 'validator';
import CompositeValidator from './composite-validator';
import { exists } from './helpers';
import _get = require('lodash.get');

export type ValidatorFn = (
    context: ValidatorContext,
    ...args: any[]
) => boolean;
export type TPred = (value: any) => boolean;

export interface Validator {
    fn: ValidatorFn;
    message: string;
    args: any[];
}

export interface ValidatorContext {
    obj: any;
    path: string;
    value: any;
}

export interface Validators {
    validate(value: any, label?: string): string | undefined;
    required(): Validators;
    requiredIf(path: string, pred: TPred): Validators;
    requiredNotIf(path: string, pred: TPred): Validators;
    notNull(): Validators;
    string(): Validators;
    email(options?: ValidatorJS.IsEmailOptions): Validators;
    uuid(version?: UUIDVersion): Validators;
    number(strict?: boolean): Validators;
    float(strict?: boolean, options?: ValidatorJS.IsFloatOptions): Validators;
    currency(options?: ValidatorJS.IsCurrencyOptions): Validators;
    decimal(strict?: boolean): Validators;
    int(strict?: boolean, options?: ValidatorJS.IsIntOptions): Validators;
    length(min?: number, max?: number): Validators;
    base64(): Validators;
    boolean(): Validators;
    in(values: any[]): Validators;
    url(options?: ValidatorJS.IsURLOptions): Validators;
    contains(seed: string): Validators;
    min(num: number, strict?: boolean): Validators;
    max(num: number, strict?: boolean): Validators;
    mobilePhone(locale?: ValidatorJS.MobilePhoneLocale): Validators;
    ipAddress(version?: number): Validators;
    creditCard(): Validators;
    test(regex: RegExp): Validators;
}

type UUIDVersion = 4 | 3 | 5 | '3' | '4' | '5' | 'all';

export function applyValidator(v: Validator, value: any): boolean {
    return v.fn(value, ...v.args);
}

function required(value: any) {
    return (
        exists(value) &&
        (Array.isArray(value) || value.toString().trim().length > 0)
    );
}

export class ValidatorBuilder implements Validators {
    private v?: Validator;

    public static defineCustom(
        name: string,
        fn: ValidatorFn,
        errorMessage: string,
    ) {
        Object.defineProperty(ValidatorBuilder.prototype, name, {
            value(this: ValidatorBuilder, ...args: any[]) {
                return this.addValidator(fn, errorMessage, ...args);
            },
        });
    }

    public constructor(v?: Validator) {
        this.v = v;
    }

    private addValidator(
        fn: ValidatorFn,
        message: string,
        ...args: any[]
    ): Validators {
        const validator: Validator = { fn, message, args };

        if (this.v) {
            return new ValidatorBuilder(
                new CompositeValidator(this.v, validator),
            );
        }

        this.v = validator;
        return this;
    }

    public validate(value: any, label = 'Value'): string | undefined {
        if (this.v === undefined) {
            throw new Error('No validators specified!');
        }

        const isValid = applyValidator(this.v, value);

        if (!isValid) {
            return `${label} ${this.v.message}`;
        }
    }

    public required(): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext) => required(value),
            'is required.',
        );
    }

    public requiredIf(path: string, pred: TPred): Validators {
        return this.addValidator(
            (ctx: ValidatorContext, path: string, pred: TPred) => {
                if (pred(_get(ctx.obj, path))) {
                    return required(ctx.value);
                }

                return true;
            },
            'is required.',
            path,
            pred,
        );
    }

    public requiredNotIf(path: string, pred: TPred): Validators {
        return this.requiredIf(path, (value: any) => !pred(value));
    }

    public notNull(): Validators {
        return this.addValidator(({ value }: ValidatorContext) => {
            // if the value is defined, we need to make sure it's not null
            if (value !== undefined && value === null) {
                return false;
            }

            return true;
        }, 'cannot be null if defined.');
    }

    public string(): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext) =>
                !exists(value) ? true : typeof value === 'string',
            'is an invalid string.',
        );
    }

    public email(options?: ValidatorJS.IsEmailOptions): Validators {
        return this.addValidator(
            (
                { value }: ValidatorContext,
                options: ValidatorJS.IsEmailOptions,
            ) => (!exists(value) ? true : v.isEmail(value.toString(), options)),
            'is an invalid email.',
            options,
        );
    }

    public uuid(version: UUIDVersion = 4): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext, version: UUIDVersion) =>
                !exists(value) ? true : v.isUUID(value.toString(), version),
            `is an invalid UUID (version: ${version}).`,
            version,
        );
    }

    public number(strict = false): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext, strict: boolean) => {
                if (!exists(value)) {
                    return true;
                }

                if (strict && typeof value !== 'number') {
                    return false;
                }

                return v.isNumeric(value.toString());
            },
            'is an invalid number.',
            strict,
        );
    }

    public float(
        strict = false,
        options?: ValidatorJS.IsFloatOptions,
    ): Validators {
        return this.addValidator(
            (
                { value }: ValidatorContext,
                strict: boolean,
                options?: ValidatorJS.IsFloatOptions,
            ) => {
                if (!exists(value)) {
                    return true;
                }

                if (strict && typeof value !== 'number') {
                    return false;
                }

                return v.isFloat(value.toString(), options);
            },
            'is an invalid float.',
            strict,
            options,
        );
    }

    public currency(options?: ValidatorJS.IsCurrencyOptions): Validators {
        return this.addValidator(
            (
                { value }: ValidatorContext,
                options?: ValidatorJS.IsCurrencyOptions,
            ) =>
                !exists(value) ? true : v.isCurrency(value.toString(), options),
            'is an invalid currency.',
            options,
        );
    }

    public decimal(strict = false): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext, strict: boolean) => {
                if (!exists(value)) {
                    return true;
                }

                if (strict && typeof value !== 'number') {
                    return false;
                }

                return v.isDecimal(value.toString());
            },
            'is an invalid decimal.',
            strict,
        );
    }

    public int(strict = false, options?: ValidatorJS.IsIntOptions): Validators {
        return this.addValidator(
            (
                { value }: ValidatorContext,
                strict: boolean,
                options?: ValidatorJS.IsIntOptions,
            ) => {
                if (!exists(value)) {
                    return true;
                }

                if (strict && typeof value !== 'number') {
                    return false;
                }

                return v.isInt(value.toString(), options);
            },
            'is an invalid int.',
            strict,
            options,
        );
    }

    public length(min = 1, max?: number): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext, min: number, max?: number) =>
                !exists(value)
                    ? true
                    : typeof value === 'string' && v.isLength(value, min, max),
            `is an invalid string or does not have a min length of ${min}${
                max ? ` and a max length of ${max}` : ''
            }.`,
            min,
            max,
        );
    }

    public base64(): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext) =>
                !exists(value)
                    ? true
                    : typeof value === 'string' && v.isBase64(value),
            'is an invalid base64 string.',
        );
    }

    public boolean(): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext) =>
                !exists(value) ? true : v.isBoolean(value.toString()),
            'is an invalid boolean.',
        );
    }

    public in(values: any[]): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext, values: any[]) =>
                !exists(value)
                    ? true
                    : typeof value === 'string' && v.isIn(value, values),
            `is not a value of the following: ${values.join(',')}.`,
            values,
        );
    }

    public url(options?: ValidatorJS.IsURLOptions): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext, options?: ValidatorJS.IsURLOptions) =>
                !exists(value)
                    ? true
                    : typeof value === 'string' && v.isURL(value, options),
            'is an invalid URL.',
            options,
        );
    }

    public contains(seed: string): Validators {
        if (typeof seed !== 'string') {
            throw new Error(`${seed} is an invalid string.`);
        }

        return this.addValidator(
            ({ value }: ValidatorContext, seed: string) =>
                !exists(value)
                    ? true
                    : typeof value === 'string' && v.contains(value, seed),
            `does not contain '${seed}'.`,
            seed,
        );
    }

    public min(num: number, strict = false): Validators {
        if (typeof num !== 'number') {
            throw new Error(`${num} is an invalid number.`);
        }

        return this.addValidator(
            ({ value }: ValidatorContext, num: number, strict: boolean) => {
                if (!exists(value)) {
                    return true;
                }

                if (strict && typeof value !== 'number') {
                    return false;
                }

                return !isNaN(value) && parseFloat(value) >= num;
            },
            `is an invalid number or is lower than ${num}.`,
            num,
            strict,
        );
    }

    public max(num: number, strict = false): Validators {
        if (typeof num !== 'number') {
            throw new Error(`${num} is an invalid number.`);
        }

        return this.addValidator(
            ({ value }: ValidatorContext, num: number, strict: boolean) => {
                if (!exists(value)) {
                    return true;
                }

                if (strict && typeof value !== 'number') {
                    return false;
                }

                return !isNaN(value) && parseFloat(value) <= num;
            },
            `is an invalid number or is higher than ${num}.`,
            num,
            strict,
        );
    }

    public mobilePhone(
        locale: ValidatorJS.MobilePhoneLocale = 'en-US',
    ): Validators {
        return this.addValidator(
            (
                { value }: ValidatorContext,
                locale: ValidatorJS.MobilePhoneLocale,
            ) =>
                !exists(value)
                    ? true
                    : v.isMobilePhone(value.toString(), locale),
            `is an invalid phone number for ${locale}.`,
            locale,
        );
    }

    public ipAddress(version?: number): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext, version?: number) =>
                !exists(value) ? true : v.isIP(value, version),
            `is an invalid v${version || 4} IP address.`,
            version,
        );
    }

    public creditCard(): Validators {
        return this.addValidator(
            ({ value }: ValidatorContext) =>
                !exists(value) ? true : v.isCreditCard(value),
            'is an invalid credit card number.',
        );
    }

    public test(regex: RegExp) {
        return this.addValidator(
            ({ value }: ValidatorContext) =>
                !exists(value) ? true : regex.test(value),
            'is invalid.',
            regex,
        );
    }
}

export const validatorBuilder = (): Validators => new ValidatorBuilder();

export function addCustom(
    name: string,
    fn: ValidatorFn,
    errorMessage = 'Invalid',
) {
    ValidatorBuilder.defineCustom(name, fn, errorMessage);
}
