import * as Koa from 'koa';
import * as v from 'validator';
import { exists } from './helpers';

export type ValidatorFn = (value: any, ...args: any[]) => boolean;

export interface IValidator {
    fn: ValidatorFn;
    message: string;
    args: any[];
}

export interface IValidators {
    validate(value: any, label?: string): string | undefined;
    required(): IValidators;
    string(): IValidators;
    email(options?: ValidatorJS.IsEmailOptions): IValidators;
    uuid(version?: number): IValidators;
    number(): IValidators;
    float(options?: ValidatorJS.IsFloatOptions): IValidators;
    currency(options?: ValidatorJS.IsCurrencyOptions): IValidators;
    decimal(): IValidators;
    int(options?: ValidatorJS.IsIntOptions): IValidators;
    length(min?: number, max?: number): IValidators;
    base64(): IValidators;
    boolean(): IValidators;
    in(values: any[]): IValidators;
    url(options?: ValidatorJS.IsURLOptions): IValidators;
    contains(seed: string): IValidators;
}

function applyValidator(v: IValidator, value: string): boolean {
    return v.fn(value, ...v.args);
}

class CompositeValidator implements IValidator {
    constructor(private first: IValidator, private second: IValidator) {}

    message: string;

    args = [];

    fn(value: any) {
        if (!applyValidator(this.first, value)) {
            this.message = this.first.message;
            return false;
        }

        if (!applyValidator(this.second, value)) {
            this.message = this.second.message;
            return false;
        }

        return true;
    }
}

export class ValidatorBuilder implements IValidators {
    constructor(private v?: IValidator) {}

    private addValidator(fn: ValidatorFn, message: string, ...args: any[]): IValidators {
        const validator: IValidator = { fn, message, args };

        if (this.v) {
            return new ValidatorBuilder(new CompositeValidator(validator, this.v));
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

    static defineCustom(name: string, fn: ValidatorFn) {
        Object.defineProperty(ValidatorBuilder.prototype, name, {
            value: function(this: ValidatorBuilder, message: string = 'Invalid') {
                return this.addValidator(fn, message);
            }
        });
    }

    required(): IValidators {
        return this.addValidator((value: any) => exists(value) && value.toString().trim().length > 0, 'is required.');
    }

    string(): IValidators {
        return this.addValidator((value: any) => (!exists(value) ? true : typeof value === 'string'), 'is an invalid string.');
    }

    email(options?: ValidatorJS.IsEmailOptions): IValidators {
        return this.addValidator((value: any, options: ValidatorJS.IsEmailOptions) => (!exists(value) ? true : v.isEmail(value.toString(), options)), 'is an invalid email.', options);
    }

    uuid(version: number = 4): IValidators {
        return this.addValidator((value: any, version: number) => (!exists(value) ? true : v.isUUID(value.toString(), version)), `is an invalid v${version} UUID.`, version);
    }

    number(): IValidators {
        return this.addValidator((value: any) => (!exists(value) ? true : typeof value === 'number' && v.isNumeric(value.toString())), 'is an invalid number.');
    }

    float(options?: ValidatorJS.IsFloatOptions): IValidators {
        return this.addValidator(
            (value: any, options?: ValidatorJS.IsFloatOptions) => (!exists(value) ? true : typeof value === 'number' && v.isFloat(value.toString(), options)),
            'is an invalid float.',
            options
        );
    }

    currency(options?: ValidatorJS.IsCurrencyOptions): IValidators {
        return this.addValidator((value: any, options?: ValidatorJS.IsCurrencyOptions) => (!exists(value) ? true : v.isCurrency(value.toString(), options)), 'is an invalid currency.', options);
    }

    decimal(): IValidators {
        return this.addValidator((value: number) => (!exists(value) ? true : typeof value === 'number' && v.isDecimal(value.toString())), 'is an invalid decimal.');
    }

    int(options?: ValidatorJS.IsIntOptions): IValidators {
        return this.addValidator(
            (value: number, options?: ValidatorJS.IsIntOptions) => (!exists(value) ? true : typeof value === 'number' && v.isInt(value.toString(), options)),
            'is an invalid int.',
            options
        );
    }

    length(min: number = 1, max?: number): IValidators {
        return this.addValidator(
            (value: string, min: number, max?: number) => (!exists(value) ? true : typeof value === 'string' && v.isLength(value, min, max)),
            `is an invalid string or does not have a min length of ${min}${max ? ` and a max length of ${max}` : ''}.`,
            min,
            max
        );
    }

    base64(): IValidators {
        return this.addValidator((value: any) => typeof value === 'string' && v.isBase64(value), 'is an invalid base64 string.');
    }

    boolean(): IValidators {
        return this.addValidator((value: any) => (!exists(value) ? true : v.isBoolean(value.toString())), 'is an invalid boolean.');
    }

    in(values: any[]): IValidators {
        return this.addValidator(
            (value: any, values: any[]) => (!exists(value) ? true : typeof value === 'string' && v.isIn(value, values)),
            `is not a value of the following: ${values.join(',')}.`,
            values
        );
    }

    url(options?: ValidatorJS.IsURLOptions): IValidators {
        return this.addValidator((value: any, options?: ValidatorJS.IsURLOptions) => (!exists(value) ? true : typeof value === 'string' && v.isURL(value, options)), 'is an invalid URL.', options);
    }

    contains(seed: string): IValidators {
        return this.addValidator((value: any, seed: string) => (!exists(value) ? true : typeof value === 'string' && v.contains(value, seed)), `does not contain '${seed}'.`, seed);
    }
}

export const validatorBuilder = (): IValidators => new ValidatorBuilder();

export function addCustom(name: string, fn: ValidatorFn) {
    ValidatorBuilder.defineCustom(name, fn);
}
