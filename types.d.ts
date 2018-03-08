/// <reference types="validator" />

// export { middleware as validation } from './middleware';
import 'koa-bodyparser';
import * as Koa from 'koa';

export interface IValidatorObject {
    [key: string]: IValidators | IValidatorObject;
}

export interface IFilterObject {
    [key: string]: IFilters | IFilterObject;
}

export interface IHooks {
    before?: IFilterObject;
    after?: IFilterObject;
}

declare module 'koa' {
    interface Context {
        validateBody(setup: IValidatorObject, hooks?: IHooks): void;
        validateParams(setup: IValidatorObject, hooks?: IHooks): void;
        validateQuery(setup: IValidatorObject, hooks?: IHooks): void;
        validationErrors: { [key: string]: string };
        params: any;
        query: any;
    }

    // interface Request {
    //     body: any;
    // }
}

export declare function validation(): (ctx: Koa.Context, next: () => Promise<any>) => Promise<void>;

// export { validatorBuilder as v, addCustom as addCustomValidator, IValidators } from './validator-builder';
export interface IValidatorContext {
    obj: any;
    path: string;
    value: any;
}

declare type ValidatorFn = (context: IValidatorContext, ...args: any[]) => boolean;

declare type TPred = (value: any) => boolean;

export interface IValidators {
    validate(value: any, label?: string): string | undefined;
    required(): IValidators;
    requiredIf(path: string, pred: TPred): IValidators;
    requiredNotIf(path: string, pred: TPred): IValidators;
    string(): IValidators;
    email(options?: ValidatorJS.IsEmailOptions): IValidators;
    uuid(version?: number): IValidators;
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
}

export declare const v: () => IValidators;
export declare function addCustomValidator(
    name: string,
    fn: ValidatorFn,
    errorMessage?: string
): void;

// export { filterBuilder as f, addCustom as addCustomFilter, IFilters } from './filter-builder';
declare type FilterFn = (val: string, ...args: any[]) => any;

export interface IFilters {
    filter(value: any): any;
    trim(): IFilters;
    toUpper(): IFilters;
    toLower(): IFilters;
    padStart(len: number, fill?: string): IFilters;
    padEnd(len: number, fill?: string): IFilters;
    normalizeEmail(options?: ValidatorJS.NormalizeEmailOptions): IFilters;
    toInt(radix?: number): IFilters;
    toBoolean(): IFilters;
}

export declare function f(): IFilters;
export declare function addCustomFilter(name: string, fn: FilterFn): void;

// export { exists } from './helpers';
export declare function exists(value: any): boolean;
