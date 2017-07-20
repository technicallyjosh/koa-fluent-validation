import * as Koa from 'koa';
import { IValidators, ValidatorBuilder } from './validator-builder';
import { IFilters, FilterBuilder } from './filter-builder';
import * as v from 'validator';
import set = require('lodash.set');

declare module 'koa' {
    interface Context {
        validateBody(validations: IValidations, hooks?: IHooks): void;
        validateParams(validations: IValidations, hooks?: IHooks): void;
        validateQuery(validations: IValidations, hooks?: IHooks): void;
        validationErrors: { [key: string]: string };
        params: any;
        query: any;
    }

    interface Request {
        body: any;
    }
}

export interface IValidations {
    [key: string]: IValidators | IValidations;
}

export interface IFiltrations {
    [key: string]: IFilters | IFiltrations;
}

export interface IHooks {
    before?: IFiltrations;
    after?: IFiltrations;
}

function runValidators(ctx: Koa.Context, validators: IValidations, parent: any = ctx.request.body, parentKey?: string) {
    for (let key in validators) {
        const builder = validators[key];
        const value = parent && parent[key];
        const path = parentKey ? `${parentKey}.${key}` : key;

        if (builder instanceof ValidatorBuilder) {
            const error = builder.validate(value);

            if (error) {
                ctx.validationErrors[path] = error;
            }

            continue;
        }

        runValidators(ctx, builder as IValidations, value, path);
    }

    if (Object.keys(ctx.validationErrors).length) {
        ctx.throw(422);
    }
}

function runHooks(ctx: Koa.Context, filters: IFiltrations, parent: any = ctx.request.body, parentKey?: string) {
    for (let key in filters) {
        const builder = filters[key];
        const value = parent && parent[key];
        const path = parentKey ? `${parentKey}.${key}` : key;

        if (value === undefined) {
            continue;
        }

        if (builder instanceof FilterBuilder) {
            const newValue = builder.filter(value);

            set(ctx.request.body, path, newValue);

            continue;
        }

        runHooks(ctx, builder as IFiltrations, value, path);
    }
}

function validate(ctx: Koa.Context, options: IValidations, hooks?: IHooks) {
    if (hooks !== undefined && hooks !== null && hooks.before !== undefined && hooks.before !== null) {
        runHooks(ctx, hooks.before);
    }

    runValidators(ctx, options);

    if (hooks !== undefined && hooks !== null && hooks.after !== undefined && hooks.after !== null) {
        runHooks(ctx, hooks.after);
    }
}

function validateBody(this: Koa.Context, options: IValidations, hooks?: IHooks) {
    if (this.request.body === undefined) {
        throw new Error('ctx.request.body is missing. You must use a body parser.');
    }

    validate(this, options, hooks);
}

function validateParams(this: Koa.Context, options: IValidations, hooks?: IHooks) {
    if (this.params === undefined) {
        throw new Error('ctx.params is missing. Try using a router.');
    }

    validate(this, options, hooks);
}

function validateQuery(this: Koa.Context, options: IValidations, hooks?: IHooks) {
    // no need to check as it's built into koa

    validate(this, options, hooks);
}

export function middleware() {
    return async (ctx: Koa.Context, next: () => Promise<any>) => {
        ctx.validateBody = validateBody;
        ctx.validateParams = validateParams;
        ctx.validateQuery = validateQuery;
        ctx.validationErrors = {};

        await next();
    };
}
