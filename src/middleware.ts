import * as Koa from 'koa';
import * as v from 'validator';
import { IValidators, ValidatorBuilder } from './validator-builder';
import { IFilters, FilterBuilder } from './filter-builder';
import set = require('lodash.set');

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

function runValidators(
    ctx: Koa.Context,
    obj: IValidatorObject,
    root: any,
    parent: any,
    parentKey?: string
) {
    for (let key in obj) {
        const builder = obj[key];
        const value = parent && parent[key];
        const path = parentKey ? `${parentKey}.${key}` : key;

        if (builder instanceof ValidatorBuilder) {
            const error = builder.validate({ obj: root, path, value });

            if (error) {
                ctx.validationErrors[path] = error;
            }

            continue;
        }

        runValidators(ctx, builder as IValidatorObject, root, value, path);
    }

    if (!parentKey) {
        if (Object.keys(ctx.validationErrors).length) {
            ctx.throw(422);
        }
    }
}

function runHooks(
    ctx: Koa.Context,
    obj: IFilterObject,
    root: any,
    parent: any,
    parentKey?: string
) {
    for (let key in obj) {
        const builder = obj[key];
        const value = parent && parent[key];
        const path = parentKey ? `${parentKey}.${key}` : key;

        if (value === undefined) {
            if (builder instanceof FilterBuilder) {
                const newValue = builder.filter(value);

                set(root, path, newValue);
            }

            continue;
        }

        if (builder instanceof FilterBuilder) {
            const newValue = builder.filter(value);

            set(root, path, newValue);

            continue;
        }

        runHooks(ctx, builder as IFilterObject, root, value, path);
    }
}

function validate(ctx: Koa.Context, setup: IValidatorObject, obj: any, hooks?: IHooks) {
    if (
        hooks !== undefined &&
        hooks !== null &&
        hooks.before !== undefined &&
        hooks.before !== null
    ) {
        runHooks(ctx, hooks.before, obj, obj);
    }

    runValidators(ctx, setup, obj, obj);

    if (
        hooks !== undefined &&
        hooks !== null &&
        hooks.after !== undefined &&
        hooks.after !== null
    ) {
        runHooks(ctx, hooks.after, obj, obj);
    }
}

function validateBody(this: Koa.Context, setup: IValidatorObject, hooks?: IHooks) {
    if (this.request.body === undefined) {
        throw new Error('ctx.request.body is missing. You must use a body parser.');
    }

    validate(this, setup, this.request.body, hooks);
}

function validateParams(this: Koa.Context, setup: IValidatorObject, hooks?: IHooks) {
    if (this.params === undefined) {
        throw new Error('ctx.params is missing. Try using a router.');
    }

    validate(this, setup, this.params, hooks);
}

function validateQuery(this: Koa.Context, setup: IValidatorObject, hooks?: IHooks) {
    validate(this, setup, this.query, hooks);
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
