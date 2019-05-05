import v from 'validator';
import CompositeValidator from './composite-validator';
import { exists } from './helpers';
import _get = require('lodash.get');

export type ValidatorFn = (context: IValidatorContext, ...args: any[]) => boolean;
export type TPred = (value: any) => boolean;

export interface IValidator {
    fn: ValidatorFn;
    message: string;
    args: any[];
}

export interface IValidatorContext {
    obj: any;
    path: string;
    value: any;
}

export interface IValidators {
    validate(value: any, label?: string): string | undefined;
    required(): IValidators;
    requiredIf(path: string, pred: TPred): IValidators;
    requiredNotIf(path: string, pred: TPred): IValidators;
    notNull(): IValidators;
    string(): IValidators;
    email(options?: ValidatorJS.IsEmailOptions): IValidators;
    uuid(version?: UUIDVersion): IValidators;
    number(strict?: boolean): IValidators;
    float(strict?: boolean, options?: ValidatorJS.IsFloatOptions): IValidators;
    currency(options?: ValidatorJS.IsCurrencyOptions): IValidators;
    decimal(strict?: boolean): IValidators;
    int(strict?: boolean, options?: ValidatorJS.IsIntOptions): IValidators;
    length(min?: number, max?: number): IValidators;
    base64(): IValidators;
    boolean(): IValidators;
    in(values: any[]): IValidators;
    url(options?: ValidatorJS.IsURLOptions): IValidators;
    contains(seed: string): IValidators;
    min(num: number, strict?: boolean): IValidators;
    max(num: number, strict?: boolean): IValidators;
    mobilePhone(locale?: ValidatorJS.MobilePhoneLocale): IValidators;
    ipAddress(version?: number): IValidators;
    creditCard(): IValidators;
    test(regex: RegExp): IValidators;
}

type UUIDVersion = 4 | 3 | 5 | '3' | '4' | '5' | 'all';

export function applyValidator(v: IValidator, value: any): boolean {
    return v.fn(value, ...v.args);
}

function required(value: any) {
    return exists(value) && (Array.isArray(value) || value.toString().trim().length > 0);
}

export class ValidatorBuilder implements IValidators {
    static defineCustom(name: string, fn: ValidatorFn, errorMessage: string) {
        Object.defineProperty(ValidatorBuilder.prototype, name, {
            value(this: ValidatorBuilder, ...args: any[]) {
                return this.addValidator(fn, errorMessage, ...args);
            },
        });
    }

    constructor(private v?: IValidator) {}

    private addValidator(fn: ValidatorFn, message: string, ...args: any[]): IValidators {
        const validator: IValidator = { fn, message, args };

        if (this.v) {
            return new ValidatorBuilder(new CompositeValidator(this.v, validator));
        }

        this.v = validator;
        return this;
    }

    validate(value: any, label: string = 'Value'): string | undefined {
        if (this.v === undefined) {
            throw new Error('No validators specified!');
        }

        const isValid = applyValidator(this.v, value);

        if (!isValid) {
            return `${label} ${this.v.message}`;
        }
    }

    required(): IValidators {
        return this.addValidator(({ value }: IValidatorContext) => required(value), 'is required.');
    }

    requiredIf(path: string, pred: TPred): IValidators {
        return this.addValidator(
            (ctx: IValidatorContext, path: string, pred: TPred) => {
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

    requiredNotIf(path: string, pred: TPred): IValidators {
        return this.requiredIf(path, (value: any) => !pred(value));
    }

    notNull(): IValidators {
        return this.addValidator(({ value }: IValidatorContext) => {
            // if the value is defined, we need to make sure it's not null
            if (value !== undefined && value === null) {
                return false;
            }

            return true;
        }, 'cannot be null if defined.');
    }

    string(): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext) => (!exists(value) ? true : typeof value === 'string'),
            'is an invalid string.',
        );
    }

    email(options?: ValidatorJS.IsEmailOptions): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, options: ValidatorJS.IsEmailOptions) =>
                !exists(value) ? true : v.isEmail(value.toString(), options),
            'is an invalid email.',
            options,
        );
    }

    uuid(version: UUIDVersion = 4): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, version: UUIDVersion) =>
                !exists(value) ? true : v.isUUID(value.toString(), version),
            `is an invalid UUID (version: ${version}).`,
            version,
        );
    }

    number(strict: boolean = false): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, strict: boolean) => {
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

    float(strict: boolean = false, options?: ValidatorJS.IsFloatOptions): IValidators {
        return this.addValidator(
            (
                { value }: IValidatorContext,
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

    currency(options?: ValidatorJS.IsCurrencyOptions): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, options?: ValidatorJS.IsCurrencyOptions) =>
                !exists(value) ? true : v.isCurrency(value.toString(), options),
            'is an invalid currency.',
            options,
        );
    }

    decimal(strict: boolean = false): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, strict: boolean) => {
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

    int(strict: boolean = false, options?: ValidatorJS.IsIntOptions): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, strict: boolean, options?: ValidatorJS.IsIntOptions) => {
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

    length(min: number = 1, max?: number): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, min: number, max?: number) =>
                !exists(value) ? true : typeof value === 'string' && v.isLength(value, min, max),
            `is an invalid string or does not have a min length of ${min}${
                max ? ` and a max length of ${max}` : ''
            }.`,
            min,
            max,
        );
    }

    base64(): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext) =>
                !exists(value) ? true : typeof value === 'string' && v.isBase64(value),
            'is an invalid base64 string.',
        );
    }

    boolean(): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext) =>
                !exists(value) ? true : v.isBoolean(value.toString()),
            'is an invalid boolean.',
        );
    }

    in(values: any[]): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, values: any[]) =>
                !exists(value) ? true : typeof value === 'string' && v.isIn(value, values),
            `is not a value of the following: ${values.join(',')}.`,
            values,
        );
    }

    url(options?: ValidatorJS.IsURLOptions): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, options?: ValidatorJS.IsURLOptions) =>
                !exists(value) ? true : typeof value === 'string' && v.isURL(value, options),
            'is an invalid URL.',
            options,
        );
    }

    contains(seed: string): IValidators {
        if (typeof seed !== 'string') {
            throw new Error(`${seed} is an invalid string.`);
        }

        return this.addValidator(
            ({ value }: IValidatorContext, seed: string) =>
                !exists(value) ? true : typeof value === 'string' && v.contains(value, seed),
            `does not contain '${seed}'.`,
            seed,
        );
    }

    min(num: number, strict: boolean = false): IValidators {
        if (typeof num !== 'number') {
            throw new Error(`${num} is an invalid number.`);
        }

        return this.addValidator(
            ({ value }: IValidatorContext, num: number, strict: boolean) => {
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

    max(num: number, strict: boolean = false): IValidators {
        if (typeof num !== 'number') {
            throw new Error(`${num} is an invalid number.`);
        }

        return this.addValidator(
            ({ value }: IValidatorContext, num: number, strict: boolean) => {
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

    mobilePhone(locale: ValidatorJS.MobilePhoneLocale = 'en-US'): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, locale: ValidatorJS.MobilePhoneLocale) =>
                !exists(value) ? true : v.isMobilePhone(value.toString(), locale),
            `is an invalid phone number for ${locale}.`,
            locale,
        );
    }

    ipAddress(version?: number): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext, version?: number) =>
                !exists(value) ? true : v.isIP(value, version),
            `is an invalid v${version || 4} IP address.`,
            version,
        );
    }

    creditCard(): IValidators {
        return this.addValidator(
            ({ value }: IValidatorContext) => (!exists(value) ? true : v.isCreditCard(value)),
            'is an invalid credit card number.',
        );
    }

    test(regex: RegExp) {
        return this.addValidator(
            ({ value }: IValidatorContext) => (!exists(value) ? true : regex.test(value)),
            'is invalid.',
            regex,
        );
    }
}

export const validatorBuilder = (): IValidators => new ValidatorBuilder();

export function addCustom(name: string, fn: ValidatorFn, errorMessage: string = 'Invalid') {
    ValidatorBuilder.defineCustom(name, fn, errorMessage);
}
